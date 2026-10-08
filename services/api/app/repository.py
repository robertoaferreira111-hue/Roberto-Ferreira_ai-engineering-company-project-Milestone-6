"""SQLite operations for the incident management API."""

from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
import sqlite3
import uuid
from typing import Any

from app.db.database import connect, migrate
from shared.incident_validation import BRANCHES, CATEGORIES, ORIGINS, STATUSES


class NotFoundError(Exception):
    """Raised when an incident does not exist."""


class ConflictError(Exception):
    """Raised for a lifecycle transition that is not allowed."""


def row_to_dict(row: sqlite3.Row) -> dict[str, Any]:
    return dict(row)


def create_incident(database_path: str | Path, values: dict[str, str]) -> dict[str, Any]:
    migrate(database_path)
    now = datetime.now(timezone.utc).isoformat()
    incident_id = str(uuid.uuid4())
    with connect(database_path) as connection:
        connection.execute(
            """
            INSERT INTO incidents
            (id, title, description, category, status, origin, branch, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                incident_id,
                values["title"],
                values["description"],
                values["category"],
                values["status"],
                values["origin"],
                values["branch"],
                now,
                now,
            ),
        )
        row = connection.execute(
            "SELECT * FROM incidents WHERE id = ?", (incident_id,)
        ).fetchone()
    return row_to_dict(row)


def list_incidents(
    database_path: str | Path,
    filters: dict[str, str | None],
) -> list[dict[str, Any]]:
    migrate(database_path)
    clauses: list[str] = []
    parameters: list[str] = []
    for field in ("status", "origin", "branch", "category"):
        value = filters.get(field)
        if value is not None:
            clauses.append(f"{field} = ?")
            parameters.append(value)
    query = "SELECT * FROM incidents"
    if clauses:
        query += " WHERE " + " AND ".join(clauses)
    query += " ORDER BY created_at DESC, id DESC"
    with connect(database_path) as connection:
        return [row_to_dict(row) for row in connection.execute(query, parameters).fetchall()]


def get_incident(database_path: str | Path, incident_id: str) -> dict[str, Any]:
    migrate(database_path)
    with connect(database_path) as connection:
        row = connection.execute(
            "SELECT * FROM incidents WHERE id = ?", (incident_id,)
        ).fetchone()
    if row is None:
        raise NotFoundError
    return row_to_dict(row)


def update_status(
    database_path: str | Path,
    incident_id: str,
    new_status: str,
    allowed_transitions: dict[str, frozenset[str]],
) -> dict[str, Any]:
    migrate(database_path)
    with connect(database_path) as connection:
        row = connection.execute(
            "SELECT * FROM incidents WHERE id = ?", (incident_id,)
        ).fetchone()
        if row is None:
            raise NotFoundError
        current_status = str(row["status"])
        if new_status not in allowed_transitions[current_status]:
            raise ConflictError(
                f"Cannot move from {current_status} to {new_status}."
            )
        connection.execute(
            "UPDATE incidents SET status = ?, updated_at = ? WHERE id = ?",
            (new_status, datetime.now(timezone.utc).isoformat(), incident_id),
        )
        updated = connection.execute(
            "SELECT * FROM incidents WHERE id = ?", (incident_id,)
        ).fetchone()
    return row_to_dict(updated)


def summary(database_path: str | Path) -> dict[str, dict[str, int]]:
    migrate(database_path)
    with connect(database_path) as connection:
        result: dict[str, dict[str, int]] = {
            "by_status": {value: 0 for value in STATUSES},
            "by_category": {value: 0 for value in CATEGORIES},
            "by_origin": {value: 0 for value in ORIGINS},
            "by_branch": {value: 0 for value in BRANCHES},
        }
        for field, key, allowed in (
            ("status", "by_status", STATUSES),
            ("category", "by_category", CATEGORIES),
            ("origin", "by_origin", ORIGINS),
            ("branch", "by_branch", tuple(BRANCHES)),
        ):
            rows = connection.execute(
                f"SELECT {field}, COUNT(*) AS count FROM incidents GROUP BY {field}"
            ).fetchall()
            for row in rows:
                if str(row[field]) in allowed:
                    result[key][str(row[field])] = int(row["count"])
        return result
