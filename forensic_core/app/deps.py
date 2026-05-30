from __future__ import annotations

from fastapi import Request

from app.state import ServiceState


def get_service_state(*, request: Request) -> ServiceState:
    return request.app.state.service_state

