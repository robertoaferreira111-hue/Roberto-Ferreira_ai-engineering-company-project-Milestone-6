from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

import sys

SERVICE_ROOT = Path(__file__).resolve().parents[1]
ROOT = SERVICE_ROOT.parent.parent
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "packages"))
sys.path.insert(0, str(SERVICE_ROOT))

from app.db.database import incident_count  # noqa: E402
from app.repository import summary  # noqa: E402
from scripts.seed_incidents import seed  # noqa: E402


class SeedTestCase(unittest.TestCase):
    def test_seed_totals_and_idempotency(self) -> None:
        csv_path = ROOT / "scripts" / "incidents-brasaland.csv"
        with tempfile.TemporaryDirectory() as temp_dir:
            database = Path(temp_dir) / "incidents.sqlite3"

            first_run = seed(csv_path, database)
            first_summary = summary(database)

            self.assertEqual(first_run, {"inserted": 98, "skipped": 0, "invalid": 2})
            self.assertEqual(incident_count(database), 98)
            self.assertEqual(
                first_summary["by_status"],
                {"open": 33, "in_progress": 0, "resolved": 51, "discarded": 14},
            )
            self.assertEqual(
                first_summary["by_category"],
                {
                    "equipment_failure": 17,
                    "supply_issue": 22,
                    "customer_complaint": 50,
                    "staff_issue": 9,
                    "facility_issue": 0,
                    "pos_system": 0,
                    "delivery_issue": 0,
                    "other": 0,
                },
            )
            self.assertEqual(first_summary["by_origin"]["customer"], 98)
            self.assertEqual(sum(first_summary["by_branch"].values()), 98)
            # Four explicit central locations plus the valid blank-location row.
            self.assertEqual(first_summary["by_branch"]["central"], 5)

            second_run = seed(csv_path, database)

            self.assertEqual(second_run, {"inserted": 0, "skipped": 98, "invalid": 2})
            self.assertEqual(incident_count(database), 98)


if __name__ == "__main__":
    unittest.main()