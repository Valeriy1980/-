export function PageHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-6">
      <h1 className="h1">{title}</h1>
      {description && <p className="mt-2 muted">{description}</p>}
    </div>
  );
}
