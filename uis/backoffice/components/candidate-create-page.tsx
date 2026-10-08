"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useAsync } from "@/hooks";
import { createRecord } from "@/lib";
import { CandidateForm, type CandidateFormValues } from "@/components/candidate-form";

const DEFAULT_VALUES: CandidateFormValues = {
  full_name: "",
  email: "",
  phone: "",
  position: "",
  linkedin_url: null,
  cv_url: null,
  status: "received",
  stage: "pending",
  experience_years: 0
};

export function CandidateCreatePage() {
  const router = useRouter();
  const createQuery = useAsync(createRecord);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleSubmit(values: CandidateFormValues) {
    setSubmitError(null);
    const result = await createQuery.execute(values);

    if (result.error) {
      setSubmitError(result.error.message);
      return;
    }

    router.push("/candidates?created=1");
  }

  return (
    <>
      <p>
        <Link href="/candidates">Back to records</Link>
      </p>
      <CandidateForm
        initialValues={DEFAULT_VALUES}
        heading="Register candidate"
        submitLabel="Create candidate"
        isSubmitting={createQuery.isLoading}
        submitError={submitError}
        onSubmit={handleSubmit}
      />
    </>
  );
}