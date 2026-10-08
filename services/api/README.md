# Incident API

Phase 2 provides the centralized incident management API using Python's standard-library WSGI server and SQLite.

## Run locally

```bash
python services/api/run.py --host 127.0.0.1 --port 8000
```

Use a different database with `--database /path/to/incidents.sqlite3`. The service applies the schema migration on startup.

The historical seed is run separately:

```bash
python services/api/migrate.py
python scripts/seed_incidents.py
```

Endpoints:

- `POST /api/incidents`
- `GET /api/incidents?status=&origin=&branch=&category=`
- `GET /api/incidents/{id}`
- `PATCH /api/incidents/{id}/status`
- `GET /api/incidents/summary`

No authentication, pagination, or frontend behavior is included in Phase 2.
