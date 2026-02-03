/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * CourseForm Component
 * 
 * Main form component for creating and editing courses
 * Supports multi-step forms for Qualification/Standard (2 steps) and Gateway (1 step)
 * Step 0: Validates and saves course details (creates in new mode, updates in edit mode)
 * Step 1: Validates and updates units/modules
 */

"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "@/i18n/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import type { CourseFormData, CourseCoreType } from "@/store/api/course/types";
import {
  useCreateCourseMutation,
  useUpdateCourseMutation,
  useGetCourseQuery,
  useGetGatewayCoursesQuery,
} from "@/store/api/course/courseApi";
import { getStepValidationSchema } from "../schemas/course-validation";
import { CourseDetailsForm } from "./course-details-form";
import { CourseUnitsModulesStep } from "./course-units-modules-step";
import { GatewayQuestionsStep } from "./gateway-components/gateway-questions-step";
import { COURSE_TYPE_CONFIG, type GatewayCourse } from "../constants/course-constants";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { removeEmptyStrings } from "../constants/course-constants";

interface CourseFormProps {
  courseType: CourseCoreType;
  courseId?: string | null;
  initialStep?: number;
}

const getSteps = (courseType: CourseCoreType) => {
  if (courseType === "Gateway") {
    return ["Course Details"];
  }
  return ["Course Details", "Units/Modules"];
};

function getInitialStep(courseType: CourseCoreType, initialStep?: number): number {
  if (courseType === "Gateway") return 0;
  return initialStep === 1 ? 1 : 0;
}

export function CourseForm({ courseType, courseId, initialStep }: CourseFormProps) {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(() =>
    getInitialStep(courseType, initialStep)
  );
  const [currentCourseId, setCurrentCourseId] = useState<string | null>(courseId || null);
  const isEditMode = !!currentCourseId;
  const courseIdNumber = currentCourseId ? Number(currentCourseId) : undefined;

  // API hooks
  const { data: courseData, isLoading: isLoadingCourse } = useGetCourseQuery(
    courseIdNumber!,
    { skip: !isEditMode || !courseIdNumber }
  );
  const [createCourse, { isLoading: isCreating }] = useCreateCourseMutation();
  const [updateCourse, { isLoading: isUpdating }] = useUpdateCourseMutation();
  const { data: gatewayCoursesData } = useGetGatewayCoursesQuery();

  // Transform gateway courses data to match GatewayCourse interface
  const gatewayCourses: GatewayCourse[] = gatewayCoursesData?.data?.map((course) => ({
    course_id: course.course_id,
    course_name: course.course_name,
    course_code: course.course_code,
    active: course.active || false,
  })) || [];

  const isLoading = isLoadingCourse || isCreating || isUpdating;

  // Default form values
  const defaultFormValues: CourseFormData = useMemo(
    () => {
      // For Qualification courses, add default blank unit with one learning outcome and one assessment criteria
      const defaultUnits = courseType === "Qualification" 
        ? [
            {
              id: Date.now(),
              title: "",
              mandatory: true,
              unit_ref: "",
              level: null,
              glh: null,
              credit_value: null,
              subUnit: [
                {
                  id: Date.now() + 1,
                  code: "",
                  title: "",
                  type: "to-do" as const,
                  showOrder: 1,
                  timesMet: 0,
                  topics: [
                    {
                      id: Date.now() + 2,
                      title: "",
                      description: "",
                    },
                  ],
                },
              ],
            },
          ]
        : [];

      return {
        course_name: "",
        course_code: "",
        course_core_type: courseType,
        level: "",
        sector: "",
        guided_learning_hours: "",
        total_credits: "",
        duration_period: "",
        duration_value: null,
        operational_start_date: "",
        recommended_minimum_age: "",
        overall_grading_type: "",
        brand_guidelines: "",
        course_type: courseType !== "Gateway" ? "" : "",
        active: true,
        included_in_off_the_job: true,
        awarding_body: "No Awarding Body",
        assigned_gateway_id: null,
        assigned_gateway_name: "",
        questions: [],
        assigned_standards: [],
        units: defaultUnits,
      };
    },
    [courseType]
  );

  // Get step-aware validation schema - dynamically changes based on active step
  const stepValidationSchema = useMemo(
    () => getStepValidationSchema(courseType, activeStep),
    [courseType, activeStep]
  );

  // Initialize React Hook Form with dynamic resolver
  const form = useForm<CourseFormData>({
    resolver: zodResolver(stepValidationSchema as any) as any,
    defaultValues: defaultFormValues,
  });

  const {
    control,
    formState: { errors, isDirty },
    reset,
    watch,
    setValue,
    trigger,
    clearErrors,
  } = form;

  const courseCoreType = watch("course_core_type") || courseType;
  const courseTypeConfig = COURSE_TYPE_CONFIG[courseCoreType];

  // Load course data for edit mode
  useEffect(() => {
    if (isEditMode && courseData?.data) {
      const data = courseData.data as any;
      const apiCourseCoreType = (data.course_core_type || courseType) as CourseCoreType;

      setValue("course_core_type", apiCourseCoreType, { shouldValidate: false });

      const formData: CourseFormData = {
        course_name: data.course_name || "",
        course_code: data.course_code || "",
        course_type: data.course_type || "",
        course_core_type: apiCourseCoreType,
        level: data.level || "",
        sector: data.sector || "",
        qualification_type: data.qualification_type || "",
        qualification_status: data.qualification_status || "",
        guided_learning_hours: data.guided_learning_hours || "",
        total_credits: data.total_credits || "",
        duration_period: data.duration_period || "",
        duration_value: data.duration_value ? Number(data.duration_value) : 0,
        operational_start_date: data.operational_start_date || "",
        recommended_minimum_age: data.recommended_minimum_age || "",
        overall_grading_type: data.overall_grading_type || "",
        brand_guidelines: data.brand_guidelines || "",
        active: typeof data.active === "boolean"
          ? data.active
          : ((data.active as any) === "Yes" || (data.active as any) === true),
        included_in_off_the_job: typeof data.included_in_off_the_job === "boolean"
          ? data.included_in_off_the_job
          : (data.included_in_off_the_job === "Yes" || data.included_in_off_the_job === true),
        awarding_body: data.awarding_body || "No Awarding Body",
        assigned_gateway_id: data.assigned_gateway_id || null,
        assigned_gateway_name: data.assigned_gateway_name || "",
        questions: data.questions || [],
        assigned_standards: data.assigned_standards || [],
        units: data.units || [],
      };

      setTimeout(() => {
        reset(formData);
      }, 0);
    }
  }, [isEditMode, courseData, courseType, reset, setValue]);

  // Helper function to get step 0 field names for validation
  const getStep0FieldNames = (): (keyof CourseFormData)[] => {
    const baseFields: (keyof CourseFormData)[] = [
      "course_name",
      "course_code",
      "course_core_type",
      "level",
    ];

    if (courseCoreType === "Qualification") {
      return [
        ...baseFields,
        "course_type",
        "brand_guidelines",
        "total_credits",
        "guided_learning_hours",
        "operational_start_date",
        "sector",
        "recommended_minimum_age",
        "overall_grading_type",
        "awarding_body",
        "active",
        "included_in_off_the_job",
      ];
    } else if (courseCoreType === "Standard") {
      return [
        ...baseFields,
        "duration_period",
        "duration_value",
        "two_page_standard_link",
        "assessment_plan_link",
        "assigned_gateway_id",
        "guided_learning_hours",
        "operational_start_date",
        "sector",
        "recommended_minimum_age",
        "overall_grading_type",
        "awarding_body",
        "active",
        "included_in_off_the_job",
      ];
    } else {
      // Gateway
      return [
        ...baseFields,
        "guided_learning_hours",
        "operational_start_date",
        "sector",
        "recommended_minimum_age",
        "overall_grading_type",
        "awarding_body",
        "active",
        "included_in_off_the_job",
      ];
    }
  };

  // Helper function to get step 1 field names for validation
  const getStep1FieldNames = (): (keyof CourseFormData)[] => {
    if (courseCoreType === "Gateway") {
      return ["questions", "assigned_standards"];
    }
    return ["units"];
  };

  // Handle step navigation with step-aware validation and save/update
  const handleNext = async () => {
    // Gateway courses: single step, submit directly
    if (courseCoreType === "Gateway") {
      const step0Fields = getStep0FieldNames();
      const isValid = await trigger([...step0Fields, "questions", "assigned_standards"] as any);
      if (!isValid) {
        toast.error("Please fill in all required fields.");
        return;
      }

      try {
        const formData = watch();
        const data: CourseFormData = {
          ...formData,
          course_core_type: courseCoreType,
        };

        const finalStep0Data = removeEmptyStrings(data);

        if (isEditMode && courseIdNumber) {
          const result = await updateCourse({
            id: courseIdNumber,
            data: finalStep0Data,
          }).unwrap();
          if (result.status) {
            toast.success("Course updated successfully!");
            router.push("/course-builder");
          }
        } else {
          const result = await createCourse(finalStep0Data).unwrap();
          if (result.status) {
            toast.success("Course created successfully!");
            router.push("/course-builder");
          }
        }
      } catch (error: any) {
        const errorMessage =
          error?.data?.error || error?.data?.message || "Failed to save course. Please try again.";
        toast.error(errorMessage);
      }
      return;
    }

    if (activeStep === 0) {
      // Step 0: Validate only step 0 fields, then save/update course
      const step0Fields = getStep0FieldNames();
      const isValid = await trigger(step0Fields as any);
      if (!isValid) {
        return;
      }

      try {
        const formData = watch();
        const data: CourseFormData = {
          ...formData,
          course_core_type: courseCoreType,
        };

        // Remove step 1 fields for step 0 submission
        const step0Data = { ...data };
        delete (step0Data as any).units;
        delete (step0Data as any).questions;
        delete (step0Data as any).assigned_standards;
        const finalStep0Data = removeEmptyStrings(step0Data);

        if (isEditMode && courseIdNumber) {
          // Update existing course only if form is dirty (fields have changed)
          if (isDirty) {
            const result = await updateCourse({
              id: courseIdNumber,
              data: finalStep0Data,
            }).unwrap();

            if (result.status) {
              toast.success("Course details saved successfully!");
              clearErrors(); // Clear all errors before moving to next step
              setActiveStep((prev) => prev + 1);
              queueMicrotask(() => {
                if (currentCourseId) {
                  router.replace(
                    `/course-builder/course?id=${currentCourseId}&step=1`
                  );
                }
              });
            }
          } else {
            // No changes, just move to next step
            clearErrors();
            setActiveStep((prev) => prev + 1);
            queueMicrotask(() => {
              if (currentCourseId) {
                router.replace(
                  `/course-builder/course?id=${currentCourseId}&step=1`
                );
              }
            });
          }
        } else {
          // Create new course
          const result = await createCourse(finalStep0Data).unwrap();

          if (result.status && result.data?.course_id) {
            const newCourseId = String(result.data.course_id);
            setCurrentCourseId(newCourseId);
            clearErrors(); // Clear all errors before moving to next step
            setActiveStep((prev) => prev + 1);
            toast.success("Course created successfully!");
            // Defer URL update so React commits state first; avoids step reset on re-render
            queueMicrotask(() => {
              router.replace(`/course-builder/course?id=${newCourseId}&step=1`);
            });
          }
        }
      } catch (error: any) {
        const errorMessage =
          error?.data?.error || error?.data?.message || "Failed to save course. Please try again.";
        toast.error(errorMessage);
      }
    } else {
      // Step 1: Validate only step 1 fields, then update course
      const step1Fields = getStep1FieldNames();
      const isValid = await trigger(step1Fields as any);
      if (!isValid) {
        toast.error("Please fill in all required fields for this step.");
        return;
      }

      if (!currentCourseId) {
        toast.error("Course ID not found. Please go back and save course details first.");
        return;
      }

      try {
        const formData = watch();
        const data: CourseFormData = {
          ...formData,
          course_core_type: courseCoreType,
        };

        const finalStep1Data = removeEmptyStrings(data);

        const result = await updateCourse({
          id: Number(currentCourseId),
          data: finalStep1Data,
        }).unwrap();

        if (result.status) {
          toast.success("Course updated successfully!");
          router.push("/course-builder");
        }
      } catch (error: any) {
        const errorMessage =
          error?.data?.error || error?.data?.message || "Failed to update course. Please try again.";
        toast.error(errorMessage);
      }
    }
  };

  const handleBack = () => {
    // Clear errors when going back (no validation)
    clearErrors();
    setActiveStep((prev) => Math.max(0, prev - 1));
    // Keep URL in sync so step survives remount
    const nextStep = Math.max(0, activeStep - 1);
    queueMicrotask(() => {
      const base = "/course-builder/course";
      if (currentCourseId) {
        router.replace(`${base}?id=${currentCourseId}&step=${nextStep}`);
      } else {
        router.replace(`${base}?step=${nextStep}`);
      }
    });
  };

  // Render step content
  const renderStepContent = () => {
    if (courseCoreType === "Gateway") {
      return (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Course Details</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Enter the basic information for your gateway course
            </p>
          </div>
          <GatewayQuestionsStep
            courseId={currentCourseId}
            courseCoreType={courseCoreType}
            control={control}
            setValue={(name: string, value: any) => setValue(name as any, value)}
            errors={errors}
            trigger={trigger}
          />
        </div>
      );
    }

    switch (activeStep) {
      case 0:
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Course Details</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Enter the basic information for your {courseCoreType.toLowerCase()} course
              </p>
            </div>
            <CourseDetailsForm
              control={control}
              errors={errors}
              courseCoreType={courseCoreType}
              setValue={(name: any, value: any) => setValue(name, value)}
              gatewayCourses={gatewayCourses}
            />
          </div>
        );
      case 1:
        return (
            <CourseUnitsModulesStep
              courseId={currentCourseId}
              courseCoreType={courseCoreType}
              control={control}
              setValue={((name: string, value: any) => setValue(name as any, value)) as any}
              errors={errors}
            />
        );
      default:
        return null;
    }
  };

  const steps = getSteps(courseCoreType);

  if (isLoadingCourse) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Course Type Badge */}
      <div className="flex items-center justify-end">
        <Badge variant="outline" className="px-3 py-1.5">
          Course Type: {courseTypeConfig.label}
        </Badge>
      </div>

      {/* Stepper */}
      {steps.length > 1 && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors",
                      index === activeStep
                        ? "border-primary bg-primary text-primary-foreground"
                        : index < activeStep
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted bg-muted text-muted-foreground"
                    )}
                  >
                    {index < activeStep ? (
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span
                    className={cn(
                      "mt-2 text-xs font-medium",
                      index === activeStep
                        ? "text-primary"
                        : index < activeStep
                        ? "text-primary"
                        : "text-muted-foreground"
                    )}
                  >
                    {step}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "flex-1 h-0.5 mx-4",
                      index < activeStep ? "bg-primary" : "bg-muted"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Step Content */}
      <Card className="p-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleNext();
          }}
        >
          {renderStepContent()}

          {/* Action Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={activeStep === 0 || isLoading || courseCoreType === "Gateway"}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  {activeStep === steps.length - 1 || courseCoreType === "Gateway"
                    ? "Submit"
                    : "Next"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
