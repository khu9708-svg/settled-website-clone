from __future__ import annotations

from fastapi import APIRouter, Depends

from app.deps import get_service_state
from app.models import HealthResponse, MetricsResponse
from app.state import ServiceState


ops_router = APIRouter(tags=["ops"])


@ops_router.get("/health", response_model=HealthResponse)
async def get_health() -> HealthResponse:
    return HealthResponse(status="ok", service="forensic_core")


@ops_router.get("/metrics", response_model=MetricsResponse)
async def get_metrics(service_state: ServiceState = Depends(get_service_state)) -> MetricsResponse:
    return MetricsResponse(
        service="forensic_core",
        processing_mode="deterministic_statutory_audit",
        total_audits=service_state.metrics.total_audits,
        total_breaches=service_state.metrics.total_breaches,
        total_clean=service_state.metrics.total_clean,
    )

