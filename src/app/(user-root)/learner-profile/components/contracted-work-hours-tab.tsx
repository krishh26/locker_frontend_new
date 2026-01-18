"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import {
  useGetContractedWorkByLearnerQuery,
  useCreateContractedWorkMutation,
  useUpdateContractedWorkMutation,
  useDeleteContractedWorkMutation,
} from "@/store/api/contracted-work/contractedWorkApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Pencil, Trash2, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { ContractedWork } from "@/store/api/contracted-work/types";

interface ContractedWorkHoursTabProps {
  learnerId: number;
  canEdit?: boolean;
}

const contractedWorkSchema = z.object({
  company: z.string().min(1, "Company is required"),
  contract_start: z.date({
    message: "Contract start date is required",
  }),
  contract_end: z.date().optional().nullable(),
  contracted_work_hours_per_week: z
    .string()
    .min(1, "Work hours per week is required")
    .refine(
      (val) => !isNaN(Number(val)) && Number(val) > 0,
      "Must be a positive number"
    ),
});

type ContractedWorkFormValues = z.infer<typeof contractedWorkSchema>;

export function ContractedWorkHoursTab({
  learnerId,
  canEdit = false,
}: ContractedWorkHoursTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedWork, setSelectedWork] = useState<ContractedWork | null>(
    null
  );

  const {
    data: contractedWorkResponse,
    isLoading,
    refetch,
  } = useGetContractedWorkByLearnerQuery(learnerId);

  const [createContractedWork, { isLoading: isCreating }] =
    useCreateContractedWorkMutation();
  const [updateContractedWork, { isLoading: isUpdating }] =
    useUpdateContractedWorkMutation();
  const [deleteContractedWork, { isLoading: isDeleting }] =
    useDeleteContractedWorkMutation();

  const contractedWorkList = contractedWorkResponse?.data || [];

  const form = useForm<ContractedWorkFormValues>({
    resolver: zodResolver(contractedWorkSchema),
    defaultValues: {
      company: "",
      contract_start: undefined,
      contract_end: null,
      contracted_work_hours_per_week: "",
    },
  });

  const formatDate = (date: string | null | undefined): string => {
    if (!date) return "-";
    try {
      return format(new Date(date), "MMM d, yyyy");
    } catch {
      return date;
    }
  };

  const formatEditorName = (editor: { first_name: string; last_name: string } | null | undefined): string => {
    if (!editor) return "-";
    return `${editor.first_name} ${editor.last_name}`;
  };

  const handleOpenDialog = (work?: ContractedWork) => {
    // Always clear selectedWork first to prevent stale state
    setSelectedWork(null);
    
    if (work) {
      setSelectedWork(work);
      form.reset({
        company: work.company,
        contract_start: new Date(work.contract_start),
        contract_end: work.contract_end ? new Date(work.contract_end) : null,
        contracted_work_hours_per_week: String(
          work.contracted_work_hours_per_week
        ),
      });
    } else {
      // Explicitly reset form for create mode
      form.reset({
        company: "",
        contract_start: undefined,
        contract_end: null,
        contracted_work_hours_per_week: "",
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    // Clear selectedWork immediately when closing
    setSelectedWork(null);
    // Reset form to default values
    form.reset({
      company: "",
      contract_start: undefined,
      contract_end: null,
      contracted_work_hours_per_week: "",
    });
  };

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      const payload = {
        learner_id: learnerId,
        company: data.company,
        contract_start: data.contract_start.toISOString(),
        contract_end: data.contract_end?.toISOString() || null,
        contracted_work_hours_per_week: Number(
          data.contracted_work_hours_per_week
        ),
      };

      if (selectedWork) {
        await updateContractedWork({
          id: selectedWork.id,
          data: payload,
        }).unwrap();
        toast.success("Contracted work hours updated successfully");
      } else {
        await createContractedWork(payload).unwrap();
        toast.success("Contracted work hours created successfully");
      }

      handleCloseDialog();
      refetch();
    } catch (error) {
      console.error("Failed to save contracted work hours:", error);
      toast.error(
        `Failed to ${
          selectedWork ? "update" : "create"
        } contracted work hours. Please try again.`
      );
    }
  });

  const handleDelete = async () => {
    if (!selectedWork) return;

    try {
      await deleteContractedWork(selectedWork.id).unwrap();
      toast.success("Contracted work hours deleted successfully");
      setDeleteDialogOpen(false);
      setSelectedWork(null);
      refetch();
    } catch (error) {
      console.error("Failed to delete contracted work hours:", error);
      toast.error("Failed to delete contracted work hours. Please try again.");
    }
  };

  const handleDeleteClick = (work: ContractedWork) => {
    setSelectedWork(work);
    setDeleteDialogOpen(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Contracted Work Hours</CardTitle>
          {canEdit && (
            <Button
              type="button"
              onClick={() => handleOpenDialog()}
              size="sm"
            >
              <Plus className="mr-2 h-4 w-4" />
              Set New Hours
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {contractedWorkList.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No contracted work hours found.
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Employment Contract Start Date</TableHead>
                    <TableHead>Employment Contract End Date</TableHead>
                    <TableHead>Contracted Work Hours per Week</TableHead>
                    <TableHead>Yearly Holiday Entitlement (Hours)</TableHead>
                    <TableHead>Last Edited By</TableHead>
                    <TableHead>Last Edited Date</TableHead>
                    {canEdit && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contractedWorkList.map((work) => (
                    <TableRow key={work.id}>
                      <TableCell className="font-medium">
                        {work.company}
                      </TableCell>
                      <TableCell>{formatDate(work.contract_start)}</TableCell>
                      <TableCell>{formatDate(work.contract_end)}</TableCell>
                      <TableCell>{work.contracted_work_hours_per_week}</TableCell>
                      <TableCell>
                        {work.yearly_holiday_entitlement_in_hours ?? "-"}
                      </TableCell>
                      <TableCell>
                        {formatEditorName(work.last_editer)}
                      </TableCell>
                      <TableCell>{formatDate(work.updated_at)}</TableCell>
                      {canEdit && (
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDialog(work)}
                              className="h-8 w-8"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClick(work)}
                              className="h-8 w-8 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {contractedWorkList.length > 0 && (
            <div className="mt-6 p-4 bg-muted/50 rounded-md">
              <p className="text-sm text-muted-foreground">
                Please note: as this learner&apos;s expected off the job hours
                have been set as a fixed value, the contracted work hours and
                yearly holiday entitlement will not impact the off the job
                calculation for this learner.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseDialog();
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedWork ? "Edit" : "Set New"} Contracted Work Hours
            </DialogTitle>
            <DialogDescription>
              {selectedWork
                ? "Update the contracted work hours information."
                : "Enter the contracted work hours information for this learner."}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={onSubmit} className="space-y-4">
              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter company name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contract_start"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Employment Contract Start Date *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contract_end"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Employment Contract End Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date (optional)</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value || undefined}
                          onSelect={(date) => field.onChange(date || null)}
                          disabled={(date) =>
                            date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contracted_work_hours_per_week"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contracted Work Hours per Week *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter hours per week"
                        {...field}
                        min="0"
                        step="0.5"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseDialog}
                  disabled={isCreating || isUpdating}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating || isUpdating}>
                  {(isCreating || isUpdating) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {selectedWork ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              contracted work hours entry for {selectedWork?.company}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setDeleteDialogOpen(false);
                setSelectedWork(null);
              }}
              disabled={isDeleting}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

