import { PageHeader } from "@/components/PageHeader";

export default function ShowroomProductPage({
  params,
}: {
  params: { slug: string };
}) {
  return (
    <div className="container-page">
      <PageHeader title={`Showroom: ${decodeURIComponent(params.slug)}`} />
    </div>
  );
}
