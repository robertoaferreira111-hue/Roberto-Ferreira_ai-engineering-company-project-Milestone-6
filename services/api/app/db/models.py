"""Persistence representation of an Incident."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class Incident:
    id: str
    title: str
    description: str
    category: str
    status: str
    origin: str
    branch: str
    created_at: str
    updated_at: str
    source_id: str | None = None
