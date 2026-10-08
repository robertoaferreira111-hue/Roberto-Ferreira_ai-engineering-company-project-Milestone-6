"""Small SQLite persistence layer for Phase 1.

The API phase can reuse this connection/schema without changing the Incident
constraints or the seed's idempotency key.
"""

from __future__ import annotations

import sqlite3
from pathlib import Path
from typing import Iterator

SERVICE_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_DATABASE_PATH = SERVICE_ROOT / "data" / "incidents.sqlite3"
MIGRATION_PATH = SERVICE_ROOT / "migrations" / "001_create_incidents.sql"


def connect(database_path: str | Path = DEFAULT_DATABASE_PATH) -> sqlite3.Connection:
    path = Path(database_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(path)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


def migrate(database_path: str | Path = DEFAULT_DATABASE_PATH) -> None:
    with connect(database_path) as connection:
        connection.executescript(MIGRATION_PATH.read_text(encoding="utf-8"))


def incident_count(database_path: str | Path = DEFAULT_DATABASE_PATH) -> int:
    with connect(database_path) as connection:
        row = connection.execute("SELECT COUNT(*) AS count FROM incidents").fetchone()
        return int(row["count"])


def iter_incidents(database_path: str | Path = DEFAULT_DATABASE_PATH) -> Iterator[sqlite3.Row]:
    with connect(database_path) as connection:
        yield from connection.execute(
            "SELECT * FROM incidents ORDER BY created_at, id"
        ).fetchall()
