"""VALAAR MCP server using Streamable HTTP transport."""

import asyncio
import json
from datetime import datetime, timezone

from mcp.server.mcpserver import MCPServer
from sqlalchemy import select

from app.db.session import AsyncSessionLocal
from app.models.task import Task


server = MCPServer(
    name="VALAAR Personal AI Command Center",
    version="0.1.0",
    instructions=(
        "Manage the user's VALAAR tasks. List existing tasks, create tasks, "
        "change task status, and delete tasks only when explicitly requested."
    ),
)


def task_to_dict(task: Task) -> dict:
    """Convert a database task into JSON-safe data."""
    return {
        "id": task.id,
        "title": task.title,
        "description": task.description,
        "status": task.status,
        "priority": task.priority,
        "due_at": task.due_at.isoformat() if task.due_at else None,
        "created_at": task.created_at.isoformat() if task.created_at else None,
        "updated_at": task.updated_at.isoformat() if task.updated_at else None,
    }


@server.tool()
async def list_tasks(
    status: str | None = None,
    limit: int = 20,
) -> str:
    """List tasks, optionally filtering by status. Status: todo, in_progress, done."""
    if status is not None and status not in {"todo", "in_progress", "done"}:
        return json.dumps({"error": "Invalid status."})

    limit = max(1, min(limit, 100))

    async with AsyncSessionLocal() as db:
        query = select(Task).order_by(Task.id.desc()).limit(limit)

        if status:
            query = query.where(Task.status == status)

        result = await db.execute(query)
        tasks = result.scalars().all()

        return json.dumps(
            {"count": len(tasks), "tasks": [task_to_dict(task) for task in tasks]}
        )


@server.tool()
async def create_task(
    title: str,
    description: str = "",
    priority: str = "medium",
    due_at: str | None = None,
) -> str:
    """Create a task. Priority must be low, medium, or high. Optional due_at is ISO 8601."""
    title = title.strip()

    if not title:
        return json.dumps({"error": "Task title cannot be empty."})

    if priority not in {"low", "medium", "high"}:
        return json.dumps({"error": "Priority must be low, medium, or high."})

    parsed_due_at = None
    if due_at:
        try:
            parsed_due_at = datetime.fromisoformat(due_at.replace("Z", "+00:00"))
        except ValueError:
            return json.dumps({"error": "due_at must be a valid ISO 8601 datetime."})

    async with AsyncSessionLocal() as db:
        task = Task(
            title=title,
            description=description.strip(),
            priority=priority,
            status="todo",
            due_at=parsed_due_at,
        )
        db.add(task)
        await db.commit()
        await db.refresh(task)

        return json.dumps({"message": "Task created.", "task": task_to_dict(task)})


@server.tool()
async def update_task_status(task_id: int, status: str) -> str:
    """Change a task's status to todo, in_progress, or done."""
    if status not in {"todo", "in_progress", "done"}:
        return json.dumps(
            {"error": "Status must be todo, in_progress, or done."}
        )

    async with AsyncSessionLocal() as db:
        task = await db.get(Task, task_id)

        if task is None:
            return json.dumps({"error": f"Task {task_id} was not found."})

        task.status = status
        task.updated_at = datetime.now(timezone.utc)
        await db.commit()
        await db.refresh(task)

        return json.dumps({"message": "Task status updated.", "task": task_to_dict(task)})


@server.tool()
async def delete_task(task_id: int) -> str:
    """Permanently delete a task by its numeric ID."""
    async with AsyncSessionLocal() as db:
        task = await db.get(Task, task_id)

        if task is None:
            return json.dumps({"error": f"Task {task_id} was not found."})

        deleted_title = task.title
        await db.delete(task)
        await db.commit()

        return json.dumps(
            {"message": "Task deleted.", "id": task_id, "title": deleted_title}
        )


async def main() -> None:
    print("Starting VALAAR MCP server at http://127.0.0.1:8001/mcp")
    await server.run_streamable_http_async(
        host="127.0.0.1",
        port=8001,
        streamable_http_path="/mcp",
    )


if __name__ == "__main__":
    asyncio.run(main())
