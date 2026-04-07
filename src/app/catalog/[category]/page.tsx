import { PageHeader } from "@/components/PageHeader";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  return (
    <div className="container-page">
      <PageHeader
        title={`Категорія: ${decodeURIComponent(category)}`}
        description="Сторінка категорії товарів."
      />
    </div>
  );
}
