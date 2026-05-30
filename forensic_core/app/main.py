from __future__ import annotations

from contextlib import asynccontextmanager
import os
import time
from typing import AsyncIterator

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.routers.audit_routes import audit_router
from app.routers.ops_routes import ops_router
from app.state import build_service_state


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    app.state.service_state = build_service_state()
    yield


app = FastAPI(title="Forensic Core", version="0.1.0", lifespan=lifespan)


@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    started_at = time.perf_counter()
    response = await call_next(request)
    elapsed_ms = (time.perf_counter() - started_at) * 1000
    response.headers["x-process-time-ms"] = f"{elapsed_ms:.2f}"
    return response


@app.middleware("http")
async def enforce_service_token(request: Request, call_next):
    # Health route remains open for uptime probes.
    if request.url.path in {"/health"}:
        return await call_next(request)

    expected_token = os.getenv("FORENSIC_CORE_SERVICE_TOKEN", "").strip()
    # If token is not configured, deny all protected traffic.
    if not expected_token:
        return JSONResponse(
            status_code=503,
            content={
                "error": "SERVICE_TOKEN_UNCONFIGURED",
                "message": "Forensic core service token is not configured.",
            },
        )

    auth_header = request.headers.get("authorization", "")
    if not auth_header.startswith("Bearer "):
        return JSONResponse(
            status_code=401,
            content={
                "error": "UNAUTHORIZED",
                "message": "Missing bearer token.",
            },
        )

    provided_token = auth_header.removeprefix("Bearer ").strip()
    if provided_token != expected_token:
        return JSONResponse(
            status_code=401,
            content={
                "error": "UNAUTHORIZED",
                "message": "Invalid bearer token.",
            },
        )

    return await call_next(request)


@app.exception_handler(Exception)
async def handle_unexpected_exception(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "error": "INTERNAL_SERVER_ERROR",
            "message": "Unexpected failure in forensic core.",
            "path": request.url.path,
        },
    )


app.include_router(audit_router)
app.include_router(ops_router)

