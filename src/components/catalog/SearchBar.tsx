"use client";

import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParamsState } from "@/hooks/useSearchParamsState";

export function SearchBar() {
  const { params, update } = useSearchParamsState();
  const initial = params.get("q") ?? "";
  const [value, setValue] = useState(initial);

  // Keep input in sync if URL changes externally (e.g. reset).
  useEffect(() => {
    setValue(params.get("q") ?? "");
  }, [params]);

  // Debounced URL update.
  useEffect(() => {
    if (value === (params.get("q") ?? "")) return;
    const t = setTimeout(() => {
      update({ q: value || null, page: null });
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="relative w-full sm:max-w-sm">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Пошук за назвою, артикулом або брендом..."
        className="h-10 w-full rounded-card border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-brand"
      />
    </div>
  );
}
