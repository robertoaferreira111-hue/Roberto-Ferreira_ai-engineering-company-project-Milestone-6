"""Single source of truth for incident validation and seed transformations."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Mapping

STATUSES = ("open", "in_progress", "resolved", "discarded")
ORIGINS = ("customer", "branch", "internal")
CATEGORIES = (
    "equipment_failure",
    "supply_issue",
    "customer_complaint",
    "staff_issue",
    "facility_issue",
    "pos_system",
    "delivery_issue",
    "other",
)
BRANCHES = {
    "central": "Central (Medellín / Miami)",
    "medellin_centro": "Medellín Centro",
    "medellin_laureles": "Medellín Laureles",
    "medellin_envigado": "Medellín Envigado",
    "medellin_bello": "Medellín Bello",
    "medellin_itagui": "Medellín Itagüí",
    "bogota_chapinero": "Bogotá Chapinero",
    "bogota_usaquen": "Bogotá Usaquén",
    "cali_granada": "Cali Granada",
    "barranquilla_norte": "Barranquilla Norte",
    "miami_doral": "Miami Doral",
    "miami_hialeah": "Miami Hialeah",
    "miami_kendall": "Miami Kendall",
    "orlando_international": "Orlando International Drive",
    "fort_lauderdale": "Fort Lauderdale",
}

STATUS_TRANSITIONS = {
    "open": frozenset(("in_progress", "discarded")),
    "in_progress": frozenset(("resolved", "discarded")),
    "resolved": frozenset(),
    "discarded": frozenset(),
}

_CSV_STATUS_MAP = {"OPEN": "open", "CLOSED": "resolved", "DISCARDED": "discarded"}
_CSV_CATEGORY_MAP = {
    "CUSTOMER_COMPLAINT": "customer_complaint",
    "EQUIPMENT": "equipment_failure",
    "SUPPLY": "supply_issue",
    "FOOD_QUALITY": "customer_complaint",
    "STAFF": "staff_issue",
}
_CSV_BRANCH_MAP = {
    "COL-01": "medellin_centro",
    "COL-02": "medellin_laureles",
    "COL-03": "medellin_envigado",
    "COL-04": "medellin_bello",
    "COL-05": "medellin_itagui",
    "COL-06": "bogota_chapinero",
    "COL-07": "bogota_usaquen",
    "COL-08": "cali_granada",
    "COL-09": "barranquilla_norte",
    "COL-10": "central",
    "FLA-01": "miami_doral",
    "FLA-02": "miami_hialeah",
    "FLA-03": "miami_kendall",
    "FLA-04": "orlando_international",
}


@dataclass(frozen=True)
class ValidationIssue:
    """A plain-language validation issue for one source row."""

    field: str
    message: str


def _required(row: Mapping[str, str], field: str) -> str:
    return (row.get(field) or "").strip()


def validate_csv_row(row: Mapping[str, str]) -> list[ValidationIssue]:
    """Validate the analyzer row before applying manager-model transformations."""
    issues: list[ValidationIssue] = []
    if not _required(row, "incident_id"):
        issues.append(ValidationIssue("incident_id", "Incident identifier is required."))
    if not _required(row, "date"):
        issues.append(ValidationIssue("date", "Date is required."))
    else:
        try:
            datetime.strptime(_required(row, "date"), "%Y-%m-%d")
        except ValueError:
            issues.append(ValidationIssue("date", "Date must use YYYY-MM-DD format."))
    if not _required(row, "description"):
        issues.append(ValidationIssue("description", "Description is required."))
    if _required(row, "status") not in _CSV_STATUS_MAP:
        issues.append(ValidationIssue("status", "Status is not a recognized CSV value."))
    if _required(row, "category") not in _CSV_CATEGORY_MAP:
        issues.append(ValidationIssue("category", "Category is not a recognized CSV value."))
    return issues


def transform_csv_row(row: Mapping[str, str]) -> dict[str, object]:
    """Transform a validated analyzer row into an Incident persistence record."""
    issues = validate_csv_row(row)
    if issues:
        raise ValueError("; ".join(f"{issue.field}: {issue.message}" for issue in issues))

    description = _required(row, "description")
    created_at = datetime.strptime(_required(row, "date"), "%Y-%m-%d").replace(
        tzinfo=timezone.utc
    )
    return {
        "source_id": _required(row, "incident_id"),
        "title": description[:120].strip(),
        "description": description,
        "category": _CSV_CATEGORY_MAP[_required(row, "category")],
        "status": _CSV_STATUS_MAP[_required(row, "status")],
        "origin": "customer",
        "branch": _CSV_BRANCH_MAP.get(_required(row, "location_id"), "central"),
        "created_at": created_at.isoformat(),
        "updated_at": created_at.isoformat(),
    }
