"""Apply the incident database schema.

Usage: python services/api/migrate.py [--database PATH]
"""

from __future__ import annotations

import argparse
from pathlib import Path
import sys

SERVICE_ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(SERVICE_ROOT))

from app.db.database import DEFAULT_DATABASE_PATH, migrate  # noqa: E402


parser = argparse.ArgumentParser(description="Create or update the incident database.")
parser.add_argument("--database", type=Path, default=DEFAULT_DATABASE_PATH)
args = parser.parse_args()
migrate(args.database)
print(f"Database ready: {args.database}")
