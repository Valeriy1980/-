"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";

/**
 * Helper to merge updates into the current URL search params and push.
 * Pass `null` to remove a key.
 */
export function useSearchParamsState() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const update = useCallback(
    (patch: Record<string, string | string[] | null>) => {
      const next = new URLSearchParams(params.toString());
      for (const [key, value] of Object.entries(patch)) {
        next.delete(key);
        if (value == null) continue;
        if (Array.isArray(value)) {
          for (const v of value) next.append(key, v);
        } else {
          next.set(key, value);
        }
      }
      router.push(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [params, pathname, router],
  );

  return { params, update };
}
