"use client";

import { LayoutGrid, List } from "lucide-react";
import { useSearchParamsState } from "@/hooks/useSearchParamsState";
import { cn } from "@/lib/utils";

export function ViewToggle() {
  const { params, update } = useSearchParamsState();
  const view = params.get("view") === "list" ? "list" : "grid";

  const Btn = ({
    value,
    icon: Icon,
    label,
  }: {
    value: "grid" | "list";
    icon: typeof LayoutGrid;
    label: string;
  }) => (
    <button
      type="button"
      aria-label={label}
      aria-pressed={view === value}
      onClick={() =>
        update({ view: value === "grid" ? null : value })
      }
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-card border border-slate-200 bg-white",
        view === value
          ? "border-brand text-brand"
          : "text-slate-500 hover:text-ink",
      )}
    >
      <Icon className="h-5 w-5" />
    </button>
  );

  return (
    <div className="flex gap-2">
      <Btn value="grid" icon={LayoutGrid} label="Сітка" />
      <Btn value="list" icon={List} label="Список" />
    </div>
  );
}
