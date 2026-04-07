import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "default" | "accent" | "muted" | "success";

const styles: Record<Variant, string> = {
  default: "bg-brand-50 text-brand-700",
  accent: "bg-orange-100 text-accent-600",
  muted: "bg-slate-100 text-slate-600",
  success: "bg-emerald-100 text-emerald-700",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        styles[variant],
        className,
      )}
      {...props}
    />
  );
}
