# Brasaland Centralized Incident Manager

Incident intake, lifecycle management, historical CSV seeding, and summary metrics for Brasaland.

**Submission repository:** [https://github.com/robertoaferreira111-hue/Roberto-Ferreira_ai-engineering-company-project-Milestone-6](https://github.com/robertoaferreira111-hue/Roberto-Ferreira_ai-engineering-company-project-Milestone-6)

This is the currently verified public GitHub URL. The requested project-name rename could not be applied because GitHub denied the integration request (HTTP 403).

## Requirements

- Python 3.10+ (API and seed use the standard library)
- Node.js 20+ and npm (backoffice UI)

## Run locally

From the repository root, initialize and seed SQLite. Seeding is safe to repeat and skips rows already imported by CSV `incident_id`.

```bash
python services/api/migrate.py
python scripts/seed_incidents.py
```

Start the API in one terminal:

```bash
python services/api/run.py --host 127.0.0.1 --port 8000
```

Start the backoffice in another terminal:

```bash
cd uis/backoffice
npm ci
npm run dev
```

Open [http://localhost:3000/incidents](http://localhost:3000/incidents). The Next.js proxy forwards `/api/*` to `http://127.0.0.1:8000` by default. Set `INCIDENT_API_URL` if the API is hosted elsewhere.

## Verify

```bash
python -m unittest discover -s services/api/tests -v
python scripts/seed_incidents.py --database /tmp/incident-audit.sqlite3
cd uis/backoffice && npm run typecheck && npm run build
```

The seed inserts 98 valid incidents and reports two invalid source rows. Expected transformed totals are documented in [`CONTEXT-brasaland.en.md`](./CONTEXT-brasaland.en.md).

## Project layout

- `packages/shared/incident_validation/` — shared CSV validation, context enums, seed transformations.
- `scripts/seed_incidents.py` — idempotent historical import.
- `services/api/` — WSGI JSON API, SQLite model/schema, tests.
- `uis/backoffice/` — incident intake, list, filters, status updates, and summary.

## API routes

- `POST /api/incidents`
- `GET /api/incidents` (filters: `status`, `origin`, `branch`, `category`)
- `GET /api/incidents/{id}`
- `PATCH /api/incidents/{id}/status`
- `GET /api/incidents/summary`

Validation errors use `{ "field": "...", "message": "..." }`; unexpected errors return a generic message without a stack trace.

## Submission screenshots

Evidence files are in [`.project_requirements/screenshots/`](./.project_requirements/screenshots/). `Brasaland Incident Command Center.png` shows the incident command center, populated list, and summary metrics. The other two files are supporting error/console captures; please make sure a readable browser screenshot clearly showing the form's validation message is included for evaluation.
