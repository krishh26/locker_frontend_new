/**
 * CourseDetailsForm Component
 * 
 * Course Details form component using React Hook Form
 * Handles form fields for all course types (Qualification, Standard, Gateway)
 */

"use client";

import { Controller, Control, FieldErrors, UseFormSetValue } from "react-hook-form";
import type { CourseFormData, CourseCoreType } from "@/store/api/course/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  COURSE_TYPES,
  COURSE_LEVELS,
  AWARDING_BODY_OPTIONS,
  DURATION_PERIODS,
  YES_NO_OPTIONS_STRINGS,
  type GatewayCourse,
} from "../constants/course-constants";
import { cn } from "@/lib/utils";

interface CourseDetailsFormProps {
  control: Control<CourseFormData>;
  errors: FieldErrors<CourseFormData>;
  courseCoreType: CourseCoreType;
  gatewayCourses?: GatewayCourse[];
  setValue?: UseFormSetValue<CourseFormData>;
}

export function CourseDetailsForm({
  control,
  errors,
  courseCoreType,
  gatewayCourses = [],
  setValue,
}: CourseDetailsFormProps) {
  return (
    <div className="space-y-6">
      {/* Row 1: Course Name, Course Code, Course Level */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="course_name">
            Course Name <span className="text-destructive">*</span>
          </Label>
          <Controller
            name="course_name"
            control={control}
            render={({ field }) => (
              <div>
                <Input
                  {...field}
                  id="course_name"
                  placeholder="Enter Course Name"
                  className={cn(errors.course_name && "border-destructive")}
                />
                {errors.course_name && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.course_name.message}
                  </p>
                )}
              </div>
            )}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="course_code">
            Course Code <span className="text-destructive">*</span>
          </Label>
          <Controller
            name="course_code"
            control={control}
            render={({ field }) => (
              <div>
                <Input
                  {...field}
                  id="course_code"
                  placeholder="Enter Course Code"
                  className={cn(errors.course_code && "border-destructive")}
                />
                {errors.course_code && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.course_code.message}
                  </p>
                )}
              </div>
            )}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="level">
            Course Level <span className="text-destructive">*</span>
          </Label>
          <Controller
            name="level"
            control={control}
            render={({ field }) => (
              <div>
                <Select
                  value={field.value || ""}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger
                    id="level"
                    className={cn("w-full", errors.level && "border-destructive")}
                  >
                    <SelectValue placeholder="Select Course Level" />
                  </SelectTrigger>
                  <SelectContent>
                    {COURSE_LEVELS.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.level && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.level.message}
                  </p>
                )}
              </div>
            )}
          />
        </div>
      </div>

      {/* Row 2: Course Guidance (Qualification only) */}
      {courseCoreType === "Qualification" && (
        <div className="space-y-2">
          <Label htmlFor="brand_guidelines">
            Course Guidance <span className="text-destructive">*</span>
          </Label>
          <Controller
            name="brand_guidelines"
            control={control}
            render={({ field }) => (
              <div>
                <Textarea
                  {...field}
                  id="brand_guidelines"
                  placeholder="Enter Course Guidance"
                  rows={4}
                  className={cn(errors.brand_guidelines && "border-destructive")}
                />
                {errors.brand_guidelines && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.brand_guidelines.message}
                  </p>
                )}
              </div>
            )}
          />
        </div>
      )}

      {/* Qualification-specific fields */}
      {courseCoreType === "Qualification" && (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="course_type">
                Course Type <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="course_type"
                control={control}
                render={({ field }) => (
                  <div>
                    <Select
                      value={field.value || ""}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger
                        id="course_type"
                        className={cn("w-full", errors.course_type && "border-destructive")}
                      >
                        <SelectValue placeholder="Select Course Type" />
                      </SelectTrigger>
                      <SelectContent>
                        {COURSE_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.course_type && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.course_type.message}
                      </p>
                    )}
                  </div>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="operational_start_date">Operational Start Date</Label>
              <Controller
                name="operational_start_date"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="operational_start_date"
                    type="date"
                    className={cn(
                      errors.operational_start_date && "border-destructive"
                    )}
                  />
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sector">Sector</Label>
              <Controller
                name="sector"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="sector"
                    placeholder="Enter Sector"
                    className={cn(errors.sector && "border-destructive")}
                  />
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="total_credits">Total Credits</Label>
              <Controller
                name="total_credits"
                control={control}
                render={({ field }) => (
                  <div>
                    <Input
                      {...field}
                      id="total_credits"
                      type="number"
                      placeholder="Enter Total Credits"
                      className={cn(errors.total_credits && "border-destructive")}
                    />
                    {errors.total_credits && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.total_credits.message}
                      </p>
                    )}
                  </div>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="guided_learning_hours">Guided Learning Hours</Label>
              <Controller
                name="guided_learning_hours"
                control={control}
                render={({ field }) => (
                  <div>
                    <Input
                      {...field}
                      id="guided_learning_hours"
                      type="number"
                      placeholder="Enter Guided Learning Hours"
                      className={cn(
                        errors.guided_learning_hours && "border-destructive"
                      )}
                    />
                    {errors.guided_learning_hours && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.guided_learning_hours.message}
                      </p>
                    )}
                  </div>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recommended_minimum_age">Recommended Minimum Age</Label>
              <Controller
                name="recommended_minimum_age"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="recommended_minimum_age"
                    type="number"
                    placeholder="Enter Recommended Minimum Age"
                    className={cn(
                      errors.recommended_minimum_age && "border-destructive"
                    )}
                  />
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="overall_grading_type">Overall Grading Type</Label>
              <Controller
                name="overall_grading_type"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="overall_grading_type"
                    placeholder="Enter Overall Grading Type"
                    className={cn(
                      errors.overall_grading_type && "border-destructive"
                    )}
                  />
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="awarding_body">Awarding Body</Label>
              <Controller
                name="awarding_body"
                control={control}
                render={({ field }) => (
                  <div className="w-full">
                    <Select
                      value={field.value || ""}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger
                        id="awarding_body"
                        className={cn("w-full", errors.awarding_body && "border-destructive")}
                      >
                        <SelectValue placeholder="Select Awarding Body" />
                      </SelectTrigger>
                      <SelectContent>
                        {AWARDING_BODY_OPTIONS.map((body) => (
                          <SelectItem key={body} value={body}>
                            {body}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.awarding_body && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.awarding_body.message}
                      </p>
                    )}
                  </div>
                )}
              />
            </div>
          </div>
        </>
      )}

      {/* Standard-specific fields */}
      {courseCoreType === "Standard" && (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="operational_start_date">Expiration Date</Label>
              <Controller
                name="operational_start_date"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="operational_start_date"
                    type="date"
                    className={cn(
                      errors.operational_start_date && "border-destructive"
                    )}
                  />
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="active">Active</Label>
              <Controller
                name="active"
                control={control}
                render={({ field }) => (
                  <div className="w-full">
                    <Select
                      value={
                        field.value === true || field.value === undefined
                          ? "Yes"
                          : "No"
                      }
                      onValueChange={(value) =>
                        field.onChange(value === "Yes")
                      }
                    >
                    <SelectTrigger
                      id="active"
                      className={cn(
                        "w-full",
                        errors.active && "border-destructive"
                      )}
                    >
                        <SelectValue placeholder="Select Active Status" />
                      </SelectTrigger>
                      <SelectContent>
                        {YES_NO_OPTIONS_STRINGS.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.active && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.active.message}
                      </p>
                    )}
                  </div>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="included_in_off_the_job">
                Included in Off The Job Calculation
              </Label>
              <Controller
                name="included_in_off_the_job"
                control={control}
                render={({ field }) => (
                  <div className="w-full">
                    <Select
                      value={
                        field.value === true || field.value === undefined
                          ? "Yes"
                          : "No"
                      }
                      onValueChange={(value) =>
                        field.onChange(value === "Yes")
                      }
                    >
                      <SelectTrigger
                        id="included_in_off_the_job"
                        className={cn(
                          "w-full",
                          errors.included_in_off_the_job && "border-destructive"
                        )}
                      >
                        <SelectValue placeholder="Select Option" />
                      </SelectTrigger>
                      <SelectContent>
                        {YES_NO_OPTIONS_STRINGS.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.included_in_off_the_job && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.included_in_off_the_job.message}
                      </p>
                    )}
                  </div>
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="duration_period">
                Duration of Course <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="duration_period"
                control={control}
                render={({ field }) => (
                  <div>
                    <Select
                      value={field.value || ""}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger
                        id="duration_period"
                        className={cn("w-full", errors.duration_period && "border-destructive")}
                      >
                        <SelectValue placeholder="Select Duration Period" />
                      </SelectTrigger>
                      <SelectContent>
                        {DURATION_PERIODS.map((period) => (
                          <SelectItem key={period} value={period}>
                            {period}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.duration_period && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.duration_period.message}
                      </p>
                    )}
                  </div>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration_value">Duration Value</Label>
              <Controller
                name="duration_value"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="duration_value"
                    type="number"
                    placeholder="Enter duration value"
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(e.target.value ? Number(e.target.value) : null)
                    }
                    className={cn(errors.duration_value && "border-destructive")}
                  />
                )}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="two_page_standard_link">Two Page Standard Link</Label>
            <Controller
              name="two_page_standard_link"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id="two_page_standard_link"
                  type="url"
                  placeholder="Enter Two Page Standard Link"
                  className={cn(
                    errors.two_page_standard_link && "border-destructive"
                  )}
                />
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="assessment_plan_link">Assessment Plan Link</Label>
            <Controller
              name="assessment_plan_link"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id="assessment_plan_link"
                  type="url"
                  placeholder="Enter Assessment Plan Link"
                  className={cn(errors.assessment_plan_link && "border-destructive")}
                />
              )}
            />
          </div>

          {gatewayCourses.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="assigned_gateway_id">Gateway Assigned</Label>
              <Controller
                name="assigned_gateway_id"
                control={control}
                render={({ field }) => {
                  const selectedGateway = gatewayCourses.find(
                    (gateway) =>
                      gateway.course_id ===
                      (typeof field.value === "string"
                        ? parseInt(field.value)
                        : field.value)
                  );

                  return (
                    <div className="w-full">
                      <Select
                        value={selectedGateway?.course_id.toString() || ""}
                        onValueChange={(value) => {
                          const gateway = gatewayCourses.find(
                            (g) => g.course_id.toString() === value
                          );
                          field.onChange(gateway ? gateway.course_id : null);
                          // Also update assigned_gateway_name
                          if (setValue && gateway) {
                            setValue(
                              "assigned_gateway_name",
                              gateway.course_name
                            );
                          } else if (setValue) {
                            setValue("assigned_gateway_name", "");
                          }
                        }}
                      >
                        <SelectTrigger
                          id="assigned_gateway_id"
                          className={cn(
                            "w-full",
                            errors.assigned_gateway_id && "border-destructive"
                          )}
                        >
                          <SelectValue placeholder="Select a Gateway Course..." />
                        </SelectTrigger>
                        <SelectContent>
                          {gatewayCourses.map((gateway) => (
                            <SelectItem
                              key={gateway.course_id}
                              value={gateway.course_id.toString()}
                            >
                              {gateway.course_name} ({gateway.course_code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.assigned_gateway_id && (
                        <p className="text-sm text-destructive mt-1">
                          {errors.assigned_gateway_id.message}
                        </p>
                      )}
                    </div>
                  );
                }}
              />
            </div>
          )}
        </>
      )}

      {/* Gateway-specific fields - minimal for now, questions handled in step component */}
      {courseCoreType === "Gateway" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Gateway course details. Questions will be managed in the next step.
          </p>
        </div>
      )}
    </div>
  );
}
