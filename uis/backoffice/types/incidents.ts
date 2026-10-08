export const INCIDENT_STATUSES = ["open", "in_progress", "resolved", "discarded"] as const;
export type IncidentStatus = (typeof INCIDENT_STATUSES)[number];

export const INCIDENT_ORIGINS = ["customer", "branch", "internal"] as const;
export type IncidentOrigin = (typeof INCIDENT_ORIGINS)[number];

export const INCIDENT_CATEGORIES = [
  "equipment_failure",
  "supply_issue",
  "customer_complaint",
  "staff_issue",
  "facility_issue",
  "pos_system",
  "delivery_issue",
  "other"
] as const;
export type IncidentCategory = (typeof INCIDENT_CATEGORIES)[number];

export const BRANCHES = [
  ["central", "Central (Medellín / Miami)"],
  ["medellin_centro", "Medellín Centro"],
  ["medellin_laureles", "Medellín Laureles"],
  ["medellin_envigado", "Medellín Envigado"],
  ["medellin_bello", "Medellín Bello"],
  ["medellin_itagui", "Medellín Itagüí"],
  ["bogota_chapinero", "Bogotá Chapinero"],
  ["bogota_usaquen", "Bogotá Usaquén"],
  ["cali_granada", "Cali Granada"],
  ["barranquilla_norte", "Barranquilla Norte"],
  ["miami_doral", "Miami Doral"],
  ["miami_hialeah", "Miami Hialeah"],
  ["miami_kendall", "Miami Kendall"],
  ["orlando_international", "Orlando International Drive"],
  ["fort_lauderdale", "Fort Lauderdale"]
] as const;
export type IncidentBranch = (typeof BRANCHES)[number][0];

export const INCIDENT_STATUS_LABELS: Record<IncidentStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  resolved: "Resolved",
  discarded: "Discarded"
};

export const ORIGIN_LABELS: Record<IncidentOrigin, string> = {
  customer: "Customer",
  branch: "Branch",
  internal: "Internal"
};

export const CATEGORY_LABELS: Record<IncidentCategory, string> = {
  equipment_failure: "Equipment failure",
  supply_issue: "Supply issue",
  customer_complaint: "Customer complaint",
  staff_issue: "Staff issue",
  facility_issue: "Facility issue",
  pos_system: "POS system",
  delivery_issue: "Delivery issue",
  other: "Other"
};

export interface Incident {
  id: string;
  source_id?: string | null;
  title: string;
  description: string;
  category: IncidentCategory;
  status: IncidentStatus;
  origin: IncidentOrigin;
  branch: IncidentBranch;
  created_at: string;
  updated_at: string;
}

export interface CreateIncidentInput {
  title: string;
  description: string;
  category: IncidentCategory | "";
  status: IncidentStatus | "";
  origin: IncidentOrigin | "";
  branch: IncidentBranch | "";
}

export interface IncidentSummary {
  by_status: Record<IncidentStatus, number>;
  by_category: Record<IncidentCategory, number>;
  by_origin: Record<IncidentOrigin, number>;
  by_branch: Record<IncidentBranch, number>;
}
