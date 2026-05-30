from __future__ import annotations

from collections import Counter
from typing import Any

from app.models import TriangulationRecord
from app.services.statutory_archive import RuleEntry, map_fact_to_rules


def _extract_fact_pattern(*, text: str, needle: str) -> str:
    start = text.lower().find(needle.lower())
    if start < 0:
        compact = " ".join(text.split())
        return compact[:280]
    left = max(0, start - 120)
    right = min(len(text), start + 220)
    return " ".join(text[left:right].split())


def _severity_tier(*, severities: list[str]) -> str:
    if any(value == "critical" for value in severities):
        return "critical"
    high_count = sum(1 for value in severities if value == "high")
    if high_count >= 2 or len(severities) >= 4:
        return "medium"
    return "low"


def _escalation_level(*, tier: str) -> str:
    if tier == "critical":
        return "legal_demand"
    if tier == "medium":
        return "round_2"
    if tier == "low":
        return "round_1"
    return "none"


def _to_record(*, text: str, rule: RuleEntry) -> dict[str, Any]:
    statute_reference = "; ".join(rule.statutes) if rule.statutes else "N/A"
    pattern_hint = rule.patterns_any[0] if rule.patterns_any else rule.rule_id
    primary_needle = pattern_hint.split("|")[0].strip() if pattern_hint else rule.rule_id
    return {
        "STATUTE_RULE_ID": f"STATUTE_RULE_ID:{rule.rule_id}",
        "INPUT_FACT_PATTERN": _extract_fact_pattern(text=text, needle=primary_needle),
        "STATUTORY_REFERENCE": statute_reference,
        "ANOMALY_VERDICT": "Breach identified",
    }


def run_sovereign_audit(
    *,
    raw_document_text: str,
    archive: dict[str, RuleEntry],
) -> dict[str, Any]:
    text = raw_document_text.strip()
    if len(text) < 12:
        return {
            "status": "unprocessable",
            "records": [],
            "severity_tier": "low",
            "escalation_level": "none",
            "response": "Status: Clean. No reportable anomalies identified.",
            "breach": False,
        }

    matched_rules = map_fact_to_rules(text=text, archive=archive)
    records_payload = [_to_record(text=text, rule=rule) for rule in matched_rules]
    records = [TriangulationRecord.model_validate(payload) for payload in records_payload]
    records = sorted(records, key=lambda record: (record.statute_rule_id, record.input_fact_pattern))

    if not records:
        clean_record = TriangulationRecord.model_validate(
            {
                "STATUTE_RULE_ID": "STATUTE_RULE_ID:CLEAN",
                "INPUT_FACT_PATTERN": "No mapped statutory breach triggered from extracted fact pattern.",
                "STATUTORY_REFERENCE": "N/A",
                "ANOMALY_VERDICT": "Compliant",
            }
        )
        return {
            "status": "processed",
            "records": [clean_record],
            "severity_tier": "low",
            "escalation_level": "none",
            "response": "Status: Clean. No reportable anomalies identified.",
            "breach": False,
        }

    severities = [rule.severity for rule in matched_rules]
    tier = _severity_tier(severities=severities)
    escalation_level = _escalation_level(tier=tier)
    statute_counter = Counter(
        statute
        for rule in matched_rules
        for statute in rule.statutes
    )
    top_statutes = [item for item, _ in statute_counter.most_common(4)]
    response = "\n".join(
        [
            "FORENSIC_EVIDENCE_PACKET: GENERATED",
            f"SEVERITY_TIER: {tier.upper()}",
            f"ESCALATION_LEVEL: {escalation_level}",
            f"PRIMARY_STATUTES: {' | '.join(top_statutes)}",
            "FORENSIC_WITNESS_ONLY: NO LEGAL ADVICE",
        ]
    )

    return {
        "status": "processed",
        "records": records,
        "severity_tier": tier,
        "escalation_level": escalation_level,
        "response": response,
        "breach": True,
    }


def run_shadow_verify(*, records: list[TriangulationRecord]) -> dict[str, Any]:
    if not records:
        return {"status": "clean", "removed_records": 0, "records": []}

    unique_by_id: dict[str, TriangulationRecord] = {}
    removed_records = 0
    for record in records:
        key = record.statute_rule_id
        if key in unique_by_id:
            removed_records += 1
            continue
        unique_by_id[key] = record

    filtered = list(unique_by_id.values())
    status = "verified" if filtered else "clean"
    return {"status": status, "removed_records": removed_records, "records": filtered}


def synthesize_packet(*, records: list[TriangulationRecord]) -> dict[str, Any]:
    breach_count = sum(1 for record in records if record.anomaly_verdict == "Breach identified")
    if breach_count == 0:
        return {
            "status": "CLEAN",
            "severity_tier": "low",
            "escalation_level": "none",
            "response": "Status: Clean. No reportable anomalies identified.",
        }
    if breach_count >= 4:
        severity_tier = "critical"
    elif breach_count >= 2:
        severity_tier = "medium"
    else:
        severity_tier = "low"
    escalation_level = _escalation_level(tier=severity_tier)
    return {
        "status": "BREACH_DETECTED",
        "severity_tier": severity_tier,
        "escalation_level": escalation_level,
        "response": "AUTO_DISPUTE_SYNTHESIS: GENERATED",
    }

