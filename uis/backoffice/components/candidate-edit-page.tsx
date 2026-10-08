"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { CandidateForm, type CandidateFormValues } from "@/components/candidate-form";
import { useAsync } from "@/hooks";
import { getRecordById, updateRecord } from "@/lib";

type CandidateEditPageProps = {
  recordId: string;
};

function toFormValues(data: ReturnType<typeof getInitialRecordValues>): CandidateFormValues {
  return data;
}

function getInitialRecordValues(record: {
  full_name: string;
  email: string;
  phone: string;
  position: string;
  linkedin_url?: string | null;
  cv_url?: string | null;
  status: CandidateFormValues["status"];
  stage: CandidateFormValues["stage"];
  experience_years: number;
}): CandidateFormValues {
  return {
    full_name: record.full_name,
    email: record.email,
    phone: record.phone,
    position: record.position,
    linkedin_url: record.linkedin_url ?? null,
    cv_url: record.cv_url ?? null,
    status: record.status,
    stage: record.stage,
    experience_years: record.experience_years
  };
}

export function CandidateEditPage({ recordId }: CandidateEditPageProps) {
  const router = useRouter();
  const recordQuery = useAsync(getRecordById);
  const updateQuery = useAsync(updateRecord);
  const [initialValues, setInitialValues] = useState<CandidateFormValues | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    void recordQuery.execute(recordId);
  }, [recordId, recordQuery]);

  useEffect(() => {
    if (recordQuery.data) {
      setInitialValues(toFormValues(getInitialRecordValues(recordQuery.data)));
    }
  }, [recordQuery.data]);

  async function handleSubmit(values: CandidateFormValues) {
    setSubmitError(null);
    const result = await updateQuery.execute(recordId, values);

    if (result.error) {
      setSubmitError(result.error.message);
      return;
    }

    router.push(`/candidates/${recordId}?updated=1`);
  }

  return (
    <main>
      <p>
        <Link href={`/candidates/${recordId}`}>Back to candidate</Link>
      </p>

      {recordQuery.isLoading && !initialValues ? <p role="status">Loading candidate...</p> : null}

      {recordQuery.error && !initialValues ? (
        <section aria-live="polite">
          <h1>Unable to load candidate</h1>
          <p>{recordQuery.error.message}</p>
        </section>
      ) : null}

      {initialValues ? (
        <CandidateForm
          initialValues={initialValues}
          heading="Edit candidate"
          submitLabel="Save candidate"
          isSubmitting={updateQuery.isLoading}
          submitError={submitError}
          onSubmit={handleSubmit}
        />
      ) : null}
    </main>
  );
}