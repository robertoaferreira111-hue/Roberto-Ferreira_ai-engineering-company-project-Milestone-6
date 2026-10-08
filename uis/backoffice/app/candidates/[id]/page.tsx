import { Suspense } from "react";

import { CandidateDetailPage } from "@/components/candidate-detail-page";

type CandidateRoutePageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    updated?: string;
  }>;
};

export default async function CandidateRoutePage({ params, searchParams }: CandidateRoutePageProps) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;

  return (
    <Suspense fallback={<main><p role="status">Loading record...</p></main>}>
      <CandidateDetailPage recordId={id} showUpdatedMessage={resolvedSearchParams.updated === "1"} />
    </Suspense>
  );
}