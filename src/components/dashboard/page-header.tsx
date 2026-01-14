"use client";

import { type LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  className?: string;
  showBackButton?: boolean;
  backButtonHref?: string;
}

export function PageHeader({
  title,
  subtitle,
  icon: Icon,
  className,
  showBackButton = false,
  backButtonHref,
}: PageHeaderProps) {
  const router = useRouter();

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
          Back
        </Button>
      )}
      <div className="flex items-center gap-3">
        {Icon && <Icon className="h-8 w-8 text-primary" />}
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      </div>
      {subtitle && (
        <p className="text-muted-foreground text-lg">{subtitle}</p>
      )}
    </div>
  );
}

