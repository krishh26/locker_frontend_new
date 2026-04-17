/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "@/i18n/navigation";
import { useParams, useSearchParams } from "next/navigation";;
import { useForm } from "react-hook-form";
import { Loader2, FileText, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/dashboard/page-header";
import { toast } from "sonner";
import {
  useGetEvidenceDetailsQuery,
  useUpdateEvidenceMutation,
  useUpsertAssignmentMappingMutation,
  useUpdateMappingPCMutation,
  useDeleteAssignmentMappingMutation,
} from "@/store/api/evidence/evidenceApi";
import { useAppSelector } from "@/store/hooks";
import { selectCourses } from "@/store/slices/authSlice";
import { EvidenceMappingsTable } from "./evidence-mappings-table";
import { reconstructFormStateFromMappings } from "../../utils/reconstruct-form-state";
import { COURSE_TYPES } from "../constants";

export function EvidenceDetailsPageContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const evidenceId = params?.id as string;
  const courses = useAppSelector(selectCourses);
  const user = useAppSelector((state) => state.auth.user);
  const isTrainer = user?.role === "Trainer" || (user as { roles?: string[] })?.roles?.includes("Trainer");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Read selected units from URL params
  const hasSelectedUnitsParam = searchParams.has("selectedUnits");
  const selectedUnitsFromUrl = useMemo(() => {
    const selectedUnitsParam = searchParams.get("selectedUnits");
    if (!selectedUnitsParam) {
      return new Set<string | number>();
    }
    
    const unitIds = selectedUnitsParam.split(",").filter(Boolean);
    const selectedSet = new Set(unitIds.map((id) => {
      const numId = Number(id);
      return isNaN(numId) ? id : numId;
    }));
    return selectedSet;
  }, [searchParams]);

  // Fetch full evidence details
  const { data: evidenceDetails, isLoading: isLoadingDetails, refetch: refetchEvidenceDetails } =
    useGetEvidenceDetailsQuery(Number(evidenceId), {
      skip: !evidenceId,
    });

  const [updateEvidence] = useUpdateEvidenceMutation();
  const [upsertMapping] = useUpsertAssignmentMappingMutation();
  const [updateMappingPC] = useUpdateMappingPCMutation();
  const [deleteMapping] = useDeleteAssignmentMappingMutation();

  // Initialize form with evidence data
  const form = useForm({
    defaultValues: {
      trainer_feedback: "",
      units: [] as any[],
    },
  });

  // Reconstruct course/unit structure from mappings when evidence details are loaded
  useEffect(() => {
    if (evidenceDetails?.data && courses.length > 0) {
      const evidence = evidenceDetails.data;
      
      // Set trainer feedback
      form.setValue("trainer_feedback", evidence.trainer_feedback || "");

      // Reconstruct units from mappings
      let reconstructed;
      if (evidence.mappings && evidence.mappings.length > 0) {
        reconstructed = reconstructFormStateFromMappings(
          evidence.mappings,
          courses
        );
      } else {
        reconstructed = { selectedCourses: [], courseSelectedTypes: {}, units: [] };
      }
      console.log("🚀 ~ EvidenceDetailsPageContent ~ reconstructed:", reconstructed)

      // Include selected units from URL params (learner selections)
      // If there are no mappings, we need to find courses from courses array
      let coursesToProcess = reconstructed.selectedCourses;
      
      if (coursesToProcess.length === 0 && selectedUnitsFromUrl.size > 0) {
        // Find courses that contain the selected units
        coursesToProcess = courses.filter((courseItem: any) => {
          const course = courseItem.course || courseItem;
          if (!course || course.course_core_type === "Gateway") return false;
          
          // Check if any selected unit belongs to this course
          if (course.course_core_type === COURSE_TYPES.QUALIFICATION) {
            return course.units?.some((unit: any) => {
              return unit.subUnit?.some((subUnit: any) => {
                return subUnit.topics?.some((topic: any) => {
                  // Compare as strings to handle type mismatches
                  return topic.id && (selectedUnitsFromUrl.has(topic.id) || selectedUnitsFromUrl.has(String(topic.id)) || selectedUnitsFromUrl.has(Number(topic.id)));
                });
              });
            });
          } else {
            return course.units?.some((unit: any) => {
              if (unit.subUnit && Array.isArray(unit.subUnit) && unit.subUnit.length > 0) {
                return unit.subUnit.some((sub: any) => {
                  return sub.id && (selectedUnitsFromUrl.has(sub.id) || selectedUnitsFromUrl.has(String(sub.id)) || selectedUnitsFromUrl.has(Number(sub.id)));
                });
              } else {
                return unit.id && (selectedUnitsFromUrl.has(unit.id) || selectedUnitsFromUrl.has(String(unit.id)) || selectedUnitsFromUrl.has(Number(unit.id)));
              }
            });
          }
        }).map((courseItem: any) => {
          const course = courseItem.course || courseItem;
          return {
            course_id: course.course_id,
            course_name: course.course_name,
            course_code: course.course_code,
            course_core_type: course.course_core_type,
            units: course.units || [],
          };
        });
      }
      
      if (selectedUnitsFromUrl.size > 0 && coursesToProcess.length > 0) {
        // Preserve reconstructed backend mappings and apply URL selections as additive overlay.
        const updatedUnits = (reconstructed.units || []).map((unit: any) => ({
          ...unit,
          subUnit: Array.isArray(unit.subUnit)
            ? unit.subUnit.map((sub: any) => ({
                ...sub,
                topics: Array.isArray(sub.topics)
                  ? sub.topics.map((topic: any) => ({
                      ...topic,
                    }))
                  : sub.topics,
              }))
            : unit.subUnit,
        }));
        const isSelectedId = (id?: string | number) =>
          id != null &&
          (selectedUnitsFromUrl.has(id) ||
            selectedUnitsFromUrl.has(String(id)) ||
            selectedUnitsFromUrl.has(Number(id)));
        
        coursesToProcess.forEach((course) => {
          if (!course.units || course.units.length === 0) {
            return;
          }
          
          if (course.course_core_type === COURSE_TYPES.QUALIFICATION) {
            // For Qualification: selectedUnits contains topic IDs
            course.units.forEach((unit: any) => {
              // Check if this unit has any selected topics
              let hasSelectedTopics = false;
              
              if (unit.subUnit && Array.isArray(unit.subUnit)) {
                unit.subUnit.forEach((subUnit: any) => {
                    if (subUnit.topics && Array.isArray(subUnit.topics)) {
                      subUnit.topics.forEach((topic: any) => {
                        const isSelected = isSelectedId(topic.id);
                        if (isSelected) {
                          hasSelectedTopics = true;
                        }
                      });
                    }
                });
              }
              
              if (hasSelectedTopics) {
                // Find or create unit in updatedUnits
                let existingUnit = updatedUnits.find(
                  (u: any) => u.id === unit.id && u.course_id === course.course_id
                ) as any;
                
                if (!existingUnit) {
                  // Create new unit with selected topics
                  existingUnit = {
                    ...unit,
                    course_id: course.course_id,
                    subUnit: unit.subUnit ? unit.subUnit.map((subUnit: any) => ({
                      ...subUnit,
                      topics: subUnit.topics ? subUnit.topics.map((topic: any) => {
                        return {
                          ...topic,
                          learnerMap: isSelectedId(topic.id),
                          trainerMap: false,
                          signed_off: false,
                          comment: "",
                        };
                      }) : [],
                    })) : [],
                  };
                  updatedUnits.push(existingUnit);
                } else {
                  // Update existing unit to include selected topics
                  if (existingUnit.subUnit && Array.isArray(existingUnit.subUnit)) {
                    existingUnit.subUnit.forEach((subUnit: any) => {
                      if (subUnit.topics && Array.isArray(subUnit.topics)) {
                        subUnit.topics.forEach((topic: any) => {
                          // Compare as strings to handle type mismatches
                          const topicId = topic.id;
                          const isSelected = isSelectedId(topicId);
                          if (isSelected) {
                            // Only set learnerMap if not already set from mapping
                            if (topic.learnerMap === undefined || topic.learnerMap === false) {
                              topic.learnerMap = true;
                            }
                          }
                        });
                      }
                    });
                  }
                }
              }
            });
          } else {
            // For Standard courses: selectedUnits contains unit IDs or subUnit IDs
            course.units.forEach((unit: any) => {
              const unitSubUnits = Array.isArray(unit.subUnit) ? unit.subUnit : [];
              const selectedSubUnits = unitSubUnits.filter((sub: any) => isSelectedId(sub.id));
              const unitSelectedWithoutSubUnits =
                unitSubUnits.length === 0 && isSelectedId(unit.id);

              if (selectedSubUnits.length > 0) {
                // For subUnit-based standard structures, split by subUnit.type and merge into typed rows.
                const selectedByType = new Map<string, any[]>();
                selectedSubUnits.forEach((sub: any) => {
                  const selectedType = sub.type || unit.type || "";
                  if (!selectedByType.has(selectedType)) {
                    selectedByType.set(selectedType, []);
                  }
                  selectedByType.get(selectedType)!.push(sub);
                });

                selectedByType.forEach((typedSubUnits, selectedType) => {
                  let existingUnit = updatedUnits.find(
                    (u: any) =>
                      u.id === unit.id &&
                      u.course_id === course.course_id &&
                      String(u.type || "") === String(selectedType || "")
                  ) as any;

                  if (!existingUnit) {
                    existingUnit = {
                      ...unit,
                      course_id: course.course_id,
                      type: selectedType,
                      subUnit: typedSubUnits.map((sub: any) => ({
                        ...sub,
                        learnerMap: true,
                        trainerMap: sub.trainerMap ?? false,
                        signed_off: sub.signed_off ?? false,
                        comment: sub.comment ?? "",
                      })),
                    };
                    updatedUnits.push(existingUnit);
                  } else {
                    if (!Array.isArray(existingUnit.subUnit)) {
                      existingUnit.subUnit = [];
                    }
                    typedSubUnits.forEach((typedSub: any) => {
                      const existingSub = existingUnit.subUnit.find(
                        (sub: any) => String(sub.id) === String(typedSub.id)
                      );
                      if (existingSub) {
                        existingSub.learnerMap = true;
                      } else {
                        existingUnit.subUnit.push({
                          ...typedSub,
                          learnerMap: true,
                          trainerMap: typedSub.trainerMap ?? false,
                          signed_off: typedSub.signed_off ?? false,
                          comment: typedSub.comment ?? "",
                        });
                      }
                    });
                  }
                });
              } else if (unitSelectedWithoutSubUnits) {
                // Unit-level mapping (no subUnits)
                let existingUnit = updatedUnits.find(
                  (u: any) =>
                    u.id === unit.id &&
                    u.course_id === course.course_id &&
                    String(u.type || "") === String(unit.type || "")
                ) as any;

                if (!existingUnit) {
                  existingUnit = {
                    ...unit,
                    course_id: course.course_id,
                    type: unit.type,
                    learnerMap: true,
                    trainerMap: unit.trainerMap ?? false,
                    signed_off: unit.signed_off ?? false,
                    comment: unit.comment ?? "",
                  };
                  updatedUnits.push(existingUnit);
                } else if (!existingUnit.learnerMap) {
                  existingUnit.learnerMap = true;
                }
              }
            });
          }
        });
        
        form.setValue("units", updatedUnits);
        
        // Trigger form validation to ensure the form updates
        form.trigger("units");
      } else {
        form.setValue("units", reconstructed.units);
      }
    }
  }, [evidenceDetails, courses, form, selectedUnitsFromUrl, hasSelectedUnitsParam]);

  const handleSave = async () => {
    if (!evidenceDetails?.data) return;

    setIsSubmitting(true);
    try {
      const formData = form.getValues();
      const assignmentId = evidenceDetails.data.assignment_id;

      // Step 1: Update evidence with trainer feedback
      // await updateEvidence({
      //   id: assignmentId,
      //   data: {
      //     trainer_feedback: formData.trainer_feedback || undefined,
      //   },
      // }).unwrap();

      // Step 2: Track original mappings for deletion comparison
      const originalMappings = evidenceDetails.data.mappings || [];
      const originalMappingsMap = new Map<string, any>();
      originalMappings.forEach((mapping: any) => {
        const courseId = mapping.course_id || mapping.course?.course_id;
        const unitCode = mapping.unit_code;
        if (courseId && unitCode) {
          const key = `${courseId}-${unitCode}`;
          originalMappingsMap.set(key, mapping);
        }
      });

      // Step 3: Handle mappings for each course/unit/subunit/topic combination
      const desiredMappings: Map<string, any> = new Map();
      const formUnits = formData.units || [];
      const reconstructed = reconstructFormStateFromMappings(
        originalMappings,
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
                    signed_off: topic.signed_off ?? false,
                    mapping_id: topic.mapping_id, // For updates (if exists)
                  });
                }
              });
            }
          });
        } else if (hasSubUnit) {
          // For Standard courses: use unit-level key and merge selected subUnit IDs
          const key = `${courseId}-${unit.id}`;
          const existingMapping = desiredMappings.get(key);
          const currentSubUnitIds = Array.isArray(unit.subUnit)
            ? unit.subUnit
                .filter((sub: any) => sub?.learnerMap === true)
                .map((sub: any) => Number(sub.id))
            : [];
          const mergedSubUnitIds = Array.from(
            new Set<number>([
              ...((existingMapping?.sub_unit_ids as number[] | undefined) || []),
              ...currentSubUnitIds,
            ])
          );
          desiredMappings.set(key, {
            assignment_id: Number(assignmentId),
            course_id: Number(courseId),
            unit_code: String(unit.id),
            learnerMap: true,
            trainerMap: existingMapping?.trainerMap ?? unit.trainerMap ?? false,
            comment: existingMapping?.comment ?? unit.comment ?? "",
            signed_off: existingMapping?.signed_off ?? unit.signed_off ?? false,
            mapping_id: existingMapping?.mapping_id ?? unit.mapping_id,
            sub_unit_ids: mergedSubUnitIds,
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
              signed_off: unit.signed_off ?? false,
              mapping_id: unit.mapping_id, // For updates (if exists)
            });
          }
        }
      });

      // Step 4: Find mappings to delete (existed before but not in desiredMappings)
      const mappingsToDelete: any[] = [];
      originalMappingsMap.forEach((mapping, key) => {
        if (!desiredMappings.has(key)) {
          // This mapping existed before but is not in desired mappings - mark for deletion
          if (mapping.mapping_id) {
            mappingsToDelete.push(mapping);
          }
        }
      });

      // Step 5: Delete mappings that were unselected
      for (const mappingToDelete of mappingsToDelete) {
        try {
          await deleteMapping({ mapping_id: mappingToDelete.mapping_id }).unwrap();
        } catch (error) {
          console.warn("Failed to delete mapping:", error);
        }
      }

      // Step 6: Upsert mappings and update PC (learnerMap/trainerMap/signed_off/comment)
      const allMappingIds: number[] = []
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

          // Collect mapping ID
          if (mappingId) {
            allMappingIds.push(mappingId);
          }

          // Update PC (learnerMap/trainerMap/signed_off/comment) if mapping exists
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
                        signed_off: topic.signed_off ?? false,
                        comment: topic.comment ?? "",
                      };
                      break;
                    }
                  }
                }
              } else if (unit.subUnit) {
                // Standard: with unit-level key, resolve by unit ID
                const unitKey = `${courseId}-${unit.id}`;
                if (unitKey === key) {
                  pcData = {
                    learnerMap: unit.learnerMap ?? false,
                    trainerMap: unit.trainerMap ?? false,
                    signed_off: unit.signed_off ?? false,
                    comment: unit.comment ?? "",
                  };
                }
              } else {
                // Unit only
                const unitKey = `${courseId}-${unit.id}`;
                if (unitKey === key) {
                  pcData = {
                    learnerMap: unit.learnerMap ?? false,
                    trainerMap: unit.trainerMap ?? false,
                    signed_off: unit.signed_off ?? false,
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
      
      // Refetch evidence details to get updated mappings
      await refetchEvidenceDetails();
      
      // Refresh the page to ensure all data is updated
      router.refresh();
      
      // Navigate back to evidence library listing
      router.push("/evidence-library");
    } catch (error) {
      toast.error("Failed to update evidence. Please try again.");
      console.error("Error updating evidence:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const evidenceData = evidenceDetails?.data;

  return (
    <div className="space-y-6 px-4 lg:px-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/evidence-library")}
          className="-ml-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <PageHeader
          title={evidenceData?.title || "Evidence Details"}
          subtitle="View and edit evidence details and unit mappings"
          icon={FileText}
        />
      </div>

      {/* Content */}
      {isLoadingDetails ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading evidence...</span>
        </div>
      ) : evidenceData ? (
        <Card>
          <CardHeader>
            <CardTitle>Evidence Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Trainer Feedback Section */}
            <div className="space-y-2">
              <Label htmlFor="trainer_feedback">Trainer Feedback</Label>
              <Textarea
                id="trainer_feedback"
                {...form.register("trainer_feedback")}
                placeholder="Enter trainer feedback"
                rows={4}
                className="resize-none disabled:bg-slate-100 disabled:text-slate-600 disabled:cursor-not-allowed"
                disabled={!isTrainer}
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
                canEditLearnerFields={isTrainer}
                canEditTrainerFields={isTrainer}
              />
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              No evidence data available
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form Actions */}
      {evidenceData && (
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/evidence-library")}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={isSubmitting || isLoadingDetails}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

