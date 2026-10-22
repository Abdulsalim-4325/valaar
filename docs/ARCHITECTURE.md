# VALAAR Architecture

## Overview

VALAAR contains three main components:

1. A React and TypeScript dashboard.
2. A FastAPI REST API connected to PostgreSQL.
3. An MCP server that exposes task operations to compatible AI clients.

## Dashboard request flow

The browser sends HTTP requests to FastAPI. The API validates input through Pydantic schemas and uses SQLAlchemy's asynchronous database session to read or modify task records in PostgreSQL.

## MCP request flow

An MCP-compatible client connects to the Streamable HTTP endpoint at `/mcp`. The server exposes four tools:

- `list_tasks`
- `create_task`
- `update_task_status`
- `delete_task`

The MCP server uses the shared task model and database session infrastructure. Changes made through either interface persist in the database.

## Task data model

A task includes:

- `id`: database-generated identifier
- `title`: task title
- `description`: optional description
- `status`: `todo`, `in_progress`, or `done`
- `priority`: `low`, `medium`, or `high`
- `due_at`: optional due date
- `created_at`: creation timestamp
- `updated_at`: last-update timestamp

## Local development endpoints

| Component | Address |
|---|---|
| Frontend | `http://localhost:5173` |
| REST API | `http://localhost:8000` |
| API documentation | `http://localhost:8000/docs` |
| MCP endpoint | `http://127.0.0.1:8001/mcp` |

## Security boundaries

The current implementation is intended for local development. Authentication, user-level authorization, and per-user task isolation are not implemented. The MCP server must not be exposed publicly without additional security controls.

## Current limitations

Direct Alexa+ integration, production deployment, and automated test coverage have not been established as completed features.
