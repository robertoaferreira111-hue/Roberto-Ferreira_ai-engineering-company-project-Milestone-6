from __future__ import annotations

import io
import json
import tempfile
import unittest
from pathlib import Path
from wsgiref.util import setup_testing_defaults

import sys

SERVICE_ROOT = Path(__file__).resolve().parents[1]
ROOT = SERVICE_ROOT.parent.parent
sys.path.insert(0, str(ROOT / "packages"))
sys.path.insert(0, str(SERVICE_ROOT))

from app.api import IncidentAPI  # noqa: E402
from app.db.database import migrate  # noqa: E402


class ApiTestCase(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.database = Path(self.temp_dir.name) / "test.sqlite3"
        migrate(self.database)
        self.app = IncidentAPI(self.database)

    def tearDown(self) -> None:
        self.temp_dir.cleanup()

    def request(self, method: str, path: str, body: dict | None = None):
        encoded = b"" if body is None else json.dumps(body).encode()
        environ: dict = {}
        setup_testing_defaults(environ)
        environ.update(
            REQUEST_METHOD=method,
            PATH_INFO=path.split("?", 1)[0],
            QUERY_STRING=path.split("?", 1)[1] if "?" in path else "",
            CONTENT_LENGTH=str(len(encoded)),
            CONTENT_TYPE="application/json",
            wsgi_input=io.BytesIO(encoded),
        )
        environ["wsgi.input"] = environ.pop("wsgi_input")
        result = {}
        response = self.app(environ, lambda status, headers: result.update(
            status=status, headers=headers
        ))
        result["body"] = json.loads(b"".join(response))
        return result

    def test_empty_list_and_summary(self):
        listed = self.request("GET", "/api/incidents")
        summary = self.request("GET", "/api/incidents/summary")
        self.assertEqual(listed["status"], "200 OK")
        self.assertEqual(listed["body"], [])
        self.assertEqual(summary["status"], "200 OK")
        self.assertTrue(all(value == 0 for group in summary["body"].values() for value in group.values()))

    def test_create_detail_filters_and_lifecycle(self):
        payload = {
            "title": "POS terminal offline",
            "description": "The POS terminal stopped accepting payments.",
            "category": "pos_system",
            "status": "open",
            "origin": "branch",
            "branch": "medellin_centro",
        }
        created = self.request("POST", "/api/incidents", payload)
        self.assertEqual(created["status"], "201 Created")
        incident_id = created["body"]["id"]
        self.assertEqual(self.request("GET", f"/api/incidents/{incident_id}")["status"], "200 OK")
        filtered = self.request("GET", "/api/incidents?origin=branch&branch=medellin_centro")
        self.assertEqual(len(filtered["body"]), 1)
        updated = self.request("PATCH", f"/api/incidents/{incident_id}/status", {"status": "in_progress"})
        self.assertEqual(updated["status"], "200 OK")
        self.assertEqual(updated["body"]["status"], "in_progress")
        invalid = self.request("PATCH", f"/api/incidents/{incident_id}/status", {"status": "open"})
        self.assertEqual(invalid["status"], "400 Bad Request")
        self.assertEqual(invalid["body"]["field"], "status")

    def test_validation_unknown_id_and_invalid_filter(self):
        missing = self.request("POST", "/api/incidents", {"title": "missing fields"})
        self.assertEqual(missing["status"], "400 Bad Request")
        self.assertEqual(missing["body"]["field"], "description")
        invalid_enum = self.request("POST", "/api/incidents", {
            "title": "Bad", "description": "Bad", "category": "wrong",
            "status": "open", "origin": "customer", "branch": "central",
        })
        self.assertEqual(invalid_enum["status"], "400 Bad Request")
        self.assertEqual(invalid_enum["body"]["field"], "category")
        unknown = self.request("GET", "/api/incidents/not-found")
        self.assertEqual(unknown["status"], "404 Not Found")
        invalid_filter = self.request("GET", "/api/incidents?status=wrong")
        self.assertEqual(invalid_filter["status"], "400 Bad Request")

    def test_forced_error_is_generic(self):
        broken = IncidentAPI(Path(self.temp_dir.name))
        response = broken(self._environ("GET", "/api/incidents"), lambda *_: None)
        body = json.loads(b"".join(response))
        self.assertEqual(body, {"message": "An unexpected server error occurred."})

    @staticmethod
    def _environ(method: str, path: str) -> dict:
        environ: dict = {}
        setup_testing_defaults(environ)
        environ.update(REQUEST_METHOD=method, PATH_INFO=path, QUERY_STRING="")
        return environ


if __name__ == "__main__":
    unittest.main()
