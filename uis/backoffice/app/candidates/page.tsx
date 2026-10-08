import { Suspense } from "react";

import { RecordsListPage } from "@/components/records-list-page";

export default function CandidatesPage() {
  return <Suspense fallback={<main><p role="status">Loading records...</p></main>}><RecordsListPage /></Suspense>;
}
