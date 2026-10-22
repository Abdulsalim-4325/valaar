from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.api.routes.tasks import router as tasks_router
from app.core.config import get_settings
from app.db.base import Base
from app.db.session import engine
from app.models.task import Task  # Registers the Task model with Base.metadata.


settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)

        # Verify the database is reachable.
        await connection.execute(text("SELECT 1"))

    yield

    await engine.dispose()


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="V.A.L.A.A.R. — an action-oriented personal AI command center.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(tasks_router)


@app.get("/", tags=["System"])
async def root() -> dict[str, str]:
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "message": "V.A.L.A.A.R. backend is running.",
        "docs": "/docs",
    }


@app.get("/api/v1/health", tags=["System"])
async def health() -> dict[str, str]:
    return {
        "status": "ok",
        "service": "valaar-api",
        "version": settings.app_version,
    }


@app.get("/api/v1/ready", tags=["System"])
async def readiness() -> dict[str, str]:
    async with engine.connect() as connection:
        result = await connection.execute(
            text("SELECT current_database(), current_user")
        )
        database, username = result.one()

    return {
        "status": "ready",
        "database": database,
        "database_user": username,
    }
