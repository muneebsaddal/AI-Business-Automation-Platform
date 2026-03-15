"""FastAPI application entry point."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    # Startup
    print(f"Starting AI Automation Platform [{settings.ENVIRONMENT}]")
    print(f"LLM: {'OpenAI ' + settings.OPENAI_MODEL if settings.USE_OPENAI else 'Ollama ' + settings.OLLAMA_MODEL}")
    yield
    # Shutdown
    print("Shutting down...")


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


@app.get("/health", tags=["system"])
async def health_check():
    """Health check endpoint."""
    return {
        "status": "ok",
        "environment": settings.ENVIRONMENT,
        "llm": settings.OPENAI_MODEL if settings.USE_OPENAI else settings.OLLAMA_MODEL,
    }
