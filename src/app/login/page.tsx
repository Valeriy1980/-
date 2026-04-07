import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Вхід" };

export default function LoginPage() {
  return (
    <div className="container-page max-w-md">
      <PageHeader title="Вхід для партнерів" />
      <Card>
        <CardContent className="space-y-4">
          <label className="block text-sm">
            Email
            <input
              type="email"
              className="mt-1 h-11 w-full rounded-card border border-slate-200 px-3 outline-none focus:border-brand"
              placeholder="partner@example.com"
            />
          </label>
          <label className="block text-sm">
            Пароль
            <input
              type="password"
              className="mt-1 h-11 w-full rounded-card border border-slate-200 px-3 outline-none focus:border-brand"
            />
          </label>
          <Button className="w-full">Увійти</Button>
        </CardContent>
      </Card>
    </div>
  );
}
