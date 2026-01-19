"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
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
  useCreateBroadcastMutation,
  useUpdateBroadcastMutation,
} from "@/store/api/broadcast/broadcastApi";
import type {
  Broadcast,
  CreateBroadcastRequest,
  UpdateBroadcastRequest,
} from "@/store/api/broadcast/types";
import { toast } from "sonner";

const createBroadcastSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
});

const updateBroadcastSchema = createBroadcastSchema.partial();

type CreateBroadcastFormValues = z.infer<typeof createBroadcastSchema>;
type UpdateBroadcastFormValues = z.infer<typeof updateBroadcastSchema>;

interface BroadcastFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  broadcast: Broadcast | null;
  onSuccess: () => void;
}

export function BroadcastFormDialog({
  open,
  onOpenChange,
  broadcast,
  onSuccess,
}: BroadcastFormDialogProps) {
  const isEditMode = !!broadcast;

  const [createBroadcast, { isLoading: isCreating }] = useCreateBroadcastMutation();
  const [updateBroadcast, { isLoading: isUpdating }] = useUpdateBroadcastMutation();

  const form = useForm<CreateBroadcastFormValues | UpdateBroadcastFormValues>({
    resolver: zodResolver(isEditMode ? updateBroadcastSchema : createBroadcastSchema),
    mode: "onChange",
    defaultValues: {
      title: "",
      description: "",
    },
  });

  useEffect(() => {
    if (broadcast && open) {
      form.reset({
        title: broadcast.title || "",
        description: broadcast.description || "",
      });
    } else if (!broadcast && open) {
      form.reset({
        title: "",
        description: "",
      });
    }
  }, [broadcast, open, form]);

  const onSubmit = async (values: CreateBroadcastFormValues | UpdateBroadcastFormValues) => {
    try {
      if (isEditMode) {
        await updateBroadcast({
          id: broadcast.id,
          data: values as UpdateBroadcastRequest,
        }).unwrap();
        toast.success("Broadcast updated successfully");
      } else {
        await createBroadcast(values as CreateBroadcastRequest).unwrap();
        toast.success("Broadcast created successfully");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "data" in error
          ? (error as { data?: { message?: string } }).data?.message
          : undefined;
      toast.error(errorMessage || `Failed to ${isEditMode ? "update" : "create"} broadcast`);
    }
  };

  const isLoading = isCreating || isUpdating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Broadcast" : "Create Broadcast"}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update broadcast information below."
              : "Fill in the broadcast information below."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              {...form.register("title")}
              placeholder="Add your title"
            />
            {form.formState.errors.title && (
              <p className="text-sm text-destructive">
                {form.formState.errors.title.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              {...form.register("description")}
              placeholder="Add your description"
              rows={6}
            />
            {form.formState.errors.description && (
              <p className="text-sm text-destructive">
                {form.formState.errors.description.message}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditMode ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

