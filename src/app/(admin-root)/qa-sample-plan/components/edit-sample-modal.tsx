"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useCallback } from "react";
import { Plus, RefreshCw, Trash2, Edit, Loader2 } from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import { toast } from "sonner";
import { ActionModal, type ActionFormData } from "./action-modal";
import {
  useLazyGetSampleActionsQuery,
  useCreateSampleActionMutation,
  useUpdateSampleActionMutation,
  useDeleteSampleActionMutation,
  useLazyGetSampleFormsQuery,
  useCreateSampleFormMutation,
  useDeleteSampleFormMutation,
  useCompleteSampleFormMutation,
  useLazyGetSampleDocumentsQuery,
  useUploadSampleDocumentMutation,
  useDeleteSampleDocumentMutation,
} from "@/store/api/qa-sample-plan/qaSamplePlanApi";
import type { SampleAction, SampleDocument, SampleAllocatedForm, SampleQuestion } from "@/store/api/qa-sample-plan/types";
import { assessmentMethods, formatDate, formatDateForInput, iqaConclusionOptions, sampleTypes } from "./constants";
import { formatDisplayDate } from "./utils";
import {
  Dialog,
  DialogContent,
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export interface ModalFormData {
  qaName: string;
  plannedDate: string;
  assessmentMethods: string[];
  assessmentProcesses: string;
  feedback: string;
  type: string;
  completedDate: string;
  sampleType: string;
  iqaConclusion: string[];
  assessorDecisionCorrect: string;
}

interface EditSampleModalProps {
  open: boolean;
  onClose: () => void;
  activeTab: number;
  onTabChange: (value: number) => void;
  modalFormData: ModalFormData;
  onFormDataChange: (field: string, value: any) => void;
  onAssessmentMethodToggle: (code: string) => void;
  onIqaConclusionToggle: (option: string) => void;
  sampleQuestions: SampleQuestion[];
  onQuestionChange: (id: string, question: string) => void;
  onAnswerChange: (id: string, answer: "Yes" | "No") => void;
  onAddQuestion: () => void;
  onDeleteQuestion: (id: string) => void;
  onSaveQuestions: () => void;
  plannedDates?: string[];
  onSave?: () => void;
  isSaving?: boolean;
  planDetailId?: string | number | null;
  unitCode?: string | null;
  unitName?: string | null;
  unitType?: string | null;
  onCreateNew?: () => void;
  isCreating?: boolean;
  onDeleteSuccess?: () => void;
}

export function EditSampleModal({
  open,
  onClose,
  activeTab,
  onTabChange,
  modalFormData,
  onFormDataChange,
  onAssessmentMethodToggle,
  onIqaConclusionToggle,
  sampleQuestions: _sampleQuestions,
  onQuestionChange: _onQuestionChange,
  onAnswerChange: _onAnswerChange,
  onAddQuestion: _onAddQuestion,
  onDeleteQuestion: _onDeleteQuestion,
  onSaveQuestions: _onSaveQuestions,
  plannedDates = [],
  onSave,
  isSaving = false,
  planDetailId = null,
  unitCode: _unitCode = null,
  unitName: _unitName = null,
  unitType: _unitType = null,
  onCreateNew,
  isCreating = false,
  onDeleteSuccess,
}: EditSampleModalProps) {
  const user = useAppSelector((state) => state.auth.user);
  const iqaId = user?.user_id;

  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [editingAction, setEditingAction] = useState<SampleAction | null>(null);
  const [actions, setActions] = useState<SampleAction[]>([]);
  const [deleteActionId, setDeleteActionId] = useState<number | null>(null);
  const [allocatedForms, setAllocatedForms] = useState<SampleAllocatedForm[]>([]);
  const [selectedFormId, setSelectedFormId] = useState<string>("");
  const [formDescription, setFormDescription] = useState<string>("");
  const [deleteFormId, setDeleteFormId] = useState<number | null>(null);
  const [documents, setDocuments] = useState<SampleDocument[]>([]);
  const [deleteDocumentId, setDeleteDocumentId] = useState<number | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [triggerGetActions, { isLoading: isLoadingActions }] = useLazyGetSampleActionsQuery();
  const [createAction, { isLoading: isCreatingAction }] = useCreateSampleActionMutation();
  const [updateAction, { isLoading: isUpdatingAction }] = useUpdateSampleActionMutation();
  const [deleteAction, { isLoading: isDeletingAction }] = useDeleteSampleActionMutation();
  const [triggerGetForms] = useLazyGetSampleFormsQuery();
  const [createSampleForm] = useCreateSampleFormMutation();
  const [deleteSampleForm, { isLoading: isUnlinkingForm }] = useDeleteSampleFormMutation();
  const [completeSampleForm] = useCompleteSampleFormMutation();
  const [triggerGetDocuments] = useLazyGetSampleDocumentsQuery();
  const [uploadDocument] = useUploadSampleDocumentMutation();
  const [deleteDocument, { isLoading: isDeletingDocument }] = useDeleteSampleDocumentMutation();

  const fetchActions = useCallback(async () => {
    if (!planDetailId) return;
    try {
      const response = await triggerGetActions(planDetailId).unwrap();
      setActions((response as any)?.data || []);
    } catch (error) {
      console.error("Error fetching actions:", error);
      setActions([]);
    }
  }, [planDetailId, triggerGetActions]);

  const fetchAllocatedForms = useCallback(async () => {
    if (!planDetailId) return;
    try {
      const res = await triggerGetForms(planDetailId).unwrap();
      setAllocatedForms((res as any)?.data || []);
    } catch {
      setAllocatedForms([]);
    }
  }, [planDetailId, triggerGetForms]);

  const fetchDocuments = useCallback(async () => {
    if (!planDetailId) return;
    try {
      const res = await triggerGetDocuments(planDetailId).unwrap();
      setDocuments((res as any)?.data || []);
    } catch {
      setDocuments([]);
    }
  }, [planDetailId, triggerGetDocuments]);

  useEffect(() => {
    if (open && planDetailId) {
      fetchActions();
      fetchAllocatedForms();
      fetchDocuments();
    }
  }, [open, planDetailId, fetchActions, fetchAllocatedForms, fetchDocuments]);

  const handleOpenActionModal = () => {
    setEditingAction(null);
    setActionModalOpen(true);
  };

  const handleCloseActionModal = () => {
    setActionModalOpen(false);
    setEditingAction(null);
  };

  const handleEditAction = (action: SampleAction) => {
    setEditingAction(action);
    setActionModalOpen(true);
  };

  const handleSaveAction = async (formData: ActionFormData) => {
    if (!planDetailId || !iqaId) {
      toast.error("Missing required information");
      return;
    }

    try {
      if (editingAction) {
        await updateAction({
          actionId: editingAction.id,
          action_required: formData.action_required,
          target_date: formData.target_date,
          status: formData.status,
          assessor_feedback: formData.assessor_feedback || undefined,
          action_with_id: formData.action_with_id,
        }).unwrap();
        toast.success("Action updated successfully");
      } else {
        await createAction({
          plan_detail_id: planDetailId,
          action_with_id: formData.action_with_id,
          action_required: formData.action_required,
          target_date: formData.target_date,
          status: formData.status,
          created_by_id: iqaId as string | number,
          assessor_feedback: formData.assessor_feedback || undefined,
        }).unwrap();
        toast.success("Action created successfully");
      }

      handleCloseActionModal();
      fetchActions();
    } catch (error: any) {
      const message = error?.data?.message || error?.error || "Failed to save action";
      toast.error(message);
    }
  };

  const handleDeleteAction = async (actionId: number) => {
    try {
      await deleteAction(actionId).unwrap();
      toast.success("Action deleted successfully");
      fetchActions();
      setDeleteActionId(null);
    } catch (error: any) {
      const message = error?.data?.message || error?.error || "Failed to delete action";
      toast.error(message);
      setDeleteActionId(null);
    }
  };

  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return "";
    return formatDisplayDate(dateString);
  };

  const getActionSummary = (action: SampleAction) => {
    return action.action_required && action.action_required.length > 50
      ? `${action.action_required.substring(0, 50)}...`
      : action.action_required || "";
  };

  const handleAllocateForm = async () => {
    if (!planDetailId || !iqaId || !selectedFormId) {
      toast.error("Select a form to allocate.");
      return;
    }
    try {
      await createSampleForm({
        plan_detail_id: planDetailId,
        form_id: selectedFormId,
        allocated_by_id: iqaId as string | number,
        description: formDescription || undefined,
      }).unwrap();
      toast.success("Form allocated successfully");
      setFormDescription("");
      setSelectedFormId("");
      fetchAllocatedForms();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to allocate form");
    }
  };

  const handleDeleteAllocatedForm = async (id: number) => {
    try {
      await deleteSampleForm(id).unwrap();
      toast.success("Form unlinked successfully");
      fetchAllocatedForms();
      setDeleteFormId(null);
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to unlink form");
      setDeleteFormId(null);
    }
  };

  const handleCompleteForm = async (id: number) => {
    try {
      await completeSampleForm(id).unwrap();
      toast.success("Form marked as completed");
      fetchAllocatedForms();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to mark as completed");
    }
  };

  const handleUploadDocument = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !planDetailId) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("plan_detail_id", String(planDetailId));

    try {
      await uploadDocument(formData).unwrap();
      toast.success("Document uploaded successfully");
      fetchDocuments();
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to upload document");
    }
  };

  const handleDeleteDocument = async (docId: number) => {
    try {
      await deleteDocument(docId).unwrap();
      toast.success("Document deleted successfully");
      fetchDocuments();
      setDeleteDocumentId(null);
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to delete document");
      setDeleteDocumentId(null);
    }
  };

  const handleDeleteLearner = async () => {
    if (!planDetailId) return;
    toast.info("Delete learner functionality will be implemented");
    setShowDeleteConfirmation(false);
    if (onDeleteSuccess) {
      onDeleteSuccess();
    }
  };

  // Convert activeTab to string for shadcn Tabs (which uses string values)
  const activeTabString = String(activeTab);
  const handleTabChange = useCallback((value: string) => {
    onTabChange(Number(value));
  }, [onTabChange]);

  // Memoize handlers to prevent infinite loops
  const handleTypeChange = useCallback((value: string) => {
    const currentValue = modalFormData.type || undefined;
    if (value !== currentValue) {
      onFormDataChange("type", value);
    }
  }, [modalFormData.type, onFormDataChange]);

  const handleSampleTypeChange = useCallback((value: string) => {
    const currentValue = modalFormData.sampleType || undefined;
    if (value !== currentValue) {
      onFormDataChange("sampleType", value);
    }
  }, [modalFormData.sampleType, onFormDataChange]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>Edit Sample</DialogTitle>
        </DialogHeader>

        {/* Tabs and Create New Button */}
        <div className="flex items-center justify-between px-6 pt-4 border-b">
          {plannedDates.length > 0 ? (
            <Tabs value={activeTabString} onValueChange={handleTabChange} className="w-full">
              <TabsList>
                {plannedDates.map((date, index) => (
                  <TabsTrigger key={`planned-date-${index}-${date || "no-date"}`} value={String(index)}>
                    FS {index + 1} - ({date ? formatDate(date) : "No Date"})
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          ) : (
            <div className="text-sm text-muted-foreground">No Planned Dates</div>
          )}
          {onCreateNew && (
            <Button
              onClick={onCreateNew}
              disabled={isCreating}
              className="ml-4 bg-[#e91e63] hover:bg-[#c2185b]"
            >
              <Plus className="mr-2 h-4 w-4" />
              {isCreating ? "Creating..." : "Create New"}
            </Button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end flex-wrap gap-2 px-6 py-4 border-b">
          <Button variant="outline" onClick={onClose} className="border-orange-500 text-orange-500 hover:bg-orange-50">
            Cancel / Close
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowDeleteConfirmation(true)}
            disabled={!planDetailId}
            className="border-red-500 text-red-500 hover:bg-red-50"
          >
            Delete
          </Button>
          {onSave && (
            <>
              <Button onClick={onSave} disabled={isSaving} className="bg-green-600 hover:bg-green-700">
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save"
                )}
              </Button>
              <Button
                onClick={() => {
                  onSave();
                  onClose();
                }}
                disabled={isSaving}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save & Close"
                )}
              </Button>
            </>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Details Section */}
            <div className="md:col-span-4 space-y-4">
              <div className="space-y-2">
                <Label>QA Name</Label>
                <Input value={modalFormData.qaName || ""} disabled />
              </div>
            </div>
            <div className="md:col-span-4 space-y-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select 
                  value={modalFormData.type || undefined} 
                  onValueChange={handleTypeChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Formative">Formative</SelectItem>
                    <SelectItem value="Summative">Summative</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="md:col-span-4 space-y-4">
              <div className="space-y-2">
                <Label>Sample Type</Label>
                <Select 
                  value={modalFormData.sampleType || undefined} 
                  onValueChange={handleSampleTypeChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select sample type" />
                  </SelectTrigger>
                  <SelectContent>
                    {sampleTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="md:col-span-6 space-y-2">
              <Label>Planned Date</Label>
              <Input
                type="date"
                value={formatDateForInput(modalFormData.plannedDate)}
                onChange={(e) => onFormDataChange("plannedDate", e.target.value)}
              />
            </div>
            <div className="md:col-span-6 space-y-2">
              <Label>Completed Date</Label>
              <Input
                type="date"
                value={formatDateForInput(modalFormData.completedDate)}
                onChange={(e) => onFormDataChange("completedDate", e.target.value)}
              />
            </div>

            <div className="md:col-span-4 space-y-2">
              <Label className="text-sm font-semibold">Assessment Methods</Label>
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-3 gap-2">
                    {assessmentMethods.map((method) => (
                      <div key={method.code} className="flex items-center space-x-2">
                        <Checkbox
                          id={`method-${method.code}`}
                          checked={modalFormData.assessmentMethods.includes(method.code)}
                          onCheckedChange={() => onAssessmentMethodToggle(method.code)}
                        />
                        <Label htmlFor={`method-${method.code}`} className="text-sm cursor-pointer">
                          {method.code}
                        </Label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="md:col-span-4 space-y-2">
              <Label className="text-sm font-semibold">IQA Conclusion</Label>
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-wrap gap-2">
                    {iqaConclusionOptions.map((option) => (
                      <div key={option} className="flex items-center space-x-2">
                        <Checkbox
                          id={`iqa-${option}`}
                          checked={modalFormData.iqaConclusion.includes(option)}
                          onCheckedChange={() => onIqaConclusionToggle(option)}
                        />
                        <Label htmlFor={`iqa-${option}`} className="text-sm cursor-pointer">
                          {option}
                        </Label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="md:col-span-4 space-y-2">
              <Label className="text-sm font-semibold">Assessor Decision Correct</Label>
              <RadioGroup
                value={modalFormData.assessorDecisionCorrect}
                onValueChange={(value) => onFormDataChange("assessorDecisionCorrect", value)}
                className="flex flex-row gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Yes" id="decision-yes" />
                  <Label htmlFor="decision-yes" className="cursor-pointer">
                    Yes
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="No" id="decision-no" />
                  <Label htmlFor="decision-no" className="cursor-pointer">
                    No
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="col-span-12 space-y-2">
              <Label>Assessment Processes</Label>
              <Textarea
                rows={4}
                value={modalFormData.assessmentProcesses}
                onChange={(e) => onFormDataChange("assessmentProcesses", e.target.value)}
              />
            </div>

            <div className="col-span-12 space-y-2">
              <Label>Feedback</Label>
              <Textarea
                rows={6}
                value={modalFormData.feedback}
                onChange={(e) => onFormDataChange("feedback", e.target.value)}
                placeholder="Please type in feedback. Max 4400 characters."
                maxLength={4400}
              />
            </div>
          </div>

          {/* Actions Table */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Actions for Sample</h3>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={fetchActions} disabled={isLoadingActions}>
                  <RefreshCw className={`h-4 w-4 ${isLoadingActions ? "animate-spin" : ""}`} />
                </Button>
                <Button
                  onClick={handleOpenActionModal}
                  disabled={!planDetailId}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Action
                </Button>
              </div>
            </div>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Summary</TableHead>
                      <TableHead>Action Required</TableHead>
                      <TableHead>Action With</TableHead>
                      <TableHead>Target Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingActions ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm text-muted-foreground">Loading actions...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : actions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          There are no Actions on this Sample
                        </TableCell>
                      </TableRow>
                    ) : (
                      actions.map((action) => (
                        <TableRow key={action.id}>
                          <TableCell>{getActionSummary(action)}</TableCell>
                          <TableCell>{action.action_required}</TableCell>
                          <TableCell>
                            {`${(action.action_with as any)?.first_name || ""} ${(action.action_with as any)?.last_name || ""}`.trim() || "N/A"}
                          </TableCell>
                          <TableCell>{formatDateForDisplay(action.target_date)}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditAction(action)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteActionId(action.id)}
                                disabled={isDeletingAction && deleteActionId === action.id}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>

      {/* Action Modal */}
      <ActionModal
        open={actionModalOpen}
        onClose={handleCloseActionModal}
        onSave={handleSaveAction}
        editingAction={editingAction}
        isSaving={isCreatingAction || isUpdatingAction}
      />

      {/* Delete Action Confirmation Dialog */}
      <AlertDialog open={deleteActionId !== null} onOpenChange={(open) => !open && setDeleteActionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Action?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this action? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteActionId && handleDeleteAction(deleteActionId)}
              disabled={isDeletingAction}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeletingAction ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Document Confirmation Dialog */}
      <AlertDialog open={deleteDocumentId !== null} onOpenChange={(open) => !open && setDeleteDocumentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this document? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteDocumentId && handleDeleteDocument(deleteDocumentId)}
              disabled={isDeletingDocument}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeletingDocument ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Allocated Form Confirmation Dialog */}
      <AlertDialog open={deleteFormId !== null} onOpenChange={(open) => !open && setDeleteFormId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Allocated Form?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unlink this form from the sample?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteFormId && handleDeleteAllocatedForm(deleteFormId)}
              disabled={isUnlinkingForm}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isUnlinkingForm ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removing...
                </>
              ) : (
                "Remove"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Sampled Learner Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Sampled Learner?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this sampled learner? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteLearner} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
