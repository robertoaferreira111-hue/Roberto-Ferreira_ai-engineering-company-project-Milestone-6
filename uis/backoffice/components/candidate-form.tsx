"use client";

import { useState } from "react";

import { RECORD_STAGES, RECORD_STATUSES, STAGE_LABELS, STATUS_LABELS, type RecordStage, type RecordStatus, type RecordUpsertInput } from "@/types";

export type CandidateFormValues = RecordUpsertInput;

type CandidateFormErrors = Partial<Record<keyof CandidateFormValues, string>>;

type CandidateFormProps = {
  initialValues: CandidateFormValues;
  heading: string;
  submitLabel: string;
  isSubmitting: boolean;
  submitError: string | null;
  onSubmit: (values: CandidateFormValues) => Promise<void>;
};

function formatOptionLabel(value: string): string {
  return STATUS_LABELS[value] ?? STAGE_LABELS[value] ?? value
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function validateForm(values: CandidateFormValues): CandidateFormErrors {
  const errors: CandidateFormErrors = {};

  if (!values.full_name.trim()) {
    errors.full_name = "Name is required.";
  }

  if (!values.email.trim()) {
    errors.email = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!values.phone.trim()) {
    errors.phone = "Phone is required.";
  }

  if (!values.position.trim()) {
    errors.position = "Position is required.";
  }

  if (!values.status) {
    errors.status = "Status is required.";
  }

  if (!values.stage) {
    errors.stage = "Stage is required.";
  }

  if (Number.isNaN(values.experience_years)) {
    errors.experience_years = "Years of experience must be a number.";
  } else if (values.experience_years < 0) {
    errors.experience_years = "Years of experience cannot be negative.";
  }

  return errors;
}

export function CandidateForm({
  initialValues,
  heading,
  submitLabel,
  isSubmitting,
  submitError,
  onSubmit
}: CandidateFormProps) {
  const [values, setValues] = useState<CandidateFormValues>(initialValues);
  const [errors, setErrors] = useState<CandidateFormErrors>({});

  function updateField<K extends keyof CandidateFormValues>(field: K, value: CandidateFormValues[K]) {
    setValues((currentValues) => ({
      ...currentValues,
      [field]: value
    }));

    setErrors((currentErrors) => {
      if (!currentErrors[field]) {
        return currentErrors;
      }

      const nextErrors = { ...currentErrors };
      delete nextErrors[field];
      return nextErrors;
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors = validateForm(values);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    await onSubmit(values);
  }

  return (
    <main>
      <section>
        <h1>{heading}</h1>
      </section>

      <form onSubmit={handleSubmit} noValidate>
        <label htmlFor="full_name">Name</label>
        <input
          id="full_name"
          name="full_name"
          value={values.full_name}
          onChange={(event) => updateField("full_name", event.target.value)}
          aria-invalid={Boolean(errors.full_name)}
          aria-describedby={errors.full_name ? "full_name-error" : undefined}
        />
        {errors.full_name ? <p id="full_name-error">{errors.full_name}</p> : null}

        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          value={values.email}
          onChange={(event) => updateField("email", event.target.value)}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "email-error" : undefined}
        />
        {errors.email ? <p id="email-error">{errors.email}</p> : null}

        <label htmlFor="phone">Phone</label>
        <input
          id="phone"
          name="phone"
          value={values.phone}
          onChange={(event) => updateField("phone", event.target.value)}
          aria-invalid={Boolean(errors.phone)}
          aria-describedby={errors.phone ? "phone-error" : undefined}
        />
        {errors.phone ? <p id="phone-error">{errors.phone}</p> : null}

        <label htmlFor="position">Position</label>
        <input
          id="position"
          name="position"
          value={values.position}
          onChange={(event) => updateField("position", event.target.value)}
          aria-invalid={Boolean(errors.position)}
          aria-describedby={errors.position ? "position-error" : undefined}
        />
        {errors.position ? <p id="position-error">{errors.position}</p> : null}

        <label htmlFor="linkedin_url">LinkedIn</label>
        <input
          id="linkedin_url"
          name="linkedin_url"
          type="url"
          value={values.linkedin_url ?? ""}
          onChange={(event) => updateField("linkedin_url", event.target.value || null)}
        />

        <label htmlFor="cv_url">CV Link</label>
        <input
          id="cv_url"
          name="cv_url"
          type="url"
          value={values.cv_url ?? ""}
          onChange={(event) => updateField("cv_url", event.target.value || null)}
        />

        <label htmlFor="experience_years">Years of experience</label>
        <input
          id="experience_years"
          name="experience_years"
          type="number"
          min="0"
          step="1"
          value={values.experience_years}
          onChange={(event) => updateField("experience_years", Number(event.target.value))}
          aria-invalid={Boolean(errors.experience_years)}
          aria-describedby={errors.experience_years ? "experience_years-error" : undefined}
        />
        {errors.experience_years ? <p id="experience_years-error">{errors.experience_years}</p> : null}

        <label htmlFor="status">Status</label>
        <select
          id="status"
          name="status"
          value={values.status}
          onChange={(event) => updateField("status", event.target.value as RecordStatus)}
          aria-invalid={Boolean(errors.status)}
          aria-describedby={errors.status ? "status-error" : undefined}
        >
          {RECORD_STATUSES.map((status) => (
            <option key={status} value={status}>
              {formatOptionLabel(status)}
            </option>
          ))}
        </select>
        {errors.status ? <p id="status-error">{errors.status}</p> : null}

        <label htmlFor="stage">Stage</label>
        <select
          id="stage"
          name="stage"
          value={values.stage}
          onChange={(event) => updateField("stage", event.target.value as RecordStage)}
          aria-invalid={Boolean(errors.stage)}
          aria-describedby={errors.stage ? "stage-error" : undefined}
        >
          {RECORD_STAGES.map((stage) => (
            <option key={stage} value={stage}>
              {formatOptionLabel(stage)}
            </option>
          ))}
        </select>
        {errors.stage ? <p id="stage-error">{errors.stage}</p> : null}

        {submitError ? <p>{submitError}</p> : null}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : submitLabel}
        </button>
      </form>
    </main>
  );
}