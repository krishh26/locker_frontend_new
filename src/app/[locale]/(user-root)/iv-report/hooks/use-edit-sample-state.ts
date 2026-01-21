import { useState, useEffect, useCallback } from "react";
import { useAppSelector } from "@/store/hooks";
import { toast } from "sonner";
import {
  useLazyGetPlanDetailsQuery,
  useUpdateSamplePlanDetailMutation,
  useLazyGetSampleQuestionsQuery,
  useCreateSampleQuestionsMutation,
  useUpdateSampleQuestionMutation,
} from "@/store/api/qa-sample-plan/qaSamplePlanApi";
import type { ModalFormData } from "@/app/[locale]/(admin-root)/qa-sample-plan/components/edit-sample-modal/types";
import type { SampleQuestion } from "@/store/api/qa-sample-plan/types";
import {
  transformSampleHistoryToModalData,
  getEmptyModalFormData,
  extractPlannedDatesFromSampleHistory,
} from "../utils/data-transformer";
import type { UnitWithHistory } from "./use-iv-report-data";

export function useEditSampleState(
  planId: string | number | null,
  planDetailId: string | number | null,
  unit: UnitWithHistory | null,
  activeTabIndex: number
) {
  const user = useAppSelector((state) => state.auth.user);
  const iqaId = user?.user_id;

  // Form data state
  const [modalFormData, setModalFormData] = useState<ModalFormData>(getEmptyModalFormData());
  const [sampleQuestions, setSampleQuestions] = useState<SampleQuestion[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // API hooks
  const [triggerGetPlanDetails, { isLoading: isLoadingPlanDetails }] = useLazyGetPlanDetailsQuery();
  const [updateSamplePlanDetail, { isLoading: isUpdatingDetail }] = useUpdateSamplePlanDetailMutation();
  const [triggerGetQuestions, { isLoading: isLoadingQuestions }] = useLazyGetSampleQuestionsQuery();
  const [createSampleQuestions] = useCreateSampleQuestionsMutation();
  const [updateSampleQuestion] = useUpdateSampleQuestionMutation();

  // Get current sample_history item based on active tab
  const currentSampleHistory = unit?.sample_history?.[activeTabIndex] || null;
  const currentDetailId = currentSampleHistory?.detail_id || planDetailId;

  // Fetch plan details when tab changes
  useEffect(() => {
    if (!planId || !currentDetailId || !currentSampleHistory) return;

    const fetchPlanDetails = async () => {
      try {
        const response = await triggerGetPlanDetails(planId).unwrap();
        const data = (response as { data?: unknown })?.data as Record<string, unknown> | undefined;

        if (data) {
          // Transform sample_history item to modal data
          const transformedData = transformSampleHistoryToModalData(currentSampleHistory as Record<string, unknown>);
          setModalFormData(transformedData);
        }
      } catch (error: unknown) {
        console.error("Error fetching plan details:", error);
        const errorMessage =
          (error as { data?: { message?: string }; message?: string })?.data?.message ||
          (error as { message?: string })?.message ||
          "Failed to load plan details";
        toast.error(errorMessage);
      }
    };

    fetchPlanDetails();
  }, [planId, currentDetailId, currentSampleHistory, triggerGetPlanDetails]);

  // Fetch sample questions when tab changes
  useEffect(() => {
    if (!planId || !currentDetailId) return;

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
  }, [planId, currentDetailId, triggerGetQuestions]);

  // Update form data when sample_history changes
  useEffect(() => {
    if (currentSampleHistory) {
      const transformedData = transformSampleHistoryToModalData(currentSampleHistory as Record<string, unknown>);
      setModalFormData(transformedData);
    }
  }, [currentSampleHistory]);

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
  const handleAnswerChange = useCallback((id: string, answer: "Yes" | "No") => {
    setSampleQuestions((prev) =>
      prev.map((q) => (String(q.id) === id ? { ...q, answer } : q))
    );
  }, []);

  const handleDeleteQuestion = useCallback((id: string) => {
    setSampleQuestions((prev) => prev.filter((q) => String(q.id) !== id));
  }, []);

  const handleSaveQuestions = useCallback(async () => {
    if (!currentDetailId || !iqaId) {
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
            plan_detail_id: currentDetailId,
            answered_by_id: iqaId as string | number,
            questions: questionsToCreate,
          }).unwrap();
        }
      }

      toast.success("Questions saved successfully");
    } catch (error: unknown) {
      const errorMessage =
        (error as { data?: { message?: string }; message?: string })?.data?.message ||
        (error as { message?: string })?.message ||
        "Failed to save questions";
      toast.error(errorMessage);
    }
  }, [currentDetailId, sampleQuestions, iqaId, createSampleQuestions, updateSampleQuestion]);

  // Save handler
  const handleSave = useCallback(async () => {
    if (!currentDetailId) {
      toast.error("Missing required information");
      return;
    }

    setIsSaving(true);
    try {
      // Convert assessment methods array to object format
      const assessmentMethodsObj: Record<string, boolean> = {};
      const assessmentMethodCodes = ["WO", "WP", "PW", "VI", "LB", "PD", "PT", "TE", "RJ", "OT", "RPL"];
      assessmentMethodCodes.forEach((code) => {
        assessmentMethodsObj[code] = modalFormData.assessmentMethods.includes(code);
      });

      // Convert IQA conclusion array to object format
      const iqaConclusionObj: Record<string, boolean> = {};
      const iqaConclusionOptions = ["Valid", "Authentic", "Sufficient", "Relevant", "Current"];
      iqaConclusionOptions.forEach((option) => {
        iqaConclusionObj[option] = modalFormData.iqaConclusion.includes(option);
      });

      // Convert assessor decision correct string to boolean
      let assessorDecisionCorrect: boolean | undefined;
      if (modalFormData.assessorDecisionCorrect === "Yes") {
        assessorDecisionCorrect = true;
      } else if (modalFormData.assessorDecisionCorrect === "No") {
        assessorDecisionCorrect = false;
      }

      await updateSamplePlanDetail({
        plan_id: currentDetailId,
        completedDate: modalFormData.completedDate || undefined,
        feedback: modalFormData.feedback || undefined,
        assessment_methods: assessmentMethodsObj,
        iqa_conclusion: iqaConclusionObj,
        assessor_decision_correct: assessorDecisionCorrect,
        sample_type: modalFormData.sampleType || undefined,
        plannedDate: modalFormData.plannedDate || undefined,
        type: modalFormData.type || undefined,
      }).unwrap();
      toast.success("Sample plan detail updated successfully");
    } catch (error: unknown) {
      const errorMessage =
        (error as { data?: { message?: string }; message?: string })?.data?.message ||
        (error as { message?: string })?.message ||
        "Failed to update sample plan detail";
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  }, [currentDetailId, modalFormData, updateSamplePlanDetail]);

  const isLoading = isLoadingPlanDetails || isLoadingQuestions;

  return {
    modalFormData,
    sampleQuestions,
    isSaving: isSaving || isUpdatingDetail,
    isLoading,
    handleFormDataChange,
    handleAssessmentMethodToggle,
    handleIqaConclusionToggle,
    handleAnswerChange,
    handleDeleteQuestion,
    handleSaveQuestions,
    handleSave,
    currentDetailId,
  };
}
