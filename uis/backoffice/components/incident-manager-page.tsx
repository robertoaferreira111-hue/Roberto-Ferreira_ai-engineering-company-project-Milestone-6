"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { getIncidentSummary, getIncidents, updateIncidentStatus } from "@/lib";
import {
  BRANCHES,
  CATEGORY_LABELS,
  INCIDENT_CATEGORIES,
  INCIDENT_ORIGINS,
  INCIDENT_STATUSES,
  ORIGIN_LABELS,
  INCIDENT_STATUS_LABELS,
  type Incident,
  type IncidentCategory,
  type IncidentOrigin,
  type IncidentStatus
} from "@/types";
import { IncidentForm } from "@/components/incident-form";

const NEXT_STATUSES: Record<IncidentStatus, IncidentStatus[]> = {
  open: ["in_progress", "discarded"],
  in_progress: ["resolved", "discarded"],
  resolved: [],
  discarded: []
};

const branchLabels = Object.fromEntries(BRANCHES) as Record<string, string>;

function safeError() {
  return "The incident service is temporarily unavailable. Please try again.";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function IncidentManagerPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [summary, setSummary] = useState<Awaited<ReturnType<typeof getIncidentSummary>>["data"]>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<IncidentStatus | "">("");
  const [originFilter, setOriginFilter] = useState<IncidentOrigin | "">("");
  const [branchFilter, setBranchFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<IncidentCategory | "">("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const [listResult, summaryResult] = await Promise.all([getIncidents(), getIncidentSummary()]);
    if (listResult.error) {
      setError(safeError());
    } else {
      setIncidents(listResult.data);
    }
    if (summaryResult.error) {
      setError((current) => current ?? "The incident summary is temporarily unavailable.");
    } else {
      setSummary(summaryResult.data);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  const filteredIncidents = useMemo(() => incidents.filter((incident) =>
    (!statusFilter || incident.status === statusFilter) &&
    (!originFilter || incident.origin === originFilter) &&
    (!branchFilter || incident.branch === branchFilter) &&
    (!categoryFilter || incident.category === categoryFilter)
  ), [incidents, statusFilter, originFilter, branchFilter, categoryFilter]);

  async function changeStatus(incident: Incident, nextStatus: IncidentStatus) {
    const previous = incident.status;
    setUpdatingId(incident.id);
    setIncidents((current) => current.map((item) => item.id === incident.id ? { ...item, status: nextStatus } : item));
    const result = await updateIncidentStatus(incident.id, nextStatus);
    setUpdatingId(null);
    if (result.error) {
      setIncidents((current) => current.map((item) => item.id === incident.id ? { ...item, status: previous } : item));
      setError("That status change could not be saved. The incident was restored.");
      return;
    }
    void loadData();
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div><p className="brand-kicker">BRASALAND DIGITAL</p><h1>Incident command center</h1></div>
        <nav aria-label="Primary navigation"><Link className="nav-link" href="/">Backoffice</Link><Link className="nav-link active" href="/incidents">Incidents</Link><Link className="nav-link" href="/talent-pipeline">Talent pipeline</Link></nav>
      </header>
      <section className="hero"><div><p className="eyebrow">Operations visibility</p><h2>Every issue, one place.</h2><p>Capture reports from every Brasaland location and keep the operations team moving.</p></div><button className="button secondary" onClick={() => void loadData()} type="button">Refresh data</button></section>
      {error ? <p className="alert error" role="alert">{error}</p> : null}
      <div className="dashboard-grid">
        <IncidentForm onCreated={loadData} />
        <section className="panel summary-panel" aria-labelledby="summary-heading"><div className="section-heading"><div><p className="eyebrow">Live pulse</p><h2 id="summary-heading">Overview</h2></div></div><div className="metric-grid">{INCIDENT_STATUSES.map((status) => <div className={`metric status-${status}`} key={status}><span>{INCIDENT_STATUS_LABELS[status]}</span><strong>{summary?.by_status[status] ?? 0}</strong></div>)}</div><div className="summary-lists"><div className="summary-list"><h3>By category</h3>{INCIDENT_CATEGORIES.map((category) => <div className="summary-row" key={category}><span>{CATEGORY_LABELS[category]}</span><strong>{summary?.by_category[category] ?? 0}</strong></div>)}</div><div className="summary-list"><h3>By origin</h3>{INCIDENT_ORIGINS.map((origin) => <div className="summary-row" key={origin}><span>{ORIGIN_LABELS[origin]}</span><strong>{summary?.by_origin[origin] ?? 0}</strong></div>)}</div><div className="summary-list"><h3>By branch</h3>{BRANCHES.map(([value, label]) => <div className="summary-row" key={value}><span>{label}</span><strong>{summary?.by_branch[value] ?? 0}</strong></div>)}</div></div></section>
      </div>
      <section className="panel list-panel" aria-labelledby="list-heading"><div className="section-heading"><div><p className="eyebrow">Operations queue</p><h2 id="list-heading">Incidents</h2></div><span className="count-badge">{filteredIncidents.length} shown</span></div><div className="filters" aria-label="Incident filters"><label>Status<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as IncidentStatus | "")}><option value="">All statuses</option>{INCIDENT_STATUSES.map((value) => <option key={value} value={value}>{INCIDENT_STATUS_LABELS[value]}</option>)}</select></label><label>Origin<select value={originFilter} onChange={(event) => setOriginFilter(event.target.value as IncidentOrigin | "")}><option value="">All origins</option>{INCIDENT_ORIGINS.map((value) => <option key={value} value={value}>{ORIGIN_LABELS[value]}</option>)}</select></label><label>Branch<select value={branchFilter} onChange={(event) => setBranchFilter(event.target.value)}><option value="">All branches</option>{BRANCHES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>Category<select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value as IncidentCategory | "")}><option value="">All categories</option>{INCIDENT_CATEGORIES.map((value) => <option key={value} value={value}>{CATEGORY_LABELS[value]}</option>)}</select></label></div>{isLoading ? <p className="loading" role="status">Loading incidents…</p> : filteredIncidents.length === 0 ? <div className="empty-state"><h3>No incidents match these filters</h3><p>Try widening the queue filters or register a new report.</p></div> : <div className="incident-list">{filteredIncidents.map((incident) => <article className="incident-card" key={incident.id}><div className="incident-card-main"><div className="card-meta"><span className={`status-pill status-${incident.status}`}>{INCIDENT_STATUS_LABELS[incident.status]}</span><span>{CATEGORY_LABELS[incident.category]}</span><span>{ORIGIN_LABELS[incident.origin]}</span></div><h3>{incident.title}</h3><p>{incident.description}</p><div className="card-footer"><span>{branchLabels[incident.branch]}</span><time dateTime={incident.created_at}>{formatDate(incident.created_at)}</time></div></div><div className="status-control"><label htmlFor={`status-${incident.id}`}>Update status</label><select disabled={updatingId === incident.id || NEXT_STATUSES[incident.status].length === 0} id={`status-${incident.id}`} value={incident.status} onChange={(event) => void changeStatus(incident, event.target.value as IncidentStatus)}>{[incident.status, ...NEXT_STATUSES[incident.status]].map((status) => <option key={status} value={status}>{INCIDENT_STATUS_LABELS[status]}</option>)}</select>{updatingId === incident.id ? <small>Saving…</small> : null}</div></article>)}</div>}</section>
    </main>
  );
}
