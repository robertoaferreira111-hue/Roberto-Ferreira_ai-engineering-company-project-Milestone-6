"use client";

import { useState } from "react";

import { createIncident } from "@/lib";
import {
  BRANCHES,
  CATEGORY_LABELS,
  INCIDENT_CATEGORIES,
  INCIDENT_ORIGINS,
  INCIDENT_STATUSES,
  ORIGIN_LABELS,
  INCIDENT_STATUS_LABELS,
  type CreateIncidentInput
} from "@/types";

const EMPTY_FORM: CreateIncidentInput = {
  title: "",
  description: "",
  category: "",
  status: "open",
  origin: "",
  branch: ""
};

export function IncidentForm({ onCreated }: { onCreated: () => void }) {
  const [values, setValues] = useState<CreateIncidentInput>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof CreateIncidentInput, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function updateField(field: keyof CreateIncidentInput, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  }

  function validate(): boolean {
    const errors: Partial<Record<keyof CreateIncidentInput, string>> = {};
    if (!values.title.trim()) errors.title = "Enter a short title.";
    if (!values.description.trim()) errors.description = "Describe what happened.";
    if (!values.category) errors.category = "Select a category.";
    if (!values.origin) errors.origin = "Select the incident origin.";
    if (!values.branch) errors.branch = "Select the affected branch.";
    if (!values.status) errors.status = "Select an initial status.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    if (!validate()) return;
    setIsSubmitting(true);
    const result = await createIncident(values);
    setIsSubmitting(false);

    if (result.error) {
      const payload = result.error.details;
      if (payload && typeof payload === "object" && "field" in payload && "message" in payload) {
        const field = (payload as Record<string, unknown>).field as string;
        const message = (payload as Record<string, unknown>).message as string;
        if (field && message && field in values) {
          setFieldErrors((current) => ({ ...current, [field]: message }));
        } else {
          setError(message || "We could not register this incident. Check the fields and try again.");
        }
      } else {
        setError("We could not register this incident. Check the fields and try again.");
      }
      return;
    }

    setValues(EMPTY_FORM);
    setFieldErrors({});
    setMessage("Incident registered successfully.");
    onCreated();
  }

  return (
    <section className="panel" aria-labelledby="register-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">New report</p>
          <h2 id="register-heading">Register an incident</h2>
        </div>
        <span className="section-hint">Touch-friendly intake</span>
      </div>
      <form className="incident-form" onSubmit={submit}>
        <label>
          Title
          <input aria-describedby={fieldErrors.title ? "title-error" : undefined} aria-invalid={Boolean(fieldErrors.title)} maxLength={120} value={values.title} onChange={(event) => updateField("title", event.target.value)} placeholder="Short incident title" />
          {fieldErrors.title ? <span className="field-error" id="title-error">{fieldErrors.title}</span> : null}
        </label>
        <label>
          Description
          <textarea aria-describedby={fieldErrors.description ? "description-error" : undefined} aria-invalid={Boolean(fieldErrors.description)} rows={4} value={values.description} onChange={(event) => updateField("description", event.target.value)} placeholder="What happened? Include useful operational detail." />
          {fieldErrors.description ? <span className="field-error" id="description-error">{fieldErrors.description}</span> : null}
        </label>
        <div className="form-grid">
          <label>
            Category
            <select aria-describedby={fieldErrors.category ? "category-error" : undefined} aria-invalid={Boolean(fieldErrors.category)} value={values.category} onChange={(event) => updateField("category", event.target.value)}>
              <option value="">Select category</option>
              {INCIDENT_CATEGORIES.map((category) => <option key={category} value={category}>{CATEGORY_LABELS[category]}</option>)}
            </select>
            {fieldErrors.category ? <span className="field-error" id="category-error">{fieldErrors.category}</span> : null}
          </label>
          <label>
            Origin
            <select aria-describedby={fieldErrors.origin ? "origin-error" : undefined} aria-invalid={Boolean(fieldErrors.origin)} value={values.origin} onChange={(event) => updateField("origin", event.target.value)}>
              <option value="">Select origin</option>
              {INCIDENT_ORIGINS.map((origin) => <option key={origin} value={origin}>{ORIGIN_LABELS[origin]}</option>)}
            </select>
            {fieldErrors.origin ? <span className="field-error" id="origin-error">{fieldErrors.origin}</span> : null}
          </label>
          <label className={values.origin === "branch" ? "branch-field highlight" : "branch-field"}>
            Branch
            <select aria-describedby={fieldErrors.branch ? "branch-error" : undefined} aria-invalid={Boolean(fieldErrors.branch)} value={values.branch} onChange={(event) => updateField("branch", event.target.value)}>
              <option value="">Select branch</option>
              {BRANCHES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            {fieldErrors.branch ? <span className="field-error" id="branch-error">{fieldErrors.branch}</span> : null}
          </label>
          <label>
            Initial status
            <select aria-describedby={fieldErrors.status ? "status-error" : undefined} aria-invalid={Boolean(fieldErrors.status)} value={values.status} onChange={(event) => updateField("status", event.target.value)}>
              {INCIDENT_STATUSES.map((status) => <option key={status} value={status}>{INCIDENT_STATUS_LABELS[status]}</option>)}
            </select>
            {fieldErrors.status ? <span className="field-error" id="status-error">{fieldErrors.status}</span> : null}
          </label>
        </div>
        {error ? <p className="alert error" role="alert">{error}</p> : null}
        {message ? <p className="alert success" role="status">{message}</p> : null}
        <button className="button primary" disabled={isSubmitting} type="submit">{isSubmitting ? "Registering…" : "Register incident"}</button>
      </form>
    </section>
  );
}
