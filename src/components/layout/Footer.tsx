import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="container mx-auto grid gap-8 px-4 py-10 md:grid-cols-3">
        <div>
          <div className="text-lg font-bold text-brand">{SITE_NAME}</div>
          <p className="mt-2 text-sm muted">
            Цифровий шоурум для партнерів — каталог, ціни та замовлення
            побутової техніки.
          </p>
        </div>
        <div>
          <div className="mb-3 text-sm font-semibold text-ink">Розділи</div>
          <ul className="space-y-2 text-sm muted">
            <li>
              <Link href="/catalog" className="hover:text-brand">
                Каталог
              </Link>
            </li>
            <li>
              <Link href="/compare" className="hover:text-brand">
                Порівняння
              </Link>
            </li>
            <li>
              <Link href="/showroom" className="hover:text-brand">
                Showroom-режим
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <div className="mb-3 text-sm font-semibold text-ink">Партнерам</div>
          <ul className="space-y-2 text-sm muted">
            <li>
              <Link href="/login" className="hover:text-brand">
                Вхід у кабінет
              </Link>
            </li>
            <li>
              <Link href="/dashboard/orders" className="hover:text-brand">
                Замовлення
              </Link>
            </li>
            <li>
              <Link href="/dashboard/analytics" className="hover:text-brand">
                Аналітика
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-200 py-4 text-center text-xs muted">
        © {new Date().getFullYear()} {SITE_NAME}
      </div>
    </footer>
  );
}
