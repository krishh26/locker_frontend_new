import { useState, useEffect, useCallback } from "react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { toast } from "sonner";
import {
  useLazyGetPlanDetailsQuery,
  useUpdateSamplePlanDetailMutation,
  useRemoveSampledLearnerMutation,
  useLazyGetSampleQuestionsQuery,
  useCreateSampleQuestionsMutation,
  useUpdateSampleQuestionMutation,
} from "@/store/api/qa-sample-plan/qaSamplePlanApi";
import { closeEditSampleModal } from "@/store/slices/qaSamplePlanSlice";
import type { ModalFormData } from "../edit-sample-modal";
import type { SampleQuestion } from "@/store/api/qa-sample-plan/types";
import {
  transformPlanDetailsToModalData,
  getEmptyModalFormData,
  extractPlannedDates,
  transformModalDataToUpdateRequest,
} from "../utils/modal-data-transformer";

export function useEditSampleModal(
  planId: string | number | null,
  planDetailId: string | number | null,
  isOpen: boolean,
  onDeleteSuccess?: () => void
) {
  const dispatch = useAppDispatch();

  // Form data state
  const [modalFormData, setModalFormData] = useState<ModalFormData>(getEmptyModalFormData());
  const [activeTab, setActiveTab] = useState(0);
  const [sampleQuestions, setSampleQuestions] = useState<SampleQuestion[]>([]);
  const [plannedDates, setPlannedDates] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // API hooks
  const [triggerGetPlanDetails, { isLoading: isLoadingPlanDetails }] = useLazyGetPlanDetailsQuery();
  const [updateSamplePlanDetail, { isLoading: isUpdatingDetail }] = useUpdateSamplePlanDetailMutation();
  const [removeSampledLearner] = useRemoveSampledLearnerMutation();
  const [triggerGetQuestions, { isLoading: isLoadingQuestions }] = useLazyGetSampleQuestionsQuery();
  const [createSampleQuestions] = useCreateSampleQuestionsMutation();
  const [updateSampleQuestion] = useUpdateSampleQuestionMutation();

  // Fetch plan details when modal opens with a plan_id
  useEffect(() => {
    if (!isOpen || !planId) return;

    const fetchPlanDetails = async () => {
      try {
        const response = await triggerGetPlanDetails(planId).unwrap();
        const data = (response as { data?: unknown })?.data as Record<string, unknown> | undefined;

        if (data) {
          // If the response has sampled_learners array, find the one matching detail_id
          const sampledLearners = data.sampled_learners;
          console.log("🚀 ~ fetchPlanDetails ~ sampledLearners:", sampledLearners)
          if (Array.isArray(sampledLearners)) {
            const matchingDetail = sampledLearners.find(
              (detail: Record<string, unknown>) =>
                String(detail.detail_id) === String(planDetailId) ||
                String(detail.id) === String(planDetailId)
            ) as Record<string, unknown> | undefined;

            if (matchingDetail) {
              // Transform the matching detail to modal data
              const detailData: Record<string, unknown> = {
                ...data,
                ...matchingDetail,
                // Override with detail-specific data
                planned_date: (matchingDetail.planned_date as string | undefined) || (matchingDetail.plannedDate as string | undefined),
                completed_date: (matchingDetail.completed_date as string | undefined) || (matchingDetail.completedDate as string | undefined),
                assessment_methods: matchingDetail.assessment_methods,
                iqa_conclusion: matchingDetail.iqa_conclusion,
                assessor_decision_correct: matchingDetail.assessor_decision_correct,
                feedback: (matchingDetail.feedback as string | undefined) || "",
                sample_type: matchingDetail.sample_type || "",
                type: (matchingDetail.type as string | undefined) || "",
              };
              // Ensure sample_type is set from matchingDetail
              if (matchingDetail.sample_type) {
                detailData.sample_type = matchingDetail.sample_type;
                detailData.sampleType = matchingDetail.sample_type; // Also set camelCase for transformer
              }
              const transformedData = transformPlanDetailsToModalData(detailData as Parameters<typeof transformPlanDetailsToModalData>[0]);
              setModalFormData(transformedData);

              // Extract planned dates from all sampled learners for tabs
              const dates = extractPlannedDates(sampledLearners as Array<{ planned_date?: string; plannedDate?: string }>);
              setPlannedDates(dates);

              // Set active tab to the one matching the current planned date
              const currentPlannedDate =
                (matchingDetail.planned_date as string | undefined) || (matchingDetail.plannedDate as string | undefined);
              if (currentPlannedDate) {
                const tabIndex = dates.findIndex((date) => date === currentPlannedDate);
                if (tabIndex >= 0) {
                  setActiveTab(tabIndex);
                }
              }
            } else {
              // If no matching detail found, use the main data
              const transformedData = transformPlanDetailsToModalData(data as Parameters<typeof transformPlanDetailsToModalData>[0]);
              setModalFormData(transformedData);
              const dates = extractPlannedDates(sampledLearners as Array<{ planned_date?: string; plannedDate?: string }>);
              setPlannedDates(dates);
            }
          } else {
            // If no sampled_learners array, use the main data
            const transformedData = transformPlanDetailsToModalData(data as Parameters<typeof transformPlanDetailsToModalData>[0]);
            console.log("🚀 ~ fetchPlanDetails ~ transformedData:", transformedData)
            setModalFormData(transformedData);
          }
        }
      } catch (error: unknown) {
        console.error("Error fetching plan details:", error);
        const errorMessage = (error as { data?: { message?: string }; message?: string })?.data?.message || 
                            (error as { message?: string })?.message || 
                            "Failed to load plan details";
        toast.error(errorMessage);
      }
    };

    fetchPlanDetails();
  }, [isOpen, planId, planDetailId, triggerGetPlanDetails]);

  // Fetch sample questions when modal opens
  useEffect(() => {
    if (!isOpen || !planId || !planDetailId) return;

    const fetchQuestions = async () => {
      try {
        const response = await triggerGetQuestions(Number(planId)).unwrap();
        const questions = ((response as { data?: unknown })?.data || []) as SampleQuestion[];
        setSampleQuestions(questions);
      } catch {
        // Questions might not exist yet, that's okay
        setSampleQuestions([]);
      }
    };

    fetchQuestions();
  }, [isOpen, planId, planDetailId, triggerGetQuestions]);

  // Form data handlers
  const handleFormDataChange = useCallback((field: string, value: unknown) => {
    setModalFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handleAssessmentMethodToggle = useCallback((code: string) => {
    setModalFormData((prev) => {
      const methods = prev.assessmentMethods.includes(code)
        ? prev.assessmentMethods.filter((m) => m !== code)
        : [...prev.assessmentMethods, code];
      return {
        ...prev,
        assessmentMethods: methods,
      };
    });
  }, []);

  const handleIqaConclusionToggle = useCallback((option: string) => {
    setModalFormData((prev) => {
      const conclusion = prev.iqaConclusion.includes(option)
        ? prev.iqaConclusion.filter((c) => c !== option)
        : [...prev.iqaConclusion, option];
      return {
        ...prev,
        iqaConclusion: conclusion,
      };
    });
  }, []);

  // Question handlers
  const handleQuestionChange = useCallback((id: string, question: string) => {
    setSampleQuestions((prev) =>
      prev.map((q) => (String(q.id) === id ? { ...q, question_text: question } : q)) as SampleQuestion[]
    );
  }, []);

  const handleAnswerChange = useCallback((id: string, answer: "Yes" | "No") => {
    setSampleQuestions((prev) =>
      prev.map((q) => (String(q.id) === id ? { ...q, answer } : q))
    );
  }, []);

  const handleAddQuestion = useCallback(() => {
    const newQuestion: SampleQuestion = {
      id: Date.now(),
      question_text: "",
      answer: "Yes",
    };
    setSampleQuestions((prev) => [...prev, newQuestion]);
  }, []);

  const handleDeleteQuestion = useCallback((id: string) => {
    setSampleQuestions((prev) => prev.filter((q) => String(q.id) !== id));
  }, []);

  const user = useAppSelector((state) => state.auth.user);
  const iqaId = user?.user_id;

  const handleSaveQuestions = useCallback(async () => {
    if (!planDetailId || !iqaId) {
      toast.error("Unable to determine current user");
      return;
    }

    try {
      // Separate existing questions from new ones (temporary questions have very large IDs)
      const tempIdThreshold = 1000000000000; // Timestamp threshold
      const existingQuestions = sampleQuestions.filter((q) => typeof q.id === "number" && q.id < tempIdThreshold);
      const newQuestions = sampleQuestions.filter((q) => typeof q.id === "number" && q.id >= tempIdThreshold);

      // Update existing questions
      for (const question of existingQuestions) {
        if (question.question_text.trim() && typeof question.id === "number") {
          await updateSampleQuestion({
            id: question.id,
            question_text: question.question_text,
            answer: question.answer,
          }).unwrap();
        }
      }

      // Create new questions
      if (newQuestions.length > 0) {
        const questionsToCreate = newQuestions
          .filter((q) => q.question_text.trim())
          .map((q) => ({
            question_text: q.question_text,
            answer: q.answer,
          }));

        if (questionsToCreate.length > 0) {
          await createSampleQuestions({
            plan_detail_id: planDetailId,
            answered_by_id: iqaId as string | number,
            questions: questionsToCreate,
          }).unwrap();
        }
      }

      toast.success("Questions saved successfully");
    } catch (error: unknown) {
      const errorMessage = (error as { data?: { message?: string }; message?: string })?.data?.message || 
                          (error as { message?: string })?.message || 
                          "Failed to save questions";
      toast.error(errorMessage);
    }
  }, [planDetailId, sampleQuestions, iqaId, createSampleQuestions, updateSampleQuestion]);

  // Save handler
  const handleSave = useCallback(async () => {
    if (!planDetailId) {
      toast.error("Missing required information");
      return;
    }

    setIsSaving(true);
    try {
      const updateRequest = transformModalDataToUpdateRequest(modalFormData, planDetailId);
      await updateSamplePlanDetail(updateRequest).unwrap();
      toast.success("Sample plan detail updated successfully");
    } catch (error: unknown) {
      const errorMessage = (error as { data?: { message?: string }; message?: string })?.data?.message || 
                          (error as { message?: string })?.message || 
                          "Failed to update sample plan detail";
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  }, [planDetailId, modalFormData, updateSamplePlanDetail]);

  // Delete handler
  const handleDelete = useCallback(async () => {
    if (!planDetailId) return;

    try {
      await removeSampledLearner(planDetailId).unwrap();
      toast.success("Sampled learner removed successfully");
      dispatch(closeEditSampleModal());
      if (onDeleteSuccess) {
        onDeleteSuccess();
      }
    } catch (error: unknown) {
      const errorMessage = (error as { data?: { message?: string }; message?: string })?.data?.message || 
                          (error as { message?: string })?.message || 
                          "Failed to remove sampled learner";
      toast.error(errorMessage);
    }
  }, [planDetailId, removeSampledLearner, dispatch, onDeleteSuccess]);

  // Close handler
  const handleClose = useCallback(() => {
    dispatch(closeEditSampleModal());
  }, [dispatch]);

  // Tab change handler
  const handleTabChange = useCallback((value: number) => {
    setActiveTab(value);
  }, []);

  // Create new handler (placeholder for now)
  const handleCreateNew = useCallback(() => {
    setIsCreating(true);
    // TODO: Implement create new functionality
    toast.info("Create new functionality will be implemented");
    setIsCreating(false);
  }, []);

  const isLoading = isLoadingPlanDetails || isLoadingQuestions;

  return {
    modalFormData,
    activeTab,
    sampleQuestions,
    plannedDates,
    isSaving: isSaving || isUpdatingDetail,
    isCreating,
    isLoading,
    handleFormDataChange,
    handleAssessmentMethodToggle,
    handleIqaConclusionToggle,
    handleQuestionChange,
    handleAnswerChange,
    handleAddQuestion,
    handleDeleteQuestion,
    handleSaveQuestions,
    handleSave,
    handleDelete,
    handleClose,
    handleTabChange,
    handleCreateNew,
  };
}

