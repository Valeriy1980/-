"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export function ProductGallery({
  images,
  alt,
}: {
  images: string[];
  alt: string;
}) {
  const [active, setActive] = useState(0);
  const [errored, setErrored] = useState<Set<number>>(new Set());

  const visible = images.filter((_, i) => !errored.has(i));
  const current = visible[active] ?? images[active] ?? null;

  if (!current) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-card border border-slate-200 bg-slate-100 text-sm text-slate-400">
        Фото відсутнє
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-hidden rounded-card border border-slate-200 bg-white">
        <div className="aspect-square">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={current}
            alt={alt}
            className="h-full w-full object-contain p-6"
            onError={() => {
              setErrored((s) => new Set(s).add(active));
              setActive(0);
            }}
          />
        </div>
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-2 sm:grid-cols-6">
          {images.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              className={cn(
                "aspect-square overflow-hidden rounded-card border bg-white p-1",
                i === active
                  ? "border-brand ring-2 ring-brand/30"
                  : "border-slate-200 hover:border-slate-300",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={`${alt} — фото ${i + 1}`}
                className="h-full w-full object-contain"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
