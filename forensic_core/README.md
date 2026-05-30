# Forensic Core (FastAPI)

Deterministic sovereign audit backend using strict schema output.

## Run

```bash
cd forensic_core
python -m uvicorn app.main:app --host 0.0.0.0 --port 8010 --reload
```

Required environment variables:

- `FORENSIC_CORE_SERVICE_TOKEN` (server-side bearer token required by all audit routes)

## Endpoints

- `POST /audit/sovereign`
- `POST /audit/shadow-verify`
- `POST /audit/synthesize-packet`
- `GET /health`
- `GET /metrics`

