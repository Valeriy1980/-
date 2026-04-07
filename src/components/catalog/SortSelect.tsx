"use client";

import { useSearchParamsState } from "@/hooks/useSearchParamsState";

export const SORT_OPTIONS = [
  { value: "popular", label: "За популярністю" },
  { value: "new", label: "Новинки" },
  { value: "price-asc", label: "Ціна: спочатку дешеві" },
  { value: "price-desc", label: "Ціна: спочатку дорогі" },
  { value: "name", label: "За назвою" },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]["value"];

export function SortSelect() {
  const { params, update } = useSearchParamsState();
  const value = params.get("sort") ?? "popular";

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="muted">Сортування:</span>
      <select
        value={value}
        onChange={(e) =>
          update({
            sort: e.target.value === "popular" ? null : e.target.value,
            page: null,
          })
        }
        className="h-10 rounded-card border border-slate-200 bg-white px-3 outline-none focus:border-brand"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
