from __future__ import annotations

from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.services.audit_engine import run_sovereign_audit  # noqa: E402
from app.services.statutory_archive import load_statutory_archive  # noqa: E402


def test_records_are_sorted_deterministically() -> None:
    archive = load_statutory_archive()
    sample_text = """
    Experian Equifax TransUnion report includes account discrepancy.
    Date of first delinquency appears re-aged.
    Unauthorized inquiry was reported and debt validation failed.
    """.strip()

    first = run_sovereign_audit(raw_document_text=sample_text, archive=archive)
    second = run_sovereign_audit(raw_document_text=sample_text, archive=archive)

    first_records = [record.model_dump(by_alias=True) for record in first["records"]]
    second_records = [record.model_dump(by_alias=True) for record in second["records"]]

    assert first_records == second_records

