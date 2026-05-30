from __future__ import annotations

from dataclasses import dataclass

from app.services.statutory_archive import RuleEntry, load_statutory_archive


@dataclass
class MetricsStore:
    total_audits: int = 0
    total_breaches: int = 0
    total_clean: int = 0


@dataclass
class ServiceState:
    archive: dict[str, RuleEntry]
    metrics: MetricsStore


def build_service_state() -> ServiceState:
    archive = load_statutory_archive()
    return ServiceState(archive=archive, metrics=MetricsStore())

