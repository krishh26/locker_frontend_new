/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { EvidenceEntry } from "@/store/api/evidence/types";
import {
  useGetEvidenceDetailsQuery,
  useUpdateEvidenceMutation,
  useUpsertAssignmentMappingMutation,
  useUpdateMappingPCMutation,
} from "@/store/api/evidence/evidenceApi";
import { useAppSelector } from "@/store/hooks";
import { selectCourses } from "@/store/slices/authSlice";
import { reconstructFormStateFromMappings } from "../utils/reconstruct-form-state";
import { COURSE_TYPES } from "./constants";
import { EvidenceMappingsTable } from "./view/evidence-mappings-table";

interface EvidenceDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  evidence: EvidenceEntry | null;
}

export function EvidenceDetailsModal({
  open,
  onOpenChange,
  evidence,
}: EvidenceDetailsModalProps) {
  const courses = useAppSelector(selectCourses);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch full evidence details
  const { data: evidenceDetails, isLoading: isLoadingDetails } =
    useGetEvidenceDetailsQuery(Number(evidence?.assignment_id), {
      skip: !evidence?.assignment_id || !open,
    });

  const [updateEvidence] = useUpdateEvidenceMutation();
  const [upsertMapping] = useUpsertAssignmentMappingMutation();
  const [updateMappingPC] = useUpdateMappingPCMutation();

  // Initialize form with evidence data
  const form = useForm({
    defaultValues: {
      trainer_feedback: "",
      units: [] as any[],
    },
  });

  // Reconstruct course/unit structure from mappings when evidence details are loaded
  useEffect(() => {
    if (evidenceDetails?.data && courses.length > 0 && open) {
      const evidence = evidenceDetails.data;
      
      // Set trainer feedback
      form.setValue("trainer_feedback", evidence.trainer_feedback || "");

      // Reconstruct units from mappings
      if (evidence.mappings && evidence.mappings.length > 0) {
        const reconstructed = reconstructFormStateFromMappings(
          evidence.mappings,
          courses
        );
        form.setValue("units", reconstructed.units);
      } else {
        form.setValue("units", []);
      }
    } else if (!open) {
      // Reset form when modal closes
      form.reset({
        trainer_feedback: "",
        units: [],
      });
    }
  }, [evidenceDetails, courses, open, form]);

  const handleSave = async () => {
    if (!evidenceDetails?.data) return;

    setIsSubmitting(true);
    try {
      const formData = form.getValues();
      const assignmentId = evidenceDetails.data.assignment_id;

      // Step 1: Update evidence with trainer feedback
      await updateEvidence({
        id: assignmentId,
        data: {
          trainer_feedback: formData.trainer_feedback || undefined,
        },
      }).unwrap();

      // Step 2: Handle mappings for each course/unit/subunit/topic combination
      const desiredMappings: Map<string, any> = new Map();
      const formUnits = formData.units || [];
      const reconstructed = reconstructFormStateFromMappings(
        evidenceDetails.data.mappings || [],
        courses
      );
      const selectedCourses = reconstructed.selectedCourses;

      formUnits.forEach((unit: any) => {
        const courseId = unit.course_id;
        const course = selectedCourses.find((c: any) => c.course_id === courseId);
        const isQual = course?.course_core_type === COURSE_TYPES.QUALIFICATION;
        const hasSubUnit = unit.subUnit && unit.subUnit.length > 0;

        if (isQual && hasSubUnit) {
          // For Qualification courses: map topics (Assessment Criteria) only
          unit.subUnit.forEach((subUnit: any) => {
            if (subUnit.topics && Array.isArray(subUnit.topics) && subUnit.topics.length > 0) {
              subUnit.topics.forEach((topic: any) => {
                // Only add to desiredMappings if learnerMap is true
                if (topic.learnerMap === true) {
                  const key = `${courseId}-${topic.id}`;
                  desiredMappings.set(key, {
                    assignment_id: Number(assignmentId),
                    course_id: Number(courseId),
                    unit_code: String(topic.id), // For qualification, unit_code = topic.id
                    learnerMap: true,
                    trainerMap: topic.trainerMap ?? false,
                    comment: topic.comment ?? "",
                    mapping_id: topic.mapping_id, // For updates (if exists)
                  });
                }
              });
            }
          });
        } else if (hasSubUnit) {
          // For Standard courses: Unit has subunits - create mapping for each subunit
          unit.subUnit.forEach((sub: any) => {
            if (sub.learnerMap === true) {
              const key = `${courseId}-${sub.id}`;
              desiredMappings.set(key, {
                assignment_id: Number(assignmentId),
                course_id: Number(courseId),
                unit_code: String(sub.id),
                learnerMap: true,
                trainerMap: sub.trainerMap ?? false,
                comment: sub.comment ?? "",
                mapping_id: sub.mapping_id, // For updates (if exists)
              });
            }
          });
        } else {
          // Unit-only - create mapping for unit itself
          if (unit.learnerMap === true) {
            const key = `${courseId}-${unit.id}`;
            desiredMappings.set(key, {
              assignment_id: Number(assignmentId),
              course_id: Number(courseId),
              unit_code: String(unit.id),
              learnerMap: true,
              trainerMap: unit.trainerMap ?? false,
              comment: unit.comment ?? "",
              mapping_id: unit.mapping_id, // For updates (if exists)
            });
          }
        }
      });

      // Step 3: Upsert mappings and update PC (learnerMap/trainerMap/signedOff/comment)
      const desiredMappingsArray = Array.from(desiredMappings.entries());
      
      for (const [key, desiredMapping] of desiredMappingsArray) {
        try {
          const { mapping_id, ...payload } = desiredMapping;
          
          // Upsert mapping (creates if new, updates if exists)
          const result = await upsertMapping(payload).unwrap();
          
          // Extract mapping_id from response
          let mappingId: number | null = null;
          
          if (result?.data && Array.isArray(result.data) && result.data.length > 0) {
            mappingId = result.data[0]?.mapping_id || null;
          } else if ((result as any)?.mapping_id) {
            mappingId = (result as any).mapping_id;
          } else if ((result as any)?.id) {
            mappingId = (result as any).id;
          } else if ((result as any)?.data?.mapping_id) {
            mappingId = (result as any).data.mapping_id;
          } else if (mapping_id) {
            mappingId = mapping_id;
          }

          // Update PC (learnerMap/trainerMap/signedOff/comment) if mapping exists
          if (mappingId) {
            // Find the unit/subUnit/topic from form data to get current values
            let pcData: any = null;
            
            // Search through form units to find matching item
            for (const unit of formUnits) {
              const courseId = unit.course_id;
              const course = selectedCourses.find((c: any) => c.course_id === courseId);
              const isQual = course?.course_core_type === COURSE_TYPES.QUALIFICATION;
              
              if (isQual && unit.subUnit) {
                // Qualification: check topics
                for (const subUnit of unit.subUnit) {
                  if (subUnit.topics) {
                    const topic = subUnit.topics.find((t: any) => {
                      const topicKey = `${courseId}-${t.id}`;
                      return topicKey === key;
                    });
                    if (topic) {
                      pcData = {
                        learnerMap: topic.learnerMap ?? false,
                        trainerMap: topic.trainerMap ?? false,
                        signedOff: topic.signedOff ?? false,
                        comment: topic.comment ?? "",
                      };
                      break;
                    }
                  }
                }
              } else if (unit.subUnit) {
                // Standard: check subUnits
                const subUnit = unit.subUnit.find((sub: any) => {
                  const subKey = `${courseId}-${sub.id}`;
                  return subKey === key;
                });
                if (subUnit) {
                  pcData = {
                    learnerMap: subUnit.learnerMap ?? false,
                    trainerMap: subUnit.trainerMap ?? false,
                    signedOff: subUnit.signedOff ?? false,
                    comment: subUnit.comment ?? "",
                  };
                }
              } else {
                // Unit only
                const unitKey = `${courseId}-${unit.id}`;
                if (unitKey === key) {
                  pcData = {
                    learnerMap: unit.learnerMap ?? false,
                    trainerMap: unit.trainerMap ?? false,
                    signedOff: unit.signedOff ?? false,
                    comment: unit.comment ?? "",
                  };
                }
              }
              
              if (pcData) break;
            }

            // Update PC if we have data
            if (pcData) {
              await updateMappingPC({
                mapping_id: mappingId,
                data: pcData,
              }).unwrap();
            }
          }
        } catch (error) {
          console.warn("Failed to upsert/update mapping:", error);
        }
      }

      toast.success("Evidence updated successfully");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to update evidence. Please try again.");
      console.error("Error updating evidence:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const evidenceData = evidenceDetails?.data;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="text-xl font-semibold">
            {evidenceData?.title || "Evidence Details"}
          </DialogTitle>
          <DialogDescription>
            View and edit evidence details and unit mappings
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {isLoadingDetails ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading evidence...</span>
            </div>
          ) : evidenceData ? (
            <>
              {/* Trainer Feedback Section */}
              <div className="space-y-2">
                <Label htmlFor="trainer_feedback">Trainer Feedback</Label>
                <Textarea
                  id="trainer_feedback"
                  {...form.register("trainer_feedback")}
                  placeholder="Enter trainer feedback"
                  rows={4}
                  className="resize-none"
                />
              </div>

              {/* Unit Mappings Table */}
              <div className="space-y-2">
                <Label>Unit Mappings</Label>
                <EvidenceMappingsTable
                  control={form.control}
                  evidence={evidenceData}
                  courses={courses}
                  setValue={form.setValue}
                  trigger={form.trigger}
                />
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No evidence data available
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSubmitting || isLoadingDetails}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

