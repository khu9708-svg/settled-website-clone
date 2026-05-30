from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


Verdict = Literal["Breach identified", "Compliant"]


class SovereignAuditRequest(BaseModel):
    raw_document_text: str = Field(min_length=12, description="Raw text to audit")
    operator_name: str = Field(default="Operator", min_length=1, max_length=120)
    domain_hint: Literal[
        "unknown",
        "consumer-credit",
        "student-loan",
        "business-credit",
        "tax-liens",
        "chexsystems",
        "lexisnexis",
        "early-warning-services",
    ] = "unknown"


class TriangulationRecord(BaseModel):
    statute_rule_id: str = Field(alias="STATUTE_RULE_ID")
    input_fact_pattern: str = Field(alias="INPUT_FACT_PATTERN")
    statutory_reference: str = Field(alias="STATUTORY_REFERENCE")
    anomaly_verdict: Verdict = Field(alias="ANOMALY_VERDICT")


class ForensicEvidencePacket(BaseModel):
    severity_tier: Literal["low", "medium", "critical"]
    escalation_level: Literal["none", "round_1", "round_2", "legal_demand"]
    records: list[TriangulationRecord]
    status: Literal["CLEAN", "BREACH_DETECTED"]
    response: str
    legal_posture: Literal["forensic_witness_only"] = "forensic_witness_only"


class SovereignAuditResponse(BaseModel):
    operator_name: str
    status: Literal["processed", "unprocessable"]
    processing_mode: Literal["deterministic_statutory_audit"]
    result: ForensicEvidencePacket


class ShadowVerifyRequest(BaseModel):
    records: list[TriangulationRecord] = Field(default_factory=list)


class ShadowVerifyResponse(BaseModel):
    status: Literal["verified", "clean"]
    removed_records: int
    records: list[TriangulationRecord]


class SynthesizePacketRequest(BaseModel):
    operator_name: str = Field(default="Operator", min_length=1, max_length=120)
    records: list[TriangulationRecord] = Field(default_factory=list)


class HealthResponse(BaseModel):
    status: Literal["ok"]
    service: Literal["forensic_core"]


class MetricsResponse(BaseModel):
    service: Literal["forensic_core"]
    processing_mode: Literal["deterministic_statutory_audit"]
    total_audits: int
    total_breaches: int
    total_clean: int

