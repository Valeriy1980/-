"use client";

import { useSearchParamsState } from "@/hooks/useSearchParamsState";
import { MOCK_BRANDS, MOCK_CATEGORIES } from "@/lib/mock/products";
import { Button } from "@/components/ui/button";

function toggleInList(list: string[], value: string): string[] {
  return list.includes(value)
    ? list.filter((v) => v !== value)
    : [...list, value];
}

export function FilterSidebar() {
  const { params, update } = useSearchParamsState();

  const selectedCategories = params.getAll("category");
  const selectedBrands = params.getAll("brand");
  const minPrice = params.get("min") ?? "";
  const maxPrice = params.get("max") ?? "";
  const stock = params.get("stock") ?? "all";

  return (
    <aside className="rounded-card border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">Фільтри</div>
        <button
          type="button"
          onClick={() =>
            update({
              category: null,
              brand: null,
              min: null,
              max: null,
              stock: null,
              page: null,
            })
          }
          className="text-xs text-brand hover:underline"
        >
          Скинути
        </button>
      </div>

      <Section title="Категорія">
        {MOCK_CATEGORIES.map((c) => (
          <Check
            key={c.id}
            label={c.name}
            checked={selectedCategories.includes(c.slug)}
            onChange={() =>
              update({
                category: toggleInList(selectedCategories, c.slug),
                page: null,
              })
            }
          />
        ))}
      </Section>

      <Section title="Бренд">
        {MOCK_BRANDS.map((b) => (
          <Check
            key={b.id}
            label={b.name}
            checked={selectedBrands.includes(b.slug)}
            onChange={() =>
              update({
                brand: toggleInList(selectedBrands, b.slug),
                page: null,
              })
            }
          />
        ))}
      </Section>

      <Section title="Ціна, ₴">
        <div className="flex gap-2">
          <input
            type="number"
            inputMode="numeric"
            placeholder="від"
            defaultValue={minPrice}
            onBlur={(e) =>
              update({ min: e.target.value || null, page: null })
            }
            className="h-9 w-full rounded-card border border-slate-200 px-2 text-sm outline-none focus:border-brand"
          />
          <input
            type="number"
            inputMode="numeric"
            placeholder="до"
            defaultValue={maxPrice}
            onBlur={(e) =>
              update({ max: e.target.value || null, page: null })
            }
            className="h-9 w-full rounded-card border border-slate-200 px-2 text-sm outline-none focus:border-brand"
          />
        </div>
      </Section>

      <Section title="Наявність">
        <div className="flex flex-col gap-2 text-sm">
          {[
            { v: "all", l: "Усі" },
            { v: "in", l: "В наявності" },
            { v: "order", l: "Під замовлення" },
          ].map((opt) => (
            <label key={opt.v} className="flex items-center gap-2">
              <input
                type="radio"
                name="stock"
                checked={stock === opt.v}
                onChange={() =>
                  update({
                    stock: opt.v === "all" ? null : opt.v,
                    page: null,
                  })
                }
              />
              {opt.l}
            </label>
          ))}
        </div>
      </Section>

      <Button
        variant="outline"
        className="mt-4 w-full"
        onClick={() =>
          update({
            category: null,
            brand: null,
            min: null,
            max: null,
            stock: null,
            page: null,
          })
        }
      >
        Скинути всі фільтри
      </Button>
    </aside>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-5 border-t border-slate-100 pt-4">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </div>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm">
      <input
        type="checkbox"
        className="h-4 w-4 rounded border-slate-300 accent-brand"
        checked={checked}
        onChange={onChange}
      />
      {label}
    </label>
  );
}
