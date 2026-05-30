from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from app.deps import get_service_state
from app.models import (
    ForensicEvidencePacket,
    ShadowVerifyRequest,
    ShadowVerifyResponse,
    SovereignAuditRequest,
    SovereignAuditResponse,
    SynthesizePacketRequest,
)
from app.services.audit_engine import run_shadow_verify, run_sovereign_audit, synthesize_packet
from app.state import ServiceState


audit_router = APIRouter(prefix="/audit", tags=["audit"])


@audit_router.post("/sovereign", response_model=SovereignAuditResponse)
async def audit_sovereign(
    payload: SovereignAuditRequest,
    service_state: ServiceState = Depends(get_service_state),
) -> SovereignAuditResponse:
    if len(payload.raw_document_text.strip()) < 12:
        raise HTTPException(status_code=422, detail="Input text is too short for deterministic audit.")
    result = run_sovereign_audit(
        raw_document_text=payload.raw_document_text,
        archive=service_state.archive,
    )
    if result["status"] == "unprocessable":
        packet = ForensicEvidencePacket(
            severity_tier="low",
            escalation_level="none",
            records=[],
            status="CLEAN",
            response="Status: Clean. No reportable anomalies identified.",
        )
        return SovereignAuditResponse(
            operator_name=payload.operator_name,
            status="unprocessable",
            processing_mode="deterministic_statutory_audit",
            result=packet,
        )

    service_state.metrics.total_audits += 1
    if result["breach"]:
        service_state.metrics.total_breaches += 1
    if not result["breach"]:
        service_state.metrics.total_clean += 1

    packet = ForensicEvidencePacket(
        severity_tier=result["severity_tier"],
        escalation_level=result["escalation_level"],
        records=result["records"],
        status="BREACH_DETECTED" if result["breach"] else "CLEAN",
        response=result["response"],
    )
    return SovereignAuditResponse(
        operator_name=payload.operator_name,
        status="processed",
        processing_mode="deterministic_statutory_audit",
        result=packet,
    )


@audit_router.post("/shadow-verify", response_model=ShadowVerifyResponse)
async def audit_shadow_verify(payload: ShadowVerifyRequest) -> ShadowVerifyResponse:
    result = run_shadow_verify(records=payload.records)
    return ShadowVerifyResponse(
        status=result["status"],
        removed_records=result["removed_records"],
        records=result["records"],
    )


@audit_router.post("/synthesize-packet", response_model=SovereignAuditResponse)
async def audit_synthesize_packet(payload: SynthesizePacketRequest) -> SovereignAuditResponse:
    packet_meta = synthesize_packet(records=payload.records)
    packet = ForensicEvidencePacket(
        severity_tier=packet_meta["severity_tier"],
        escalation_level=packet_meta["escalation_level"],
        records=payload.records,
        status=packet_meta["status"],
        response=packet_meta["response"],
    )
    return SovereignAuditResponse(
        operator_name=payload.operator_name,
        status="processed",
        processing_mode="deterministic_statutory_audit",
        result=packet,
    )

