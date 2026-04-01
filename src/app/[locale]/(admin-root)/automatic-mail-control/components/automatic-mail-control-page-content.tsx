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
  useListSessionReminderSettingsQuery,
  useSetActiveSessionReminderDaysMutation,
} from "@/store/api/session-settings/sessionReminderSettingsApi";
import { useAppSelector } from "@/store/hooks";
import { selectMasterAdminOrganisationId } from "@/store/slices/orgContextSlice";
import type { AuthUser } from "@/store/api/auth/types";

type DaysOption = 3 | 5 | 7;
const DAYS_OPTIONS: DaysOption[] = [3, 5, 7];

export function AutomaticMailControlPageContent() {
  const t = useTranslations("automaticMailControl");
  const [days, setDays] = useState<DaysOption>(3);

  const masterAdminOrgId = useAppSelector(selectMasterAdminOrganisationId);
  const authUser = useAppSelector((state) => state.auth.user) as AuthUser | undefined;
  const organisationId =
    masterAdminOrgId ??
    (authUser?.assignedOrganisationIds?.[0] != null
      ? Number(authUser.assignedOrganisationIds[0])
      : undefined);

  const listArg =
    organisationId != null ? { organisation_id: organisationId } : undefined;

  const {
    data: reminderSettingsResponse,
    isLoading,
    isSuccess,
    error,
    refetch,
  } = useListSessionReminderSettingsQuery(listArg);

  const [setActiveDays, { isLoading: isSaving }] =
    useSetActiveSessionReminderDaysMutation();

  // Sync radio from API only after a successful load — avoids racing before data exists
  // (otherwise first run used [] and locked days to 3 even when the API returns 5).
  useEffect(() => {
    if (!isSuccess) return;
    const settings = reminderSettingsResponse?.data ?? [];
    const active = settings.find((s) => s.is_active);
    const activeDays = Number(active?.days_before);
    if (DAYS_OPTIONS.includes(activeDays as DaysOption)) {
      setDays(activeDays as DaysOption);
    } else {
      setDays(3);
    }
  }, [isSuccess, reminderSettingsResponse]);

  const handleSave = async () => {
    try {
      await setActiveDays({
        days_before: days,
        ...(organisationId != null ? { organisation_id: organisationId } : {}),
      }).unwrap();
      toast.success(t("toast.configSaved"));
      refetch();
    } catch (e: unknown) {
      const err = e as { data?: { message?: string }; message?: string };
      const msg = err?.data?.message || err?.message || t("toast.saveFailed");
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
            {
              (
                error as {
                  data?: { message?: string };
                  message?: string;
                }
              )?.data?.message ||
                (
                  error as {
                    message?: string;
                  }
                )?.message ||
                t("toast.loadFailed")
            }
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
                  {DAYS_OPTIONS.map((opt) => (
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

