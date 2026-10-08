"""Load historical Brasaland incidents into the local Incident database.

Usage:
    python scripts/seed_incidents.py
    python scripts/seed_incidents.py --csv scripts/incidents-brasaland.csv \
        --database services/api/data/incidents.sqlite3
"""

from __future__ import annotations

import argparse
import csv
from collections import Counter
from pathlib import Path
import sys
import uuid

ROOT = Path(__file__).resolve().parents[1]
SERVICE_ROOT = ROOT / "services" / "api"
sys.path.insert(0, str(ROOT / "packages"))
sys.path.insert(0, str(SERVICE_ROOT))

from shared.incident_validation import (  # noqa: E402
    BRANCHES,
    transform_csv_row,
    validate_csv_row,
)
from app.db.database import DEFAULT_DATABASE_PATH, migrate  # noqa: E402

DEFAULT_CSV_PATH = Path(__file__).resolve().parent / "incidents-brasaland.csv"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Seed historical Brasaland incidents.")
    parser.add_argument("--csv", type=Path, default=DEFAULT_CSV_PATH)
    parser.add_argument("--database", type=Path, default=DEFAULT_DATABASE_PATH)
    return parser.parse_args()


def seed(csv_path: Path, database_path: Path) -> dict[str, int]:
    migrate(database_path)
    invalid: list[tuple[str, list[str]]] = []
    inserted = 0
    skipped = 0
    totals_by_status: Counter[str] = Counter()
    totals_by_category: Counter[str] = Counter()
    totals_by_origin: Counter[str] = Counter()
    totals_by_branch: Counter[str] = Counter()

    import sqlite3

    with csv_path.open(newline="", encoding="utf-8-sig") as csv_file:
        reader = csv.DictReader(csv_file)
        required_columns = {
            "incident_id", "date", "location_id", "category", "description", "status"
        }
        missing_columns = sorted(required_columns - set(reader.fieldnames or []))
        if missing_columns:
            raise ValueError(f"CSV is missing required columns: {', '.join(missing_columns)}")

        with sqlite3.connect(database_path) as connection:
            connection.execute("PRAGMA foreign_keys = ON")
            for line_number, row in enumerate(reader, start=2):
                issues = validate_csv_row(row)
                if issues:
                    invalid.append(
                        (
                            row.get("incident_id", "") or f"line {line_number}",
                            [f"{issue.field}: {issue.message}" for issue in issues],
                        )
                    )
                    continue

                record = transform_csv_row(row)
                existing = connection.execute(
                    "SELECT 1 FROM incidents WHERE source_id = ?",
                    (record["source_id"],),
                ).fetchone()
                if existing:
                    skipped += 1
                    continue

                connection.execute(
                    """
                    INSERT INTO incidents
                    (id, source_id, title, description, category, status, origin,
                     branch, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        str(uuid.uuid4()),
                        record["source_id"],
                        record["title"],
                        record["description"],
                        record["category"],
                        record["status"],
                        record["origin"],
                        record["branch"],
                        record["created_at"],
                        record["updated_at"],
                    ),
                )
                inserted += 1
                totals_by_status[str(record["status"])] += 1
                totals_by_category[str(record["category"])] += 1
                totals_by_origin[str(record["origin"])] += 1
                totals_by_branch[str(record["branch"])] += 1
            connection.commit()

    print("Incident seed report")
    print("=" * 21)
    print(f"CSV: {csv_path}")
    print(f"Database: {database_path}")
    print(f"Inserted: {inserted}")
    print(f"Skipped (already present): {skipped}")
    print(f"Invalid: {len(invalid)}")
    if invalid:
        print("Invalid records:")
        for identifier, reasons in invalid:
            print(f"- {identifier}: {'; '.join(reasons)}")
    print("Inserted totals by status:")
    for status in ("open", "in_progress", "resolved", "discarded"):
        print(f"- {status}: {totals_by_status[status]}")
    print("Inserted totals by category:")
    for category in (
        "equipment_failure", "supply_issue", "customer_complaint", "staff_issue",
        "facility_issue", "pos_system", "delivery_issue", "other",
    ):
        if totals_by_category[category]:
            print(f"- {category}: {totals_by_category[category]}")
    print("Inserted totals by origin:")
    for origin in ("customer", "branch", "internal"):
        print(f"- {origin}: {totals_by_origin[origin]}")
    print("Inserted totals by branch:")
    for branch, display_name in BRANCHES.items():
        if totals_by_branch[branch]:
            print(f"- {display_name}: {totals_by_branch[branch]}")

    return {"inserted": inserted, "skipped": skipped, "invalid": len(invalid)}


if __name__ == "__main__":
    arguments = parse_args()
    try:
        seed(arguments.csv, arguments.database)
    except (OSError, ValueError) as error:
        print(f"Seed failed: {error}", file=sys.stderr)
        raise SystemExit(1) from error
