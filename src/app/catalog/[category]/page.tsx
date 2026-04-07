import { PageHeader } from "@/components/PageHeader";

export default function CategoryPage({
  params,
}: {
  params: { category: string };
}) {
  return (
    <div className="container-page">
      <PageHeader
        title={`Категорія: ${decodeURIComponent(params.category)}`}
        description="Сторінка категорії товарів."
      />
    </div>
  );
}
