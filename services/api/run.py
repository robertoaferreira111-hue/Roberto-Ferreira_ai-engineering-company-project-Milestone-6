"""Run the incident API locally.

Usage: python services/api/run.py [--host 127.0.0.1] [--port 8000]
"""

from __future__ import annotations

import argparse
from pathlib import Path
import sys
from wsgiref.simple_server import make_server

SERVICE_ROOT = Path(__file__).resolve().parent
ROOT = SERVICE_ROOT.parent.parent
sys.path.insert(0, str(ROOT / "packages"))
sys.path.insert(0, str(SERVICE_ROOT))

from app.api import IncidentAPI  # noqa: E402
from app.db.database import DEFAULT_DATABASE_PATH, migrate  # noqa: E402

parser = argparse.ArgumentParser(description="Run the Brasaland incident API.")
parser.add_argument("--host", default="127.0.0.1")
parser.add_argument("--port", type=int, default=8000)
parser.add_argument("--database", type=Path, default=DEFAULT_DATABASE_PATH)
args = parser.parse_args()
migrate(args.database)
application = IncidentAPI(args.database)
print(f"Incident API listening on http://{args.host}:{args.port}")
with make_server(args.host, args.port, application) as server:
    server.serve_forever()
