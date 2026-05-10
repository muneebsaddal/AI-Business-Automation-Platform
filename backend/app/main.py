"""FastAPI application entry point."""

import logging
import traceback
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.routers import auth as auth_router
from app.routers import execute as execute_router
from app.routers import tasks as tasks_router
from app.routers import ws as ws_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting AI Automation Platform [{settings.ENVIRONMENT}]")
    llm_name = (
        f"OpenAI {settings.OPENAI_MODEL}"
        if settings.USE_OPENAI
        else f"Ollama {settings.OLLAMA_MODEL}"
    )
    logger.info(f"LLM: {llm_name}")
    yield
    logger.info("Shutting down...")


app = FastAPI(
    title="AI Automation Platform",
    description="Multi-agent AI operations platform for business automation.",
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Log full traceback for any unhandled exception."""
    logger.error(f"Unhandled error on {request.method} {request.url}:\n{traceback.format_exc()}")
    return JSONResponse(status_code=500, content={"detail": str(exc)})


app.include_router(auth_router.router)
app.include_router(execute_router.router)
app.include_router(tasks_router.router)
app.include_router(ws_router.router)


@app.get("/health", tags=["system"])
async def health_check():
    return {
        "status": "ok",
        "environment": settings.ENVIRONMENT,
        "llm": settings.OPENAI_MODEL if settings.USE_OPENAI else settings.OLLAMA_MODEL,
    }
