"""Dependency-free WSGI HTTP API for centralized incident management."""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any
from urllib.parse import parse_qs, urlsplit

from app.repository import (
    ConflictError,
    NotFoundError,
    create_incident,
    get_incident,
    list_incidents,
    summary,
    update_status,
)
from shared.incident_validation import (
    BRANCHES,
    CATEGORIES,
    ORIGINS,
    STATUSES,
    STATUS_TRANSITIONS,
)

LOGGER = logging.getLogger(__name__)
FIELDS = ("title", "description", "category", "status", "origin", "branch")


class IncidentAPI:
    def __init__(self, database_path: str | Path):
        self.database_path = Path(database_path)

    def __call__(self, environ: dict[str, Any], start_response: Any):
        try:
            status, payload = self.handle(environ)
        except Exception:
            LOGGER.exception("Unhandled incident API error")
            status, payload = 500, {"message": "An unexpected server error occurred."}
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        start_response(
            f"{status} {self._status_text(status)}",
            [
                ("Content-Type", "application/json; charset=utf-8"),
                ("Content-Length", str(len(body))),
            ],
        )
        return [body]

    def handle(self, environ: dict[str, Any]) -> tuple[int, Any]:
        method = environ.get("REQUEST_METHOD", "GET").upper()
        path = urlsplit(environ.get("PATH_INFO", "") or "/").path.rstrip("/") or "/"
        parts = [part for part in path.split("/") if part]

        if parts == ["api", "incidents"]:
            if method == "POST":
                return self._create(environ)
            if method == "GET":
                return self._list(environ)
            return 405, {"message": "Method not allowed."}

        # Keep this before /api/incidents/{id} so summary can never be captured as an id.
        if parts == ["api", "incidents", "summary"] and method == "GET":
            return 200, summary(self.database_path)

        if len(parts) == 3 and parts[:2] == ["api", "incidents"]:
            incident_id = parts[2]
            if method == "GET":
                try:
                    return 200, get_incident(self.database_path, incident_id)
                except NotFoundError:
                    return 404, {"message": "Incident not found."}
            if method == "PATCH" and len(parts) == 3:
                return 405, {"message": "Use /status to update an incident status."}

        if len(parts) == 4 and parts[:2] == ["api", "incidents"] and parts[3] == "status":
            if method != "PATCH":
                return 405, {"message": "Method not allowed."}
            try:
                payload = self._json_body(environ)
            except ValueError as error:
                return 400, {"field": "body", "message": str(error)}
            new_status = payload.get("status") if isinstance(payload, dict) else None
            if not isinstance(new_status, str) or not new_status.strip():
                return 400, {"field": "status", "message": "Status is required."}
            new_status = new_status.strip()
            if new_status not in STATUSES:
                return 400, {"field": "status", "message": "Status is not valid."}
            try:
                return 200, update_status(
                    self.database_path, parts[2], new_status, STATUS_TRANSITIONS
                )
            except NotFoundError:
                return 404, {"message": "Incident not found."}
            except ConflictError as error:
                return 400, {"field": "status", "message": str(error)}

        return 404, {"message": "Route not found."}

    def _create(self, environ: dict[str, Any]) -> tuple[int, Any]:
        try:
            payload = self._json_body(environ)
        except ValueError as error:
            return 400, {"field": "body", "message": str(error)}
        if not isinstance(payload, dict):
            return 400, {"field": "body", "message": "Request body must be a JSON object."}
        for field in FIELDS:
            value = payload.get(field)
            if not isinstance(value, str) or not value.strip():
                return 400, {"field": field, "message": f"{field} is required."}
        for field, allowed in (
            ("category", CATEGORIES),
            ("status", STATUSES),
            ("origin", ORIGINS),
            ("branch", tuple(BRANCHES)),
        ):
            if payload[field] not in allowed:
                return 400, {"field": field, "message": f"{field} is not valid."}
        try:
            return 201, create_incident(
                self.database_path, {field: payload[field].strip() for field in FIELDS}
            )
        except Exception:
            # The outer handler provides the generic 500 for unexpected persistence failures.
            raise

    def _list(self, environ: dict[str, Any]) -> tuple[int, Any]:
        query = parse_qs(environ.get("QUERY_STRING", ""), keep_blank_values=True)
        filters: dict[str, str | None] = {}
        for field, allowed in (
            ("status", STATUSES),
            ("origin", ORIGINS),
            ("branch", tuple(BRANCHES)),
            ("category", CATEGORIES),
        ):
            value = query.get(field, [None])[0]
            if value is not None and value not in allowed:
                return 400, {"field": field, "message": f"{field} is not valid."}
            filters[field] = value
        return 200, list_incidents(self.database_path, filters)

    @staticmethod
    def _json_body(environ: dict[str, Any]) -> Any:
        try:
            length = int(environ.get("CONTENT_LENGTH") or 0)
        except ValueError as error:
            raise ValueError("Content-Length is invalid.") from error
        raw = environ.get("wsgi.input").read(length)
        if not raw:
            raise ValueError("Request body is required.")
        try:
            return json.loads(raw.decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError) as error:
            raise ValueError("Request body must contain valid JSON.") from error

    @staticmethod
    def _status_text(status: int) -> str:
        return {
            200: "OK", 201: "Created", 400: "Bad Request", 404: "Not Found",
            405: "Method Not Allowed", 500: "Internal Server Error",
        }.get(status, "Error")
