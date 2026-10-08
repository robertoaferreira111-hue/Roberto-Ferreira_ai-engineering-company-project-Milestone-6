import { CandidateEditPage } from "@/components/candidate-edit-page";

type CandidateEditRoutePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function CandidateEditRoutePage({ params }: CandidateEditRoutePageProps) {
  const { id } = await params;

  return <CandidateEditPage recordId={id} />;
}