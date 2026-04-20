"use client";

import { useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { useEffect, useCallback, useState, useMemo } from "react";
import { AlertCircle, ArrowLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslations } from "next-intl";
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
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useEvidenceList } from "@/app/[locale]/(admin-root)/qa-sample-plan/components/edit-sample-modal/hooks/use-evidence-list";
import { EvidenceTable } from "./evidence-table";
import { CommentModal } from "./comment-modal";
import { ConfirmationStatementsTable, type ConfirmationRow } from "./confirmation-statements-table";
import { UnitSignOffModal } from "./unit-sign-off-modal";
import {
  useAddAssignmentReviewMutation,
  useUpdateMappedSubUnitSignOffMutation,
  useGetUnitMappingByTypeQuery,
  useDeleteAssignmentReviewFileMutation,
} from "@/store/api/qa-sample-plan/qaSamplePlanApi";
import type { EvidenceItem } from "@/store/api/qa-sample-plan/types";
import { UnitProgressSection } from "./unit-progress-section";
import { UnitMappingTable } from "./unit-mapping-table";
import { useAppSelector } from "@/store/hooks";

interface ExamineEvidencePageContentProps {
  planDetailId: string;
}

export function ExamineEvidencePageContent({
  planDetailId,
}: ExamineEvidencePageContentProps) {
  const router = useRouter();
  const t = useTranslations("qaSamplePlan.evidence.page");
  const searchParams = useSearchParams();

  const effectivePlanDetailId =
    (
      planDetailId ||
      searchParams.get("sampleResultsId") ||
      searchParams.get("SampleResultsID") ||
      ""
    ).trim();

  // Get unit info from search params
  const unitCode = searchParams.get("unit_code");

  // Fetch evidence list
  const {
    evidenceList,
    isLoadingEvidence,
    isEvidenceError,
    evidenceErrorMessage,
    fetchEvidence,
  } = useEvidenceList(effectivePlanDetailId || null, unitCode);

  // API mutations
  const [addAssignmentReview, { isLoading: isSubmittingReview }] =
    useAddAssignmentReviewMutation();
  const [updateMappedSubUnitSignOff] =
    useUpdateMappedSubUnitSignOffMutation();
  const [deleteAssignmentReviewFile, { isLoading: isDeletingFile }] =
    useDeleteAssignmentReviewFileMutation();

  // Fetch unit mapping
  const { data: unitMappingResponse } = useGetUnitMappingByTypeQuery(
    { planDetailId: effectivePlanDetailId },
    { skip: !effectivePlanDetailId }
  );

  // Find unit name based on unit_code using unitCode from search params
  const unitName = useMemo(() => {
    if (!unitMappingResponse?.data || !unitCode) {
      return searchParams.get("unitName") || "";
    }

    const foundUnit = unitMappingResponse.data.find(
      (unit) => String(unit.unit_code) === String(unitCode)
    );

    return foundUnit?.unit_title || searchParams.get("unitName") || "";
  }, [unitMappingResponse?.data, unitCode, searchParams]);

  const displayTitle = useMemo(() => {
    const fromEvidence = evidenceList[0]?.unit?.title?.trim();
    if (fromEvidence) {
      return fromEvidence;
    }
    return unitName || "";
  }, [evidenceList, unitName]);

  // State for expanded rows, criteria sign-off, mapped sub-units
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [criteriaSignOff, setCriteriaSignOff] = useState<Record<string, boolean>>({});
  const [mappedSubUnitsChecked, setMappedSubUnitsChecked] = useState<Record<string, boolean>>({});
  const [lockedCheckboxes, setLockedCheckboxes] = useState<Set<string>>(new Set());
  const [iqaCheckedCheckboxes, setIqaCheckedCheckboxes] = useState<Set<string>>(new Set());
  const [expandedUnits, setExpandedUnits] = useState<Set<string | number>>(new Set());
  const defaultConfirmationRows = useMemo<ConfirmationRow[]>(
    () => [
      {
        role: "Learner",
        statement: t("confirmationStatements.learner"),
        completed: false,
        signedOffBy: "",
        dated: "",
        comments: "",
        file: "",
      },
      {
        role: "Trainer",
        statement: t("confirmationStatements.trainer"),
        completed: false,
        signedOffBy: "",
        dated: "",
        comments: "",
        file: "",
      },
      {
        role: "Lead assessor Countersignature (if required)",
        statement: t("confirmationStatements.leadAssessorCountersignature"),
        completed: false,
        signedOffBy: "",
        dated: "",
        comments: "",
        file: "",
      },
      {
        role: "Employer",
        statement: t("confirmationStatements.employer"),
        completed: false,
        signedOffBy: "",
        dated: "",
        comments: "",
        file: "",
      },
      {
        role: "IQA",
        statement: t("confirmationStatements.iqa"),
        completed: false,
        signedOffBy: "",
        dated: "",
        comments: "",
        file: "",
      },
      {
        role: "EQA",
        statement: t("confirmationStatements.eqa"),
        completed: false,
        signedOffBy: "",
        dated: "",
        comments: "",
        file: "",
      },
    ],
    [t]
  );
  const [confirmationRows, setConfirmationRows] = useState<ConfirmationRow[]>(defaultConfirmationRows);

  // Comment modal state
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceItem | null>(null);
  const [comment, setComment] = useState("");

  // Unit sign-off modal state
  const [unitSignOffModalOpen, setUnitSignOffModalOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // File deletion state
  const [deleteFileDialogOpen, setDeleteFileDialogOpen] = useState(false);
  const [fileToDeleteIndex, setFileToDeleteIndex] = useState<number | null>(null);

  // Get current user role (placeholder - replace with actual user hook when available)
  const currentUserRole = useAppSelector((state) => state.auth.user?.role) || "";

  // Helper function to create state key
  const createStateKey = useCallback(
    (assignmentId: number | undefined, subUnitId: string | number) => {
      return assignmentId ? `${assignmentId}_${subUnitId}` : String(subUnitId);
    },
    []
  );

  // Generate all units to display based on unitMappingResponse
  // If type is "code" or "qualification", use subUnits, otherwise use parent unit
  const allUnitsToDisplay = useMemo(() => {
    if (!unitMappingResponse?.data || unitMappingResponse.data.length === 0) {
      return [];
    }

    const unitsToDisplay: Array<{
      id: string | number;
      code: string;
      title: string;
      unit_code: string | number;
      learnerMapped?: boolean;
      trainerMapped?: boolean;
    }> = [];

    unitMappingResponse.data.forEach((unit) => {
      const shouldUseSubUnits = unit.type === "code" || unit.type === "qualification";

      if (shouldUseSubUnits && unit.subUnits && unit.subUnits.length > 0) {
        // Use subUnits for code/qualification type
        unit.subUnits.forEach((subUnit) => {
          unitsToDisplay.push({
            id: subUnit.id,
            code: subUnit.code || String(subUnit.id),
            title: subUnit.title || "",
            unit_code: unit.unit_code,
            learnerMapped: subUnit.learnerMapped || false,
            trainerMapped: subUnit.trainerMapped || false,
          });
        });
      } else {
        // Use parent unit for other types
        unitsToDisplay.push({
          id: unit.unit_code,
          code: unit.code || String(unit.unit_code),
          title: unit.unit_title || "",
          unit_code: unit.unit_code,
          learnerMapped: unit.learnerMapped || false,
          trainerMapped: unit.trainerMapped || false,
        });
      }
    });

    return unitsToDisplay;
  }, [unitMappingResponse]);

  // Calculate unit progress statistics based on evidence data
  const unitProgress = useMemo(() => {
    const total = evidenceList.length;

    let pendingTrainerMap = 0;
    let pendingIqaMap = 0;
    let iqaChecked = 0;

    // Count directly from evidenceList.mappedSubUnits
    evidenceList.forEach((evidence) => {
      if (evidence.mappedSubUnits && evidence.mappedSubUnits.length > 0) {
        evidence.mappedSubUnits.forEach((subUnit) => {
          // Check if IQA checked (signed_off: true)
          if (subUnit.review?.signed_off === true) {
            iqaChecked++;
          }
          // Count as pending IQA map if trainerMapped is true but signed_off is false
          else if (subUnit.trainerMapped === true) {
            pendingIqaMap++;
          }
          // Count as pending trainer map if trainerMapped is false (trainer hasn't mapped it yet)
          else if (subUnit.trainerMapped === false) {
            pendingTrainerMap++;
          }
        });
      }
    });

    return { pendingTrainerMap, pendingIqaMap, iqaChecked, total };
  }, [evidenceList]);

  const hasExpandedRows = useMemo(
    () => Object.values(expandedRows).some((expanded) => expanded),
    [expandedRows]
  );

  // Initialize state from API response
  useEffect(() => {
    if (evidenceList.length > 0) {
      // Initialize mappedSubUnits checked state from API response
      const initialCheckedState: Record<string, boolean> = {};
      const initialLockedCheckboxes = new Set<string>();
      const initialIqaChecked = new Set<string>();

      evidenceList.forEach((evidence) => {
        if (evidence.mappedSubUnits) {
          evidence.mappedSubUnits.forEach((subUnit) => {
            const key = createStateKey(evidence.assignment_id, subUnit.id);
            if (subUnit.review && subUnit.review.signed_off === true) {
              initialCheckedState[key] = true;
              initialLockedCheckboxes.add(key);
              // Check if signed by IQA
              if (subUnit.review.signed_by?.name) {
                initialIqaChecked.add(key);
              }
            } else if (subUnit.trainerMapped === true) {
              // trainerMapped is true but not signed off yet - checkbox should be toggleable
              initialCheckedState[key] = false; // Start as unchecked, can be checked by IQA
              // Don't lock it - allow IQA to check it
            } else {
              initialCheckedState[key] = false;
            }
          });
        }
      });
      setMappedSubUnitsChecked(initialCheckedState);
      setLockedCheckboxes(initialLockedCheckboxes);
      setIqaCheckedCheckboxes(initialIqaChecked);

      // Initialize criteriaSignOff based on whether all units are signed off
      const initialCriteriaSignOff: Record<string, boolean> = {};
      evidenceList.forEach((evidence) => {
        if (evidence.mappedSubUnits && evidence.mappedSubUnits.length > 0) {
          const trainerMappedSubUnits = evidence.mappedSubUnits.filter(
            (sub) => sub.trainerMapped === true
          );
          // Only mark as checked if there are trainer-mapped units AND all are signed off
          // If no trainer-mapped units exist, mark as unchecked (false)
          if (trainerMappedSubUnits.length > 0) {
            const allSignedOff = trainerMappedSubUnits.every(
              (sub) => sub.review?.signed_off === true
            );
            initialCriteriaSignOff[String(evidence.assignment_id)] = allSignedOff;
          } else {
            // No trainer-mapped units, so checkbox should be unchecked
            initialCriteriaSignOff[String(evidence.assignment_id)] = false;
          }
        } else {
          // No mappedSubUnits at all, checkbox should be unchecked
          initialCriteriaSignOff[String(evidence.assignment_id)] = false;
        }
      });
      setCriteriaSignOff(initialCriteriaSignOff);

      // Update confirmation rows from reviews in API response
      setConfirmationRows((prevRows) => {
        const updatedRows = prevRows.map((row) => {
          // Find reviews for this role across all evidence items
          let reviewData = null;

          for (const evidence of evidenceList) {
            if (
              evidence.reviews &&
              typeof evidence.reviews === "object" &&
              !Array.isArray(evidence.reviews)
            ) {
              const reviews = evidence.reviews as Record<
                string,
                {
                  id?: number;
                  completed: boolean;
                  comment: string;
                  signed_off_at: string | null;
                  signed_off_by: string | null;
                  file?: {
                    name: string;
                    size: number;
                    url: string;
                    key: string;
                  } | null;
                }
              >;

              // Check if this role has a review
              if (reviews[row.role]) {
                reviewData = reviews[row.role];
                break; // Use the first matching review found
              }
            }
          }

          // Update row with review data if found
          if (reviewData) {
            const fileName = reviewData.file?.name || "";
            return {
              ...row,
              completed: reviewData.completed || false,
              comments: reviewData.comment || "",
              signedOffBy: reviewData.signed_off_by || "",
              dated: reviewData.signed_off_at
                ? new Date(reviewData.signed_off_at).toLocaleDateString()
                : "",
              file: fileName || row.file || "",
              assignment_review_id: reviewData.id || row.assignment_review_id,
            };
          }

          return row;
        });

        return updatedRows;
      });
    }
  }, [evidenceList, createStateKey]);

  // Fetch evidence on mount
  useEffect(() => {
    if (effectivePlanDetailId && unitCode) {
      fetchEvidence();
    }
  }, [effectivePlanDetailId, unitCode, fetchEvidence]);

  // Handlers
  const handleToggleAllRows = useCallback(() => {
    setExpandedRows(() => {
      const next: Record<string, boolean> = {};
      evidenceList.forEach((evidence) => {
        const refNo = String(evidence.assignment_id);
        next[refNo] = !hasExpandedRows;
      });
      return next;
    });
  }, [evidenceList, hasExpandedRows]);

  const handleCriteriaToggle = useCallback(
    async (refNo: string) => {
      const isIQA = currentUserRole === "IQA";

      // Only IQA can use this shortcut
      if (!isIQA) {
        toast.error(t("toast.onlyIqaCanSignOffAllCriteria"));
        return;
      }

      // Find the evidence by assignment_id (key is refNo which is assignment_id)
      const evidence = evidenceList.find((e) => String(e.assignment_id) === refNo);

      if (!evidence) {
        toast.error(t("toast.evidenceNotFound"));
        return;
      }

      // Check if already checked
      const isCurrentlyChecked = criteriaSignOff[refNo] || false;
      const newCheckedState = !isCurrentlyChecked;

      // If unchecking, don't allow (one-way operation)
      if (!newCheckedState) {
        toast.error(t("toast.cannotUncheckSignOffPermanent"));
        return;
      }

      // Get all mappedSubUnits that have trainerMapped === true
      const subUnitsToSignOff = evidence.mappedSubUnits?.filter(
        (subUnit) => subUnit.trainerMapped === true
      ) || [];

      if (subUnitsToSignOff.length === 0) {
        toast.error(t("toast.noUnitsReadyTrainerMustMapFirst"));
        return;
      }

      // Update local state optimistically
      setCriteriaSignOff((prev) => ({
        ...prev,
        [refNo]: newCheckedState,
      }));

      // Update all subUnits states
      const stateKeysToUpdate: string[] = [];
      subUnitsToSignOff.forEach((subUnit) => {
        const stateKey = createStateKey(evidence.assignment_id, subUnit.id);
        stateKeysToUpdate.push(stateKey);

        // Mark as checked, locked, and IQA checked
        setMappedSubUnitsChecked((prev) => ({
          ...prev,
          [stateKey]: true,
        }));
        setLockedCheckboxes((prev) => new Set(prev).add(stateKey));
        setIqaCheckedCheckboxes((prev) => new Set(prev).add(stateKey));
      });

      // Call API for each subUnit
      try {
        if (!unitCode) {
          toast.error(t("toast.unitCodeRequired"));
          // Revert state changes
          setCriteriaSignOff((prev) => ({
            ...prev,
            [refNo]: !newCheckedState,
          }));
          stateKeysToUpdate.forEach((stateKey) => {
            setMappedSubUnitsChecked((prev) => ({
              ...prev,
              [stateKey]: false,
            }));
            setLockedCheckboxes((prev) => {
              const newSet = new Set(prev);
              newSet.delete(stateKey);
              return newSet;
            });
            setIqaCheckedCheckboxes((prev) => {
              const newSet = new Set(prev);
              newSet.delete(stateKey);
              return newSet;
            });
          });
          return;
        }

        if (!evidence.mapping_id) {
          toast.error(t("toast.evidenceNotFound"));
          return;
        }
        const mappingId = evidence.mapping_id;

        const updatePromises = subUnitsToSignOff.map((subUnit) =>
          updateMappedSubUnitSignOff({
            mapping_id: mappingId,
            unit_code: unitCode,
            pc_id: subUnit.id,
            signed_off: true,
          }).unwrap()
        );

        await Promise.all(updatePromises);

        toast.success(t("toast.signedOffUnitsSuccess", { count: subUnitsToSignOff.length }));

        // Refetch evidence to get updated data
        fetchEvidence();
      } catch (error: unknown) {
        // Revert state changes on error
        setCriteriaSignOff((prev) => ({
          ...prev,
          [refNo]: !newCheckedState,
        }));

        stateKeysToUpdate.forEach((stateKey) => {
          setMappedSubUnitsChecked((prev) => ({
            ...prev,
            [stateKey]: false,
          }));
          setLockedCheckboxes((prev) => {
            const newSet = new Set(prev);
            newSet.delete(stateKey);
            return newSet;
          });
          setIqaCheckedCheckboxes((prev) => {
            const newSet = new Set(prev);
            newSet.delete(stateKey);
            return newSet;
          });
        });

        const message =
          error && typeof error === "object" && "data" in error
            ? ((error as { data?: { message?: string } }).data?.message ||
              (error as { error?: string }).error ||
              t("toast.signOffUnitsFailed"))
            : t("toast.signOffUnitsFailed");
        toast.error(message);
      }
    },
    [
      criteriaSignOff,
      evidenceList,
      currentUserRole,
      unitCode,
      createStateKey,
      updateMappedSubUnitSignOff,
      fetchEvidence,
      t,
    ]
  );

  const handleMappedSubUnitToggle = useCallback(
    async (subUnitId: number | string, assignmentId?: number) => {
      const stateKey = createStateKey(assignmentId, subUnitId);
      const currentChecked = mappedSubUnitsChecked[stateKey] || false;

      // Prevent toggling if already locked
      if (lockedCheckboxes.has(stateKey)) {
        return;
      }

      // Find the target evidence to check trainerMapped status
      let targetEvidence: EvidenceItem | null = null;
      if (assignmentId) {
        targetEvidence = evidenceList.find((e) => e.assignment_id === assignmentId) || null;
      } else {
        const idString = String(subUnitId);
        targetEvidence =
          evidenceList.find((evidence) =>
            evidence.mappedSubUnits?.some((su) => String(su.id) === idString)
          ) || null;
      }

      if (!targetEvidence) {
        toast.error(t("toast.evidenceNotFoundCannotUpdateSignOff"));
        return;
      }

      // Find the specific subUnit
      const evidenceSubUnit = targetEvidence.mappedSubUnits?.find(
        (su) => String(su.id) === String(subUnitId)
      );

      if (!evidenceSubUnit) {
        toast.error(t("toast.subUnitNotFoundCannotUpdateSignOff"));
        return;
      }

      const isIQA = currentUserRole === "IQA";

      // IQA can only check if trainerMapped is true
      if (isIQA && !evidenceSubUnit.trainerMapped) {
        toast.error(t("toast.iqaCanOnlySignOffWhenTrainerMapped"));
        return;
      }

      // Determine new state based on current state
      const newSignedOffState = !currentChecked;

      // Lock the checkbox once it's set
      setLockedCheckboxes((prev) => new Set(prev).add(stateKey));

      // Track if IQA checked it
      if (isIQA && newSignedOffState) {
        setIqaCheckedCheckboxes((prev) => new Set(prev).add(stateKey));
      }

      setMappedSubUnitsChecked((prev) => ({
        ...prev,
        [stateKey]: newSignedOffState,
      }));

      try {
        if (!unitCode) {
          toast.error(t("toast.unitCodeRequired"));
          // Revert state changes on error
          setMappedSubUnitsChecked((prev) => ({
            ...prev,
            [stateKey]: !newSignedOffState,
          }));
          setLockedCheckboxes((prev) => {
            const newSet = new Set(prev);
            newSet.delete(stateKey);
            return newSet;
          });
          setIqaCheckedCheckboxes((prev) => {
            const newSet = new Set(prev);
            newSet.delete(stateKey);
            return newSet;
          });
          return;
        }

        // Call API to update mappedSubUnit sign-off
        if (!targetEvidence.mapping_id) {
          toast.error(t("toast.evidenceNotFoundCannotUpdateSignOff"));
          return;
        }

        await updateMappedSubUnitSignOff({
          mapping_id: targetEvidence.mapping_id,
          unit_code: unitCode,
          pc_id: subUnitId,
          signed_off: newSignedOffState,
        }).unwrap();

        toast.success(t("toast.signOffStatusUpdatedSuccess"));

        // Refetch evidence list to get updated data
        fetchEvidence();
      } catch (error: unknown) {
        // Revert state changes on error
        setMappedSubUnitsChecked((prev) => ({
          ...prev,
          [stateKey]: !newSignedOffState,
        }));
        setLockedCheckboxes((prev) => {
          const newSet = new Set(prev);
          newSet.delete(stateKey);
          return newSet;
        });
        setIqaCheckedCheckboxes((prev) => {
          const newSet = new Set(prev);
          newSet.delete(stateKey);
          return newSet;
        });

        const message =
          error && typeof error === "object" && "data" in error
            ? ((error as { data?: { message?: string } }).data?.message ||
              (error as { error?: string }).error ||
              t("toast.signOffStatusUpdateFailed"))
            : t("toast.signOffStatusUpdateFailed");
        toast.error(message);
      }
    },
    [
      mappedSubUnitsChecked,
      lockedCheckboxes,
      evidenceList,
      unitCode,
      currentUserRole,
      createStateKey,
      updateMappedSubUnitSignOff,
      fetchEvidence,
      t,
    ]
  );

  const handleOpenCommentModal = useCallback((evidence: EvidenceItem) => {
    setSelectedEvidence(evidence);
    // Pre-fill comment if there's already a review for current user's role
    const existingReview =
      evidence.reviews &&
      typeof evidence.reviews === "object" &&
      !Array.isArray(evidence.reviews)
        ? (evidence.reviews as Record<string, { comment: string }>)[currentUserRole]
        : null;
    setComment(existingReview?.comment || "");
    setCommentModalOpen(true);
  }, [currentUserRole]);

  const handleSubmitComment = useCallback(
    async (commentText: string) => {
      if (!selectedEvidence || !commentText.trim() || !effectivePlanDetailId || !unitCode) {
        toast.error(t("toast.fillAllRequiredFields"));
        return;
      }

      if (!selectedEvidence.mapping_id) {
        toast.error(t("toast.evidenceNotFound"));
        return;
      }

      try {
        await addAssignmentReview({
          mapping_id: selectedEvidence.mapping_id,
          sampling_plan_detail_id: Number(effectivePlanDetailId),
          role: currentUserRole,
          comment: commentText.trim(),
          unit_code: unitCode,
          signed_off: false,
        }).unwrap();

        toast.success(t("toast.commentAddedSuccess"));

        setCommentModalOpen(false);
        setSelectedEvidence(null);
        setComment("");

        // Refetch evidence list to get updated data
        fetchEvidence();
      } catch (error: unknown) {
        const message =
          error && typeof error === "object" && "data" in error
            ? ((error as { data?: { message?: string } }).data?.message ||
              (error as { error?: string }).error ||
              t("toast.addCommentFailed"))
            : t("toast.addCommentFailed");
        toast.error(message);
      }
    },
    [
      selectedEvidence,
      effectivePlanDetailId,
      unitCode,
      currentUserRole,
      addAssignmentReview,
      fetchEvidence,
      t,
    ]
  );

  const handleConfirmationToggle = useCallback(
    async (index: number) => {
      const confirmationRow = confirmationRows[index];
      if (!confirmationRow || !effectivePlanDetailId || !unitCode) {
        return;
      }

      const newCompletedState = !confirmationRow.completed;

      // Optimistically update UI
      setConfirmationRows((prev) => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          completed: newCompletedState,
        };
        return updated;
      });

      try {
        // Get the first evidence's assignment_id for unit-level sign-off
        const firstEvidence = evidenceList.length > 0 ? evidenceList[0] : null;

        if (!firstEvidence) {
          toast.error(t("toast.noEvidenceCannotUpdateStatus"));
          // Revert the optimistic update
          setConfirmationRows((prev) => {
            const updated = [...prev];
            updated[index] = {
              ...updated[index],
              completed: !newCompletedState,
            };
            return updated;
          });
          return;
        }

        const role = confirmationRow.role;
        const comment = confirmationRow.comments || "";

        if (!firstEvidence.mapping_id) {
          toast.error(t("toast.noEvidenceCannotUpdateStatus"));
          // Revert the optimistic update
          setConfirmationRows((prev) => {
            const updated = [...prev];
            updated[index] = {
              ...updated[index],
              completed: !newCompletedState,
            };
            return updated;
          });
          return;
        }

        // Backend persists role-grid tick on `completed` (legacy parity); omit signed_off here.
        await addAssignmentReview({
          mapping_id: firstEvidence.mapping_id,
          sampling_plan_detail_id: Number(effectivePlanDetailId),
          role: role,
          comment: comment,
          unit_code: unitCode,
          completed: newCompletedState,
        }).unwrap();

        toast.success(t("toast.statusUpdatedSuccess"));

        // Refetch evidence list to get updated data
        fetchEvidence();
      } catch (error: unknown) {
        // Revert the optimistic update on error
        setConfirmationRows((prev) => {
          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            completed: !newCompletedState,
          };
          return updated;
        });

        const message =
          error && typeof error === "object" && "data" in error
            ? ((error as { data?: { message?: string } }).data?.message ||
              (error as { error?: string }).error ||
              t("toast.updateStatusFailed"))
            : t("toast.updateStatusFailed");
        toast.error(message);
      }
    },
    [confirmationRows, effectivePlanDetailId, unitCode, evidenceList, addAssignmentReview, fetchEvidence, t]
  );

  const handleAddComment = useCallback((index: number) => {
    setSelectedIndex(index);
    setUnitSignOffModalOpen(true);
  }, []);

  const handleDeleteFileClick = useCallback((index: number) => {
    setFileToDeleteIndex(index);
    setDeleteFileDialogOpen(true);
  }, []);

  const handleDeleteFileConfirm = useCallback(async () => {
    if (fileToDeleteIndex === null) {
      setDeleteFileDialogOpen(false);
      return;
    }

    const index = fileToDeleteIndex;
    const confirmationRow = confirmationRows[index];

    if (!confirmationRow?.assignment_review_id) {
      toast.error(t("toast.unableDeleteFileReviewIdNotFound"));
      setDeleteFileDialogOpen(false);
      setFileToDeleteIndex(null);
      return;
    }

    try {
      await deleteAssignmentReviewFile({
        assignment_review_id: confirmationRow.assignment_review_id,
      }).unwrap();

      setConfirmationRows((prev) => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          file: "",
        };
        return updated;
      });

      toast.success(t("toast.fileDeletedSuccess"));

      setDeleteFileDialogOpen(false);
      setFileToDeleteIndex(null);
      fetchEvidence();
    } catch (error: unknown) {
      const message =
        error && typeof error === "object" && "data" in error
          ? ((error as { data?: { message?: string } }).data?.message ||
            (error as { error?: string }).error ||
            t("toast.deleteFileFailed"))
          : t("toast.deleteFileFailed");
      toast.error(message);
    }
  }, [
    fileToDeleteIndex,
    confirmationRows,
    deleteAssignmentReviewFile,
    fetchEvidence,
    t,
  ]);

  const handleDeleteFileCancel = useCallback(() => {
    setDeleteFileDialogOpen(false);
    setFileToDeleteIndex(null);
  }, []);

  const handleModalSubmit = useCallback(
    async (comment: string, file?: File) => {
      if (!comment.trim() || selectedIndex === null || !effectivePlanDetailId || !unitCode) {
        toast.error(t("toast.fillAllRequiredFields"));
        return;
      }

      try {
        const firstEvidence = evidenceList.length > 0 ? evidenceList[0] : null;

        if (!firstEvidence) {
          toast.error(t("toast.noEvidenceCannotAddComment"));
          return;
        }

        const confirmationRow = confirmationRows[selectedIndex];
        const role = confirmationRow?.role || currentUserRole;
        if (!firstEvidence.mapping_id) {
          toast.error(t("toast.noEvidenceCannotAddComment"));
          return;
        }

        const response = await addAssignmentReview({
          mapping_id: firstEvidence.mapping_id,
          sampling_plan_detail_id: Number(effectivePlanDetailId),
          role: role,
          comment: comment.trim(),
          unit_code: unitCode,
          file,
        }).unwrap();

        const saved = (response as { data?: { id?: number } }).data;
        const assignmentReviewId = saved?.id;

        const updated = [...confirmationRows];
        updated[selectedIndex] = {
          ...updated[selectedIndex],
          comments: comment.trim(),
          file: file ? file.name : updated[selectedIndex].file,
          assignment_review_id:
            assignmentReviewId ?? updated[selectedIndex].assignment_review_id,
        };
        setConfirmationRows(updated);

        toast.success(file ? t("toast.commentAndFileUploadedSuccess") : t("toast.commentAddedSuccess"));

        setUnitSignOffModalOpen(false);
        setSelectedIndex(null);

        fetchEvidence();
      } catch (error: unknown) {
        const message =
          error && typeof error === "object" && "data" in error
            ? ((error as { data?: { message?: string } }).data?.message ||
              (error as { error?: string }).error ||
              t("toast.addCommentFailed"))
            : t("toast.addCommentFailed");
        toast.error(message);
      }
    },
    [
      selectedIndex,
      effectivePlanDetailId,
      unitCode,
      evidenceList,
      confirmationRows,
      currentUserRole,
      addAssignmentReview,
      fetchEvidence,
      t,
    ]
  );

  const handleToggleUnitExpansion = useCallback((unitCode: string | number) => {
    setExpandedUnits((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(unitCode)) {
        newSet.delete(unitCode);
      } else {
        newSet.add(unitCode);
      }
      return newSet;
    });
  }, []);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);


  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          className="h-8 w-8"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader
          title={displayTitle}
          subtitle={
            unitCode
              ? t("subtitleForUnit", { unitCode })
              : t("subtitle")
          }
          icon={FileText}
        />
      </div>

      {isLoadingEvidence ? (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      ) : isEvidenceError ? (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>{t("evidenceLoadErrorTitle")}</AlertTitle>
          <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>{evidenceErrorMessage || t("evidenceLoadErrorDescription")}</span>
            <Button type="button" variant="outline" size="sm" onClick={() => void fetchEvidence()}>
              {t("retryEvidenceLoad")}
            </Button>
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <UnitProgressSection unitProgress={unitProgress} />

          <EvidenceTable
            evidenceList={evidenceList}
            expandedRows={expandedRows}
            criteriaSignOff={criteriaSignOff}
            mappedSubUnitsChecked={mappedSubUnitsChecked}
            lockedCheckboxes={lockedCheckboxes}
            iqaCheckedCheckboxes={iqaCheckedCheckboxes}
            allUnitsToDisplay={allUnitsToDisplay}
            hasExpandedRows={hasExpandedRows}
            currentUserRole={currentUserRole}
            onToggleAllRows={handleToggleAllRows}
            onCriteriaToggle={handleCriteriaToggle}
            onMappedSubUnitToggle={handleMappedSubUnitToggle}
            onOpenCommentModal={handleOpenCommentModal}
            createStateKey={createStateKey}
          />

          <ConfirmationStatementsTable
            confirmationRows={confirmationRows}
            currentUserRole={currentUserRole}
            onConfirmationToggle={handleConfirmationToggle}
            onAddComment={handleAddComment}
            onDeleteFile={handleDeleteFileClick}
            isDeletingFile={isDeletingFile}
          />

          <UnitMappingTable
            unitMappingResponse={unitMappingResponse}
            expandedUnits={expandedUnits}
            onToggleUnitExpansion={handleToggleUnitExpansion}
          />

        </>
      )}

      {/* Comment Modal */}
      <CommentModal
        open={commentModalOpen}
        onOpenChange={setCommentModalOpen}
        evidence={selectedEvidence}
        currentUserRole={currentUserRole}
        onSubmit={handleSubmitComment}
        initialComment={comment}
        isLoading={isSubmittingReview}
      />

      {/* Unit Sign Off Modal */}
      <UnitSignOffModal
        open={unitSignOffModalOpen}
        onOpenChange={setUnitSignOffModalOpen}
        onSubmit={handleModalSubmit}
        defaultValue={
          selectedIndex !== null
            ? confirmationRows[selectedIndex]?.comments || ""
            : ""
        }
      />

      {/* Delete File Confirmation Dialog */}
      <AlertDialog open={deleteFileDialogOpen} onOpenChange={setDeleteFileDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteFileDialog.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteFileDialog.description")}
              {fileToDeleteIndex !== null && confirmationRows[fileToDeleteIndex]?.file && (
                <div className="mt-2 font-medium">
                  {t("deleteFileDialog.fileLabel")}: {confirmationRows[fileToDeleteIndex].file}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteFileCancel} disabled={isDeletingFile}>
              {t("deleteFileDialog.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteFileConfirm}
              disabled={isDeletingFile}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingFile ? t("deleteFileDialog.deleting") : t("deleteFileDialog.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
