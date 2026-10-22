# V.A.L.A.A.R. — Your Personal AI Command Center

V.A.L.A.A.R. is a personal command center combining task management, a web dashboard, and AI-agent tool integration.

The project uses React, TypeScript, FastAPI, PostgreSQL, SQLAlchemy, and the Model Context Protocol (MCP).

> **Status:** Active development. Core task-management flows and local MCP tool calls have been tested. Direct Alexa+ integration, authentication, and production deployment are not yet implemented.

## Features

- Create, list, update, and delete tasks.
- Organize tasks by status and priority.
- Persist tasks in PostgreSQL.
- Access task operations through a REST API.
- Expose four task-management tools through an MCP server using Streamable HTTP.
- Use a responsive, dark-themed React dashboard.
- Check backend health and readiness.

## Technology stack

| Layer | Technologies |
|---|---|
| Frontend | React, TypeScript, Vite |
| Backend | Python, FastAPI, Uvicorn |
| Database | PostgreSQL, SQLAlchemy, asyncpg |
| AI integration | MCP Python SDK, Streamable HTTP |
| Configuration | pydantic-settings |

## Architecture

```text
Browser
   |
   v
React + TypeScript
   |
   v
FastAPI REST API ------> PostgreSQL
                            ^
                            |
Compatible MCP client       |
   |                        |
   v                        |
MCP Streamable HTTP server -+
```

## Project structure

- `backend/app/api/` — REST API routes
- `backend/app/core/` — configuration
- `backend/app/db/` — database sessions
- `backend/app/mcp/` — MCP server and tools
- `backend/app/models/` — database models
- `backend/app/schemas/` — request and response schemas
- `frontend/src/` — React application
- `docs/` — project documentation

## Requirements

- Python 3.11+
- Node.js and npm
- PostgreSQL
- Git

## Local setup

### 1. Backend configuration

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Edit `backend/.env` with your own PostgreSQL connection URL and local CORS settings. The tested setup uses PostgreSQL with `asyncpg`; make sure the database and database user exist.

Never commit passwords, tokens, or other secrets.

### 2. Start the API

From the `backend/` directory:

```bash
.venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Endpoints:

- Health: `http://localhost:8000/api/v1/health`
- Readiness: `http://localhost:8000/api/v1/ready`
- API documentation: `http://localhost:8000/docs`

### 3. Start the frontend

In another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the URL printed by Vite, normally `http://localhost:5173`.

Set `VITE_API_BASE_URL` to `http://localhost:8000` if necessary.

### 4. Start the MCP server

In another terminal:

```bash
cd backend
.venv/bin/python -m app.mcp.server
```

Local MCP endpoint:

`http://127.0.0.1:8001/mcp`

## REST API

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/v1/tasks` | Create a task |
| GET | `/api/v1/tasks` | List tasks |
| GET | `/api/v1/tasks/{task_id}` | Retrieve a task |
| PATCH | `/api/v1/tasks/{task_id}` | Update a task |
| DELETE | `/api/v1/tasks/{task_id}` | Delete a task |

Statuses: `todo`, `in_progress`, `done`.

Priorities: `low`, `medium`, `high`.

## MCP tools

| Tool | Purpose |
|---|---|
| `list_tasks` | List tasks, optionally filtered by status |
| `create_task` | Create a task |
| `update_task_status` | Change a task's status |
| `delete_task` | Delete a task by ID |

The MCP server was tested locally with an MCP client using Streamable HTTP and protocol version `2025-11-25`. An MCP-compatible client is required. Direct Alexa+ connectivity has not been verified.

## Security and limitations

- Authentication and per-user task isolation are not implemented.
- The MCP endpoint has no authentication and is intended for local development.
- Do not expose development services publicly without appropriate security controls.
- Production deployment and direct Alexa+ integration remain future work.

## Roadmap

- Add authentication and user-specific task ownership.
- Add automated tests and continuous integration.
- Improve validation, error handling, and observability.
- Explore secure deployment and AI-assistant integrations.

## License

Released under the MIT License. See `LICENSE`.
