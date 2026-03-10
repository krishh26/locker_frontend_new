"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGetUsersQuery } from "@/store/api/user/userApi";
import type { SampleAction } from "@/store/api/qa-sample-plan/types";
import { formatDateForInput } from "../utils/constants";

const getActionFormSchema = (
  t: (key: string, values?: Record<string, string | number | Date>) => string
) =>
  z.object({
    action_with_id: z.string().min(1, t("validation.actionWithRequired")),
    action_required: z
      .string()
      .min(1, t("validation.actionRequiredRequired"))
      .max(1000, t("validation.actionRequiredMax")),
    target_date: z.string().min(1, t("validation.targetDateRequired")),
    status: z.enum(["Pending", "In Progress", "Completed", "Closed"]),
    assessor_feedback: z.string().optional(),
  });

type ActionFormValues = {
  action_with_id: string;
  action_required: string;
  target_date: string;
  status: "Pending" | "In Progress" | "Completed" | "Closed";
  assessor_feedback?: string;
};

export interface ActionFormData {
  action_with_id: string | number;
  action_required: string;
  target_date: string;
  status: "Pending" | "In Progress" | "Completed" | "Closed";
  assessor_feedback?: string;
}

interface ActionModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: ActionFormData) => Promise<void>;
  editingAction?: SampleAction | null;
  isSaving?: boolean;
}

const statusOptions: Array<"Pending" | "In Progress" | "Completed" | "Closed"> = [
  "Pending",
  "In Progress",
  "Completed",
  "Closed",
];

export function ActionModal({
  open,
  onClose,
  onSave,
  editingAction,
  isSaving = false,
}: ActionModalProps) {
  const t = useTranslations("qaSamplePlan.actionModal");
  const commonT = useTranslations("common");
  const { data: usersData, isLoading: isLoadingUsers } = useGetUsersQuery({
    page: 1,
    page_size: 500,
  });

  const users = usersData?.data || [];

  const form = useForm<ActionFormValues>({
    resolver: zodResolver(getActionFormSchema(t)),
    defaultValues: {
      action_with_id: "",
      action_required: "",
      target_date: "",
      status: "Pending",
      assessor_feedback: "",
    },
  });

  useEffect(() => {
    if (open) {
      if (editingAction) {
        form.reset({
          action_with_id: String(editingAction.action_with.user_id),
          action_required: editingAction.action_required,
          target_date: editingAction.target_date
            ? formatDateForInput(editingAction.target_date)
            : "",
          status: editingAction.status,
          assessor_feedback: editingAction.assessor_feedback || "",
        });
      } else {
        form.reset({
          action_with_id: "",
          action_required: "",
          target_date: "",
          status: "Pending",
          assessor_feedback: "",
        });
      }
    }
  }, [open, editingAction, form]);

  const handleSave = async (data: ActionFormValues) => {
    await onSave({
      action_with_id: Number(data.action_with_id),
      action_required: data.action_required,
      target_date: data.target_date,
      status: data.status,
      assessor_feedback: data.assessor_feedback,
    });
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {editingAction ? t("descriptionEdit") : t("descriptionCreate")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
          {/* Action With Name */}
          <div className="space-y-2">
            <Label htmlFor="action_with_id">{t("fields.actionWithName")}</Label>
            <Controller
              name="action_with_id"
              control={form.control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isLoadingUsers}
                >
                  <SelectTrigger id="action_with_id">
                    <SelectValue placeholder={t("placeholders.selectUser")} />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.user_id} value={String(user.user_id)}>
                        {user.first_name} {user.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.action_with_id && (
              <p className="text-sm text-destructive">
                {form.formState.errors.action_with_id.message}
              </p>
            )}
          </div>

          {/* Action Required */}
          <div className="space-y-2">
            <Label htmlFor="action_required">
              {t("fields.actionRequired")}{" "}
              <span className="text-muted-foreground text-xs">
                ({t("maxCharactersHint")})
              </span>
            </Label>
            <Textarea
              id="action_required"
              {...form.register("action_required")}
              rows={4}
              maxLength={1000}
              className="resize-none"
            />
            {form.formState.errors.action_required && (
              <p className="text-sm text-destructive">
                {form.formState.errors.action_required.message}
              </p>
            )}
          </div>

          {/* Target Date */}
          <div className="space-y-2">
            <Label htmlFor="target_date">{t("fields.targetDate")}</Label>
            <Input
              id="target_date"
              type="date"
              {...form.register("target_date")}
            />
            {form.formState.errors.target_date && (
              <p className="text-sm text-destructive">
                {form.formState.errors.target_date.message}
              </p>
            )}
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">{t("fields.status")}</Label>
            <Controller
              name="status"
              control={form.control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status} value={status}>
                        {t(`status.${status}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Assessor Feedback */}
          <div className="space-y-2">
            <Label htmlFor="assessor_feedback">{t("fields.assessorFeedback")}</Label>
            <Textarea
              id="assessor_feedback"
              {...form.register("assessor_feedback")}
              rows={4}
              className="resize-none"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSaving}
            >
              {t("cancelClose")}
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("saving")}
                </>
              ) : (
                commonT("save")
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

