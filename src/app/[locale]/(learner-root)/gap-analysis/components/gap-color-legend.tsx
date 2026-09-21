"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "next-intl";

const GAP_LEGEND_ITEMS = [
  {
    key: "complete" as const,
    swatchClass: "bg-accent",
  },
  {
    key: "partial" as const,
    swatchClass: "bg-secondary",
  },
  {
    key: "none" as const,
    swatchClass: "bg-destructive",
  },
];

export function GapColorLegend() {
  const t = useTranslations("gapAnalysis.legend");

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t("title")}</CardTitle>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </CardHeader>
      <CardContent>
        <ul className="grid gap-4 sm:grid-cols-3">
          {GAP_LEGEND_ITEMS.map((item) => (
            <li key={item.key} className="flex items-start gap-3">
              <div
                className={`mt-0.5 h-5 w-10 shrink-0 rounded ${item.swatchClass}`}
                aria-hidden
              />
              <div className="min-w-0 space-y-0.5">
                <p className="text-sm font-medium text-foreground">
                  {t(`${item.key}.label`)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t(`${item.key}.detail`)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
