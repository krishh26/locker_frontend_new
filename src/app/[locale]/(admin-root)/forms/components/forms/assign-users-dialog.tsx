"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useGetAllUsersQuery,
  useAssignUsersToFormMutation,
} from "@/store/api/forms/formsApi";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

function getAssignUsersSchema(t: (key: string) => string) {
  return z.object({
    assignType: z.string().min(1, t("assignUsers.validationSelectType")),
    user_ids: z.array(z.union([z.string(), z.number()])).optional(),
  });
}

type AssignUsersFormValues = z.infer<ReturnType<typeof getAssignUsersSchema>>;

interface AssignUsersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formId: string | number;
  formName: string;
  onSuccess: () => void;
}

const assignOptions = [
  { value: "All", label: "All" },
  { value: "All Learner", label: "All Learner" },
  { value: "All EQA", label: "All EQA" },
  { value: "All Trainer", label: "All Trainer" },
  { value: "All Employer", label: "All Employer" },
  { value: "All IQA", label: "All IQA" },
  { value: "All LIQA", label: "All LIQA" },
  { value: "Individual", label: "Individual" },
];

const ASSIGN_OPTION_KEYS: Record<string, string> = {
  All: "assignUsers.optionAll",
  "All Learner": "assignUsers.optionAllLearner",
  "All EQA": "assignUsers.optionAllEQA",
  "All Trainer": "assignUsers.optionAllTrainer",
  "All Employer": "assignUsers.optionAllEmployer",
  "All IQA": "assignUsers.optionAllIQA",
  "All LIQA": "assignUsers.optionAllLIQA",
  Individual: "assignUsers.optionIndividual",
};

export function AssignUsersDialog({
  open,
  onOpenChange,
  formId,
  formName,
  onSuccess,
}: AssignUsersDialogProps) {
  const t = useTranslations("forms");
  const schema = useMemo(() => getAssignUsersSchema(t), [t]);
  const [selectedUserIds, setSelectedUserIds] = useState<(string | number)[]>([]);
  const { data: usersData, isLoading: isLoadingUsers } = useGetAllUsersQuery(
    undefined,
    { skip: !open }
  );
  const [assignUsers, { isLoading: isAssigning }] = useAssignUsersToFormMutation();

  const form = useForm<AssignUsersFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      assignType: "",
      user_ids: [],
    },
  });

  const assignType = form.watch("assignType");

  useEffect(() => {
    if (!open) {
      form.reset();
      setSelectedUserIds([]);
    }
  }, [open, form]);

  const handleUserToggle = (userId: string | number) => {
    setSelectedUserIds((prev) => {
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  useEffect(() => {
    form.setValue("user_ids", selectedUserIds);
  }, [selectedUserIds, form]);

  const onSubmit = async (values: AssignUsersFormValues) => {
    try {
      if (values.assignType === "Individual" && (!values.user_ids || values.user_ids.length === 0)) {
        toast.error(t("assignUsers.toastSelectOneUser"));
        return;
      }

      await assignUsers({
        formId,
        assign: values.assignType !== "Individual" ? values.assignType : undefined,
        user_ids: values.assignType === "Individual" ? values.user_ids : undefined,
      }).unwrap();

      toast.success(t("assignUsers.toastSuccess"));
      onSuccess();
      onOpenChange(false);
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "data" in error
          ? (error as { data?: { message?: string } }).data?.message
          : undefined;
      toast.error(errorMessage || t("assignUsers.toastFailed"));
    }
  };

  const isLoading = isAssigning;
  const hasErrors = Object.keys(form.formState.errors).length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("assignUsers.dialogTitle")}</DialogTitle>
          <DialogDescription>
            {t("assignUsers.dialogDescription", { formName: formName })}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>{t("assignUsers.selectAssignmentType")}</Label>
            <Controller
              name="assignType"
              control={form.control}
              render={({ field }) => (
                <>
                  <RadioGroup
                    value={field.value}
                    onValueChange={field.onChange}
                    className="space-y-3"
                  >
                    {assignOptions.map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={option.value} id={option.value} />
                        <Label
                          htmlFor={option.value}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {t(ASSIGN_OPTION_KEYS[option.value] ?? option.value)}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                  {form.formState.errors.assignType && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.assignType.message}
                    </p>
                  )}
                </>
              )}
            />
          </div>

          {assignType === "Individual" && (
            <div className="space-y-2">
              <Label>{t("assignUsers.selectUsers")}</Label>
              {isLoadingUsers ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <ScrollArea className="h-[300px] w-full rounded-md border p-4">
                  <div className="space-y-2">
                    {usersData?.data?.map((user) => (
                      <div
                        key={user.user_id}
                        className="flex items-center space-x-2 p-2 hover:bg-muted rounded-md"
                      >
                        <Checkbox
                          id={`user-${user.user_id}`}
                          checked={selectedUserIds.includes(user.user_id)}
                          onCheckedChange={() => handleUserToggle(user.user_id)}
                        />
                        <Label
                          htmlFor={`user-${user.user_id}`}
                          className="text-sm font-normal cursor-pointer flex-1"
                        >
                          {user.user_name}
                          {user.email && (
                            <span className="text-muted-foreground ml-2">
                              ({user.email})
                            </span>
                          )}
                        </Label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
              {assignType === "Individual" &&
                selectedUserIds.length === 0 &&
                form.formState.errors.user_ids && (
                  <p className="text-sm text-destructive">
                    {t("assignUsers.validationSelectOneUser")}
                  </p>
                )}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              {t("assignUsers.cancel")}
            </Button>
            <Button type="submit" disabled={isLoading || hasErrors}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("assignUsers.submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

