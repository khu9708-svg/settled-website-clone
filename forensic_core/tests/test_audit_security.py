from __future__ import annotations

import os
from pathlib import Path
import sys

from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))


def _load_client_with_token(token: str | None) -> TestClient:
    if token is None:
        os.environ.pop("FORENSIC_CORE_SERVICE_TOKEN", None)
    else:
        os.environ["FORENSIC_CORE_SERVICE_TOKEN"] = token
    from app.main import app  # pylint: disable=import-outside-toplevel
    return TestClient(app)


def test_health_is_public() -> None:
    client = _load_client_with_token("secret-token")
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_audit_requires_bearer_token() -> None:
    client = _load_client_with_token("secret-token")
    response = client.post("/audit/sovereign", json={"raw_document_text": "abcde12345fghij", "operator_name": "Test"})
    assert response.status_code == 401


def test_audit_rejects_wrong_bearer_token() -> None:
    client = _load_client_with_token("secret-token")
    response = client.post(
        "/audit/sovereign",
        headers={"Authorization": "Bearer wrong-token"},
        json={"raw_document_text": "abcde12345fghij", "operator_name": "Test"},
    )
    assert response.status_code == 401


def test_audit_rejects_malformed_bearer_token() -> None:
    client = _load_client_with_token("secret-token")
    response = client.post(
        "/audit/sovereign",
        headers={"Authorization": "Token secret-token"},
        json={"raw_document_text": "abcde12345fghij", "operator_name": "Test"},
    )
    assert response.status_code == 401


def test_service_token_unconfigured_returns_503() -> None:
    client = _load_client_with_token(None)
    response = client.post(
        "/audit/sovereign",
        headers={"Authorization": "Bearer any-token"},
        json={"raw_document_text": "abcde12345fghij", "operator_name": "Test"},
    )
    assert response.status_code == 503
    assert response.json()["error"] == "SERVICE_TOKEN_UNCONFIGURED"

