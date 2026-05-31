from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import json
from typing import Literal


Domain = Literal[
    "consumer-credit",
    "student-loan",
    "business-credit",
    "tax-liens",
    "chexsystems",
    "lexisnexis",
    "early-warning-services",
]


@dataclass(frozen=True)
class RuleEntry:
    rule_id: str
    domain: Domain
    statutes: list[str]
    patterns_any: list[str]
    patterns_all: list[str]
    severity: Literal["critical", "high", "medium"]
    title: str


def _expand_token(token: str) -> list[str]:
    return [value.strip().lower() for value in token.split("|") if value.strip()]


def _load_next_rules() -> list[RuleEntry]:
    local_rules_path = Path(__file__).resolve().parents[1] / "violation-libraries.json"
    if local_rules_path.exists():
        rules_path = local_rules_path
    else:
        repo_root = Path(__file__).resolve().parents[3]
        rules_path = repo_root / "lib" / "violation-libraries.json"
    payload = json.loads(rules_path.read_text(encoding="utf-8"))
    rules: list[RuleEntry] = []

    for item in payload.get("rules", []):
        domain = item.get("domain", "consumer-credit")
        if domain not in {"consumer-credit", "student-loan", "business-credit"}:
            continue
        rules.append(
            RuleEntry(
                rule_id=item["id"],
                domain=domain,  # type: ignore[arg-type]
                statutes=item.get("statutes", []),
                patterns_any=item.get("patternsAny", []),
                patterns_all=item.get("patternsAll", []),
                severity=item.get("severity", "medium"),
                title=item.get("title", item["id"]),
            )
        )
    return rules


def _append_extension_rules(rules: list[RuleEntry]) -> list[RuleEntry]:
    extension_rules = [
        RuleEntry(
            rule_id="tx-lien-release-mismatch",
            domain="tax-liens",
            statutes=["26 U.S.C. § 6325", "public record verification standards"],
            patterns_any=["tax lien", "released lien", "lien released", "irs"],
            patterns_all=["active|open|balance|reported"],
            severity="high",
            title="Released tax lien still reported active",
        ),
        RuleEntry(
            rule_id="chex-account-not-mine",
            domain="chexsystems",
            statutes=["15 U.S.C. § 1681e(b)", "15 U.S.C. § 1681i"],
            patterns_any=["chexsystems", "account abuse", "not mine", "identity theft"],
            patterns_all=["account|report|consumer"],
            severity="high",
            title="ChexSystems identity mismatch or unverified account",
        ),
        RuleEntry(
            rule_id="ln-public-record-mismatch",
            domain="lexisnexis",
            statutes=["15 U.S.C. § 1681e(b)", "15 U.S.C. § 1681i"],
            patterns_any=["lexisnexis", "public record", "dismissed", "discharged"],
            patterns_all=["court|reference|filed|status"],
            severity="high",
            title="LexisNexis public-record inconsistency",
        ),
        RuleEntry(
            rule_id="ews-fraud-profile-mismatch",
            domain="early-warning-services",
            statutes=["15 U.S.C. § 1681e(b)", "15 U.S.C. § 1681i"],
            patterns_any=["early warning", "ews", "fraud", "deposit account"],
            patterns_all=["bank|account|consumer"],
            severity="medium",
            title="Early Warning Services profile mismatch",
        ),
    ]
    return [*rules, *extension_rules]


def load_statutory_archive() -> dict[str, RuleEntry]:
    entries = _append_extension_rules(_load_next_rules())
    return {entry.rule_id: entry for entry in entries}


def map_fact_to_rules(*, text: str, archive: dict[str, RuleEntry]) -> list[RuleEntry]:
    haystack = text.lower()
    if not haystack.strip():
        return []

    matched: list[RuleEntry] = []
    for rule in archive.values():
        any_matches = any(
            any(option in haystack for option in _expand_token(pattern))
            for pattern in rule.patterns_any
        )
        if not any_matches:
            continue
        all_match = all(
            any(option in haystack for option in _expand_token(pattern))
            for pattern in rule.patterns_all
        )
        if all_match:
            matched.append(rule)
    return matched

