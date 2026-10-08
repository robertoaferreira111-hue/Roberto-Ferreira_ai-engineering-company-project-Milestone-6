import { apiRequest } from "@/lib/api-client";
import type {
  ApiResult,
  CreateIncidentInput,
  Incident,
  IncidentStatus,
  IncidentSummary
} from "@/types";

export function getIncidents(filters: {
  status?: string;
  origin?: string;
  branch?: string;
} = {}): Promise<ApiResult<Incident[]>> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }
  const query = params.toString();
  return apiRequest<Incident[]>(`api/incidents${query ? `?${query}` : ""}`);
}

export function createIncident(input: CreateIncidentInput): Promise<ApiResult<Incident>> {
  return apiRequest<Incident>("api/incidents", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function getIncidentById(incidentId: string): Promise<ApiResult<Incident>> {
  return apiRequest<Incident>(`api/incidents/${incidentId}`);
}

export function updateIncidentStatus(
  incidentId: string,
  status: IncidentStatus
): Promise<ApiResult<Incident>> {
  return apiRequest<Incident>(`api/incidents/${incidentId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status })
  });
}

export function getIncidentSummary(): Promise<ApiResult<IncidentSummary>> {
  return apiRequest<IncidentSummary>("api/incidents/summary");
}
