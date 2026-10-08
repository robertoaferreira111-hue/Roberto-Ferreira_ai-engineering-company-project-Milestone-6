import { Suspense } from "react";

import { RecordsListPage } from "@/components/records-list-page";

export default function TalentPipelinePage() {
  return (
    <Suspense fallback={<main><p role="status">Loading talent pipeline...</p></main>}>
      <RecordsListPage />
    </Suspense>
  );
}
