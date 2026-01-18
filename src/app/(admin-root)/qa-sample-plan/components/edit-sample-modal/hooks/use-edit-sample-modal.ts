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
  useApplySamplePlanLearnersMutation,
} from "@/store/api/qa-sample-plan/qaSamplePlanApi";
import { closeEditSampleModal, selectEditSampleModal } from "@/store/slices/qaSamplePlanSlice";
import { assessmentMethodCodesForPayload } from "../../constants";
import type { ModalFormData } from "../types";
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
  const [sampledLearners, setSampledLearners] = useState<Record<string, unknown>[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // API hooks
  const [triggerGetPlanDetails, { isLoading: isLoadingPlanDetails }] = useLazyGetPlanDetailsQuery();
  const [updateSamplePlanDetail, { isLoading: isUpdatingDetail }] = useUpdateSamplePlanDetailMutation();
  const [removeSampledLearner] = useRemoveSampledLearnerMutation();
  const [triggerGetQuestions, { isLoading: isLoadingQuestions }] = useLazyGetSampleQuestionsQuery();
  const [createSampleQuestions] = useCreateSampleQuestionsMutation();
  const [updateSampleQuestion] = useUpdateSampleQuestionMutation();
  const [applySamplePlanLearners] = useApplySamplePlanLearnersMutation();

  // Fetch plan details when modal opens with a plan_id
  useEffect(() => {
    if (!isOpen || !planId) return;

    const fetchPlanDetails = async () => {
      try {
        const response = await triggerGetPlanDetails(planId).unwrap();
        const data = (response as { data?: unknown })?.data as Record<string, unknown> | undefined;

        if (data) {
          // If the response has sampled_learners array, find the one matching detail_id
          const sampledLearnersArray = data.sampled_learners;
          if (Array.isArray(sampledLearnersArray)) {
            // Store sampled learners in state for tab navigation
            setSampledLearners(sampledLearnersArray as Record<string, unknown>[]);
            const sampledLearners = sampledLearnersArray;
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
            setSampledLearners([]);
            const transformedData = transformPlanDetailsToModalData(data as Parameters<typeof transformPlanDetailsToModalData>[0]);
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
  const modalState = useAppSelector(selectEditSampleModal);

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
  const handleTabChange = useCallback(async (newTabIndex: number) => {
    setActiveTab(newTabIndex);

    // If we have sampled learners and the tab index is valid, populate form data and load questions
    if (sampledLearners.length > 0 && plannedDates[newTabIndex] && planId) {
      // Find the sampled learner entry that matches the planned date at this tab index
      const targetPlannedDate = plannedDates[newTabIndex];
      const selectedEntry = sampledLearners.find((entry: Record<string, unknown>) => {
        const entryDate = (entry.planned_date as string | undefined) || (entry.plannedDate as string | undefined);
        return entryDate === targetPlannedDate;
      }) as Record<string, unknown> | undefined;

      if (!selectedEntry) return;
      
      // Get the base data (we'll need it from the last fetch, but for now use what we have)
      // Transform the selected entry to modal data (similar to useEffect logic)
      const detailData: Record<string, unknown> = {
        ...selectedEntry,
        // Override with detail-specific data
        planned_date: (selectedEntry.planned_date as string | undefined) || (selectedEntry.plannedDate as string | undefined),
        completed_date: (selectedEntry.completed_date as string | undefined) || (selectedEntry.completedDate as string | undefined),
        assessment_methods: selectedEntry.assessment_methods,
        iqa_conclusion: selectedEntry.iqa_conclusion,
        assessor_decision_correct: selectedEntry.assessor_decision_correct,
        feedback: (selectedEntry.feedback as string | undefined) || "",
        sample_type: selectedEntry.sample_type || "",
        type: (selectedEntry.type as string | undefined) || "",
      };
      // Ensure sample_type is set from selectedEntry
      if (selectedEntry.sample_type) {
        detailData.sample_type = selectedEntry.sample_type;
        detailData.sampleType = selectedEntry.sample_type;
      }
      const transformedData = transformPlanDetailsToModalData(detailData as Parameters<typeof transformPlanDetailsToModalData>[0]);
      setModalFormData(transformedData);

      // Load questions - always use planId for API call (matching old implementation)
      try {
        const response = await triggerGetQuestions(Number(planId)).unwrap();
        const list = Array.isArray((response as { data?: unknown })?.data) 
          ? ((response as { data?: unknown }).data as Array<Record<string, unknown>>)
          : [];
        const mapped: SampleQuestion[] = list.map((q: Record<string, unknown>) => ({
          id: typeof q.id === "number" ? q.id : Number(q.id) || Date.now(),
          question_text: (q.question_text as string) ?? "",
          answer: ((q.answer as "Yes" | "No" | "") ?? "Yes") as "Yes" | "No",
        }));
        setSampleQuestions(mapped);
      } catch {
        // Questions might not exist yet, that's okay
        setSampleQuestions([]);
      }
    }
  }, [sampledLearners, plannedDates, planId, triggerGetQuestions]);

  // Create new handler
  const handleCreateNew = useCallback(async () => {
    if (!planId) {
      toast.error("Please select a plan before creating a new entry.");
      return;
    }

    if (!iqaId) {
      toast.error("Unable to determine current user. Please re-login and try again.");
      return;
    }

    // Get current unit code/name from Redux state
    const currentUnitCode = modalState?.currentUnitCode ?? null;
    const currentUnitName = modalState?.currentUnitName ?? null;

    if (!currentUnitCode && !currentUnitName) {
      toast.error("No unit selected. Please select a unit first.");
      return;
    }

    // Get learner data from plan details (need to fetch if not already available)
    // For now, we'll get it from the plan details response which should have learner_id
    let learnerId: string | number | null = null;

    // Try to get learner_id from the plan details response (first sampled_learner entry)
    if (sampledLearners.length > 0) {
      const firstSampledLearner = sampledLearners[0] as Record<string, unknown>;
      learnerId = (firstSampledLearner.learner_id as string | number | undefined) ?? 
                  (firstSampledLearner.learnerId as string | number | undefined) ?? 
                  (firstSampledLearner.id as string | number | undefined) ?? 
                  null;
    }

    // If we don't have learner_id, try to get it from plan details
    if (!learnerId) {
      try {
        const response = await triggerGetPlanDetails(planId).unwrap();
        const data = (response as { data?: unknown })?.data as Record<string, unknown> | undefined;
        if (data) {
          const sampledLearnersArray = data.sampled_learners;
          if (Array.isArray(sampledLearnersArray) && sampledLearnersArray.length > 0) {
            const firstLearner = sampledLearnersArray[0] as Record<string, unknown>;
            learnerId = (firstLearner.learner_id as string | number | undefined) ?? 
                       (firstLearner.learnerId as string | number | undefined) ?? 
                       (firstLearner.id as string | number | undefined) ?? 
                       null;
          }
        }
      } catch (error) {
        console.error("Error fetching plan details for learner ID:", error);
      }
    }

    if (!learnerId) {
      toast.error("Learner ID not found.");
      return;
    }

    // Build unit payload
    const unitIdRaw = currentUnitCode || currentUnitName || "";
    const unitRefRaw = currentUnitName || currentUnitCode || "";
    const unitId = String(unitIdRaw).trim() || "";
    const unitRef = String(unitRefRaw).trim() || unitId;

    if (!unitRef) {
      toast.error("Invalid unit information.");
      return;
    }

    // Get learner ID for request
    const numericLearnerId = Number(learnerId);
    const learnerIdForRequest = Number.isFinite(numericLearnerId)
      ? numericLearnerId
      : learnerId;

    // Get planned date (use current date/time)
    const plannedDate = new Date().toISOString();

    // Get sample type from form data or use default
    const sampleTypeForRequest = modalFormData.sampleType || "Learner interview";

    // Build assessment methods payload (all false for new entry)
    const assessmentMethodsPayload = assessmentMethodCodesForPayload.reduce(
      (accumulator, code) => {
        accumulator[code] = false;
        return accumulator;
      },
      {} as Record<string, boolean>
    );

    // Build learners payload
    const learnersPayload = [
      {
        learner_id: learnerIdForRequest,
        plannedDate: plannedDate,
        units: [
          {
            id: unitId,
            unit_ref: unitRef,
          },
        ],
      },
    ];

    const numericPlanId = Number(planId);
    const planIdForRequest = Number.isFinite(numericPlanId)
      ? numericPlanId
      : planId;

    if (!iqaId) {
      toast.error("Unable to determine current user.");
      setIsCreating(false);
      return;
    }

    const numericIqaId = Number(iqaId);
    const createdBy: string | number = Number.isFinite(numericIqaId) ? numericIqaId : (iqaId as string | number);

    const payload = {
      plan_id: planIdForRequest,
      sample_type: sampleTypeForRequest,
      created_by: createdBy,
      assessment_methods: assessmentMethodsPayload,
      learners: learnersPayload,
    };

    setIsCreating(true);
    try {
      await applySamplePlanLearners(payload).unwrap();
      toast.success("New entry created successfully.");
      dispatch(closeEditSampleModal());
      if (onDeleteSuccess) {
        onDeleteSuccess();
      }
    } catch (error: unknown) {
      const errorMessage = (error as { data?: { message?: string }; message?: string })?.data?.message || 
                          (error as { message?: string })?.message || 
                          "Failed to create new entry.";
      toast.error(errorMessage);
    } finally {
      setIsCreating(false);
    }
  }, [planId, iqaId, modalState, sampledLearners, modalFormData.sampleType, triggerGetPlanDetails, applySamplePlanLearners, dispatch, onDeleteSuccess]);

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

