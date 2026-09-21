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
      <CardContent className="space-y-5">
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

        <div className="flex items-start gap-3 border-t pt-4">
          <div className="mt-0.5 flex shrink-0 items-center gap-1" aria-hidden>
            <div className="h-2.5 w-2.5 rounded-sm border border-primary bg-primary" />
            <div className="h-2.5 w-2.5 rounded-sm border border-primary bg-primary" />
          </div>
          <div className="min-w-0 space-y-0.5">
            <p className="text-sm font-medium text-foreground">
              {t("evidencePoints.label")}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("evidencePoints.detail")}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
