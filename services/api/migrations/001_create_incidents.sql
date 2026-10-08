CREATE TABLE IF NOT EXISTS incidents (
    id TEXT PRIMARY KEY NOT NULL DEFAULT (lower(hex(randomblob(16)))),
    source_id TEXT UNIQUE,
    title TEXT NOT NULL CHECK (length(trim(title)) > 0),
    description TEXT NOT NULL CHECK (length(trim(description)) > 0),
    category TEXT NOT NULL CHECK (category IN (
        'equipment_failure', 'supply_issue', 'customer_complaint',
        'staff_issue', 'facility_issue', 'pos_system',
        'delivery_issue', 'other'
    )),
    status TEXT NOT NULL CHECK (status IN ('open', 'in_progress', 'resolved', 'discarded')),
    origin TEXT NOT NULL CHECK (origin IN ('customer', 'branch', 'internal')),
    branch TEXT NOT NULL CHECK (branch IN (
        'central', 'medellin_centro', 'medellin_laureles',
        'medellin_envigado', 'medellin_bello', 'medellin_itagui',
        'bogota_chapinero', 'bogota_usaquen', 'cali_granada',
        'barranquilla_norte', 'miami_doral', 'miami_hialeah',
        'miami_kendall', 'orlando_international', 'fort_lauderdale'
    )),
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TRIGGER IF NOT EXISTS incidents_updated_at
AFTER UPDATE ON incidents
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
    UPDATE incidents
    SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    WHERE id = OLD.id;
END;

CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_category ON incidents(category);
CREATE INDEX IF NOT EXISTS idx_incidents_origin ON incidents(origin);
CREATE INDEX IF NOT EXISTS idx_incidents_branch ON incidents(branch);
