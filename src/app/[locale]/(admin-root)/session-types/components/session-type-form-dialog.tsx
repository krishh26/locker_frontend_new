"use client";

import { useState, useEffect, useMemo } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useCreateSessionTypeMutation,
  useUpdateSessionTypeMutation,
} from "@/store/api/session-type/sessionTypeApi";
import type { SessionType } from "@/store/api/session-type/types";
import { useGetCentresQuery } from "@/store/api/centres/centreApi";
import { useAppSelector } from "@/store/hooks";
import { selectMasterAdminOrganisationId } from "@/store/slices/orgContextSlice";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

const sessionTypeSchema = (t: (key: string) => string) =>
  z.object({
    name: z.string().min(1, t("form.nameRequired")),
    isOffTheJob: z.boolean(),
    isActive: z.boolean(),
  });

type SessionTypeFormData = z.infer<ReturnType<typeof sessionTypeSchema>>;

interface SessionTypeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionType: SessionType | null;
  onSuccess: () => void;
}

export function SessionTypeFormDialog({
  open,
  onOpenChange,
  sessionType,
  onSuccess,
}: SessionTypeFormDialogProps) {
  const t = useTranslations("sessionTypes");
  const common = useTranslations("common");
  const isEditMode = !!sessionType;

  const [createSessionType, { isLoading: isCreating }] =
    useCreateSessionTypeMutation();
  const [updateSessionType, { isLoading: isUpdating }] =
    useUpdateSessionTypeMutation();
  const authUser = useAppSelector((state) => state.auth.user);
  const masterAdminOrgId = useAppSelector(selectMasterAdminOrganisationId);

  const organisationId =
    masterAdminOrgId ??
    (authUser?.assignedOrganisationIds?.length
      ? authUser.assignedOrganisationIds[0]
      : undefined);

  const { data: centresResponse } = useGetCentresQuery(
    organisationId != null ? { organisationId, limit: 500 } : undefined
  );
  const centres = useMemo(
    () => centresResponse?.data ?? [],
    [centresResponse]
  );

  type AuthUserWithCentres = {
    centre_ids?: number[];
    centre_id?: number;
  };

  const authUserWithCentres = authUser as AuthUserWithCentres | null;

  const authUserCentres = authUserWithCentres?.centre_ids;
  const authUserCentreId = authUserWithCentres?.centre_id;
  const singleCentreId = authUserCentres?.[0] ?? authUserCentreId;

  // Show centre selector when there are multiple centres, or when
  // there is at least one centre but we can't auto-resolve a single centre.
  const isOrgOrMultiCentre =
    centres.length > 1 || (centres.length >= 1 && singleCentreId == null);
  const [selectedCentreId, setSelectedCentreId] = useState<number | null>(null);

  useEffect(() => {
    if (!open) return;

    // Edit mode – prefill from existing session type if it has a centre
    if (sessionType?.centreId != null) {
      setSelectedCentreId(sessionType.centreId);
      return;
    }

    // Auto-select centre when we can safely infer a single option
    if (!isOrgOrMultiCentre && singleCentreId != null) {
      setSelectedCentreId(Number(singleCentreId));
    } else if (isOrgOrMultiCentre && centres.length > 0) {
      setSelectedCentreId((prev) => prev ?? centres[0].id);
    }
  }, [open, sessionType?.centreId, singleCentreId, centres, isOrgOrMultiCentre]);

  // Use the user's single centre when we don't show the selector,
  // otherwise rely on the explicitly selected centre.
  const centreId =
    isOrgOrMultiCentre
      ? selectedCentreId ?? undefined
      : singleCentreId != null
        ? Number(singleCentreId)
        : undefined;

  const form = useForm<SessionTypeFormData>({
    resolver: zodResolver(sessionTypeSchema(t)),
    defaultValues: {
      name: "",
      isOffTheJob: false,
      isActive: true,
    },
  });

  useEffect(() => {
    if (sessionType) {
      form.reset({
        name: sessionType.name,
        isOffTheJob: sessionType.isOffTheJob,
        isActive: sessionType.isActive,
      });
    } else {
      form.reset({
        name: "",
        isOffTheJob: false,
        isActive: true,
      });
    }
  }, [sessionType, form, open]);

  const handleSubmit = async (data: SessionTypeFormData) => {
    try {
      if (isEditMode && sessionType) {
        await updateSessionType({
          id: sessionType.id,
          payload: {
            name: data.name,
            is_off_the_job: data.isOffTheJob,
            active: data.isActive,
            ...(organisationId !== undefined && { organisation_id: organisationId }),
            ...(centreId !== undefined && centreId !== null && {
              centre_id: Number(centreId),
            }),
          },
        }).unwrap();
        toast.success(t("toast.updateSuccess"));
      } else {
        await createSessionType({
          name: data.name,
          is_off_the_job: data.isOffTheJob,
          active: data.isActive,
          ...(organisationId !== undefined && { organisation_id: organisationId }),
          ...(centreId !== undefined && centreId !== null && {
            centre_id: Number(centreId),
          }),
        }).unwrap();
        toast.success(t("toast.createSuccess"));
      }
      onSuccess();
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "data" in error
          ? (error as { data?: { message?: string } }).data?.message
          : error instanceof Error
          ? error.message
          : undefined;
      toast.error(errorMessage ?? t("toast.saveFailed"));
    }
  };

  const isLoading = isCreating || isUpdating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? t("formDialog.editTitle") : t("formDialog.createTitle")}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? t("formDialog.descriptionEdit")
              : t("formDialog.descriptionCreate")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <div className="space-y-4 py-4">
            {isOrgOrMultiCentre && (
              <div className="space-y-2">
                <Label htmlFor="centre">
                  {t("form.centreLabel")}{" "}
                  <span className="text-destructive">
                    {t("form.requiredAsterisk")}
                  </span>
                </Label>
                <Select
                  value={selectedCentreId != null ? String(selectedCentreId) : ""}
                  onValueChange={(v) => setSelectedCentreId(v ? Number(v) : null)}
                >
                  <SelectTrigger id="centre">
                    <SelectValue placeholder={t("form.centrePlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {centres.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name ?? `Centre ${c.id}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {t("form.centreHelperText")}
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">
                {t("form.nameLabel")}{" "}
                <span className="text-destructive">
                  {t("form.requiredAsterisk")}
                </span>
              </Label>
              <Input
                id="name"
                placeholder={t("form.namePlaceholder")}
                {...form.register("name")}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isOffTheJob"
                checked={form.watch("isOffTheJob")}
                onCheckedChange={(checked) =>
                  form.setValue("isOffTheJob", checked === true)
                }
              />
              <Label
                htmlFor="isOffTheJob"
                className="text-sm font-normal cursor-pointer"
              >
                {t("form.offTheJobLabel")}
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={form.watch("isActive")}
                onCheckedChange={(checked) =>
                  form.setValue("isActive", checked)
                }
              />
              <Label
                htmlFor="isActive"
                className="text-sm font-normal cursor-pointer"
              >
                {t("form.activeLabel")}
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              {common("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={
                isLoading ||
                !form.formState.isValid ||
                (isOrgOrMultiCentre && selectedCentreId == null)
              }
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isEditMode ? t("form.updating") : t("form.creating")}
                </>
              ) : isOrgOrMultiCentre && selectedCentreId == null ? (
                t("form.selectCentre")
              ) : isEditMode ? (
                t("form.update")
              ) : (
                t("form.create")
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
