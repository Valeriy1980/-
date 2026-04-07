import { PageHeader } from "@/components/PageHeader";

export default async function ShowroomProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <div className="container-page">
      <PageHeader title={`Showroom: ${decodeURIComponent(slug)}`} />
    </div>
  );
}
