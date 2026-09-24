"use client";

import type { ReactNode } from "react";
import { type LucideIcon } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  className?: string;
  showBackButton?: boolean;
  backButtonHref?: string;
  /** Optional right-side content (e.g. time log summary on learner dashboard) */
  actions?: ReactNode;
}

export function PageHeader({
  title,
  subtitle,
  icon: Icon,
  className,
  showBackButton = false,
  backButtonHref,
  actions,
}: PageHeaderProps) {
  const router = useRouter();
  const t = useTranslations("common");

  const handleBack = () => {
    if (backButtonHref) {
      router.push(backButtonHref);
    } else {
      router.back();
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      {showBackButton && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="mb-2 -ml-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("back")}
        </Button>
      )}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2.5">
            {Icon && <Icon className="h-7 w-7 text-primary shrink-0" />}
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
          </div>
          {subtitle && (
            <p className="text-muted-foreground text-sm sm:text-base">{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className="shrink-0 sm:ml-3">{actions}</div>
        )}
      </div>
    </div>
  );
}
