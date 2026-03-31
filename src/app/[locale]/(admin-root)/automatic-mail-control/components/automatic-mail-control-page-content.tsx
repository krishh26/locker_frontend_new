"use client";

import { useEffect, useState } from "react";
import { Mail, AlertTriangle, Save, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import {
  useGetAutomaticMailControlConfigQuery,
  useSaveAutomaticMailControlConfigMutation,
} from "@/store/api/automatic-mail-control/automaticMailControlApi";

type DaysOption = 3 | 5 | 7;

export function AutomaticMailControlPageContent() {
  const t = useTranslations("automaticMailControl");
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [days, setDays] = useState<DaysOption>(3);
  const [trainerDays, setTrainerDays] = useState<DaysOption>(3);

  const {
    data: configResponse,
    isLoading,
    error,
    refetch,
  } = useGetAutomaticMailControlConfigQuery();

  const [saveConfig, { isLoading: isSaving }] =
    useSaveAutomaticMailControlConfigMutation();

  useEffect(() => {
    if (configResponse?.data && isInitialLoad) {
      setDays(configResponse.data.session_reminder_days_before ?? 3);
      setTrainerDays(configResponse.data.trainer_session_reminder_days_before ?? 3);
      setIsInitialLoad(false);
    }
  }, [configResponse, isInitialLoad]);

  const handleSave = async () => {
    try {
      await saveConfig({
        session_reminder_days_before: days,
        enabled: true,
        trainer_session_reminder_days_before: trainerDays,
        trainer_enabled: true,
      }).unwrap();
      toast.success(t("toast.configSaved"));
      refetch();
    } catch (e: any) {
      const msg = e?.data?.message || e?.message || t("toast.saveFailed");
      toast.error(msg);
    }
  };

  return (
    <div className="space-y-6 px-4 lg:px-6 pb-8">
      <PageHeader
        title={t("pageTitle")}
        subtitle={t("pageSubtitle")}
        icon={Mail}
      />

      {isLoading && (
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-64" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {(error as { data?: { message?: string }; message?: string }).data
              ?.message ||
              (error as any)?.message ||
              t("toast.loadFailed")}
          </AlertDescription>
        </Alert>
      )}

      {!isLoading && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{t("cardTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t("reminderDaysLabel")}</Label>
                <RadioGroup
                  value={String(days)}
                  onValueChange={(v) => setDays(Number(v) as DaysOption)}
                  className="grid gap-3"
                >
                  {[3, 5, 7].map((opt) => (
                    <label
                      key={opt}
                      className="flex items-center gap-3 rounded-md border p-3 cursor-pointer hover:bg-muted/40"
                    >
                      <RadioGroupItem value={String(opt)} />
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {t("optionDays", { days: opt })}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {t("optionHint", { days: opt })}
                        </span>
                      </div>
                    </label>
                  ))}
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("trainerCardTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t("trainerReminderDaysLabel")}</Label>
                <RadioGroup
                  value={String(trainerDays)}
                  onValueChange={(v) => setTrainerDays(Number(v) as DaysOption)}
                  className="grid gap-3"
                >
                  {[3, 5, 7].map((opt) => (
                    <label
                      key={opt}
                      className="flex items-center gap-3 rounded-md border p-3 cursor-pointer hover:bg-muted/40"
                    >
                      <RadioGroupItem value={String(opt)} />
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {t("optionDays", { days: opt })}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {t("trainerOptionHint", { days: opt })}
                        </span>
                      </div>
                    </label>
                  ))}
                </RadioGroup>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("saving")}
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {t("save")}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

