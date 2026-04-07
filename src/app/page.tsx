import Link from "next/link";
import { ArrowRight, Sparkles, Tag, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="container-page space-y-12">
      <section className="rounded-card bg-gradient-to-r from-brand to-brand-700 p-8 text-white md:p-12">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium">
            <Sparkles className="h-3.5 w-3.5" />
            Цифровий шоурум для партнерів
          </div>
          <h1 className="mt-4 text-3xl font-bold leading-tight md:text-5xl">
            Каталог побутової техніки. Реальні залишки. Замовлення в один клік.
          </h1>
          <p className="mt-4 text-white/80">
            Показуйте товар покупцю прямо на планшеті — фото, характеристики
            та ціни завжди під рукою.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/catalog">
              <Button variant="accent" size="lg">
                Перейти в каталог
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/showroom">
              <Button variant="outline" size="lg" className="bg-white">
                Showroom-режим
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section>
        <h2 className="h2 mb-4">Чому партнери обирають нас</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              icon: Tag,
              title: "Оптові ціни",
              text: "Індивідуальні цінові групи та знижки для партнерів.",
            },
            {
              icon: Truck,
              title: "Швидка доставка",
              text: "Самовивіз або доставка прямо на вашу точку продажів.",
            },
            {
              icon: Sparkles,
              title: "Showroom-режим",
              text: "Демонструйте товари покупцю без зайвої службової інформації.",
            },
          ].map(({ icon: Icon, title, text }) => (
            <Card key={title}>
              <CardContent>
                <Icon className="h-8 w-8 text-brand" />
                <div className="mt-3 text-lg font-semibold">{title}</div>
                <p className="mt-1 text-sm muted">{text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
