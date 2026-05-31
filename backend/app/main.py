from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager

from app.database import init_db
from app.routers import inventory, dashboard, zombies, reports, webhooks


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

app = FastAPI(
    title="ZADDP - Zombie API Discovery & Defence Platform",
    description="Command center for discovering, classifying, securing, and decommissioning zombie and shadow APIs",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost", "http://localhost:80", "http://frontend:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(inventory.router)
app.include_router(dashboard.router)
app.include_router(zombies.router)
app.include_router(reports.router)
app.include_router(webhooks.router)


@app.get("/api/v1/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0", "uptime": "running"}


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"success": False, "error": "Internal server error", "message": str(exc)},
    )
