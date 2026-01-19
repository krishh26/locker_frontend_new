/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Course Validation Schemas
 * 
 * Zod validation schemas for CourseBuilder forms
 * Converted from Yup schemas
 */

import { z } from "zod";
import type { CourseCoreType } from "@/store/api/course/types";

// Helper schema for optional number string validation
const optionalNumberString = z
  .string()
  .optional()
  .refine(
    (val) => {
      if (!val || val.trim() === "") return true;
      const num = Number(val);
      return !isNaN(num) && num > 0;
    },
    { message: "Must be a valid positive number" }
  );

// Helper schema for optional non-negative number string
const optionalNonNegativeNumberString = z
  .string()
  .optional()
  .refine(
    (val) => {
      if (!val || val.trim() === "") return true;
      const num = Number(val);
      return !isNaN(num) && num >= 0;
    },
    { message: "Must be a valid number" }
  );

// Base validation schema for all course types (common fields)
const baseCourseSchema = z.object({
  // Required fields for all course types
  course_name: z.string().min(1, "Course name is required"),
  course_code: z.string().min(1, "Course code is required"),
  level: z.string().min(1, "Course level is required"),
  guided_learning_hours: optionalNumberString,
  
  // Optional fields for all course types
  operational_start_date: z.string().optional(),
  sector: z.string().optional(),
  recommended_minimum_age: optionalNumberString,
  overall_grading_type: z.string().optional(),
  
  // Default values (not in form but needed for API)
  active: z.boolean().default(true),
  included_in_off_the_job: z.boolean().default(true),
  awarding_body: z.string().default("No Awarding Body"),
  permitted_delivery_types: z.string().optional(),
  professional_certification: z.string().optional(),
  two_page_standard_link: z.string().optional(),
  assessment_plan_link: z.string().optional(),
  assigned_gateway_id: z.number().nullable().optional(),
  assigned_gateway_name: z.string().optional(),
  questions: z.array(z.any()).optional(),
  assigned_standards: z.array(z.number()).optional(),
});

// Qualification-specific validation
const qualificationSchema = baseCourseSchema.extend({
  course_core_type: z.literal("Qualification"),
  course_type: z.string().min(1, "Course type is required"),
  brand_guidelines: z.string().min(1, "Course guidance is required"),
  total_credits: optionalNonNegativeNumberString,
  awarding_body: z.string().optional(),
  qualification_type: z.string().optional(),
  qualification_status: z.string().optional(),
  // Units validation for Qualification - optional for step 0, validated on step 1 via form logic
  units: z
    .array(
      z.object({
        id: z.any().optional(),
        unit_ref: z.string().min(1, "Unit Ref is required"),
        title: z.string().min(1, "Unit Title is required"),
        description: z.string().optional(),
        mandatory: z.boolean().optional(),
        level: z.any().nullable().optional(),
        glh: z.number().nullable().optional(),
        credit_value: z.number().nullable().optional(),
        learning_outcomes: z.array(z.any()).optional(),
        // SubUnit (Assessment Criteria) validation for Qualification units
        subUnit: z
          .array(
            z.object({
              id: z.any().optional(),
              title: z.string().min(1, "Assessment Criteria Title is required"),
              type: z.enum(["to-do", "to-know", "req"]).default("to-do"),
              code: z.string().optional(),
              showOrder: z.number().optional(),
              timesMet: z.number().optional(),
              // Topics validation for Qualification SubUnits
              topics: z
                .array(
                  z.object({
                    id: z.number().optional(),
                    title: z.string().min(1, "Topic Title is required"),
                    type: z.string().optional(),
                    showOrder: z.number().optional(),
                    code: z.string().optional(),
                  })
                )
                .optional(),
            })
          )
          .optional(),
      })
    )
    .optional(),
});

// Standard-specific validation
const standardSchema = baseCourseSchema.extend({
  course_core_type: z.literal("Standard"),
  duration_period: z.string().min(1, "Duration period is required"),
  duration_value: z.number().nullable().optional(),
  two_page_standard_link: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("")),
  assessment_plan_link: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("")),
  assigned_gateway_id: z.number().nullable().optional(),
  // Units/Modules validation for Standard
  units: z
    .array(
      z.object({
        id: z.any().optional(),
        title: z.string().min(1, "Module Title is required"),
        unit_ref: z.string().min(1, "Module Reference Number is required"),
        description: z.string().optional(),
        active: z.boolean().optional(),
        delivery_method: z.string().optional(),
        otj_hours: z.string().optional(),
        delivery_lead: z.string().optional(),
        sort_order: z.string().optional(),
        learning_outcomes: z.array(z.any()).optional(),
        // SubUnit validation for Standard modules
        subUnit: z
          .array(
            z.object({
              id: z.any().optional(),
              title: z.string().min(1, "Topic Title is required"),
              type: z.enum(["Behaviour", "Knowledge", "Skills"]),
            })
          )
          .optional(),
      })
    )
    .optional(),
});

// Gateway-specific validation
const gatewaySchema = baseCourseSchema.extend({
  course_core_type: z.literal("Gateway"),
  course_type: z.string().optional(),
  level: z.string().optional(),
  // Questions validation for Gateway
  questions: z
    .array(
      z
        .object({
          id: z.any().optional(),
          question: z.string().min(1, "Question is required"),
          evidenceRequired: z.boolean().optional(),
          isDropdown: z.boolean().default(true),
          dropdownOptions: z.string().optional(),
        })
        .refine(
          (data) => {
            if (data.isDropdown === true && (!data.dropdownOptions || data.dropdownOptions.trim() === "")) {
              return false;
            }
            return true;
          },
          {
            message: "Dropdown options are required when Is Dropdown is Yes",
            path: ["dropdownOptions"],
          }
        )
    )
    .min(1, "At least one question is required"),
  // Assigned standards validation for Gateway - at least one required
  assigned_standards: z
    .array(z.number())
    .min(1, "At least one standard course must be assigned"),
});

// Step 0: Course Details validation (excludes units/modules/questions)
const getStep0Schema = (fullSchema: z.ZodObject<any>) => {
  // Get the shape of the schema to check which keys exist
  const shape = fullSchema.shape;
  const keysToOmit: string[] = [];
  
  // Only omit keys that actually exist in the schema
  if ('units' in shape) {
    keysToOmit.push('units');
  }
  if ('questions' in shape) {
    keysToOmit.push('questions');
  }
  
  // If there are keys to omit, omit them and extend
  if (keysToOmit.length > 0) {
    const omitObj = keysToOmit.reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {} as Record<string, true>);
    
    return fullSchema.omit(omitObj).extend({
      // Allow units/questions to be optional/undefined in step 0
      units: z.array(z.any()).optional(),
      questions: z.array(z.any()).optional(),
    });
  }
  
  // If no keys to omit, just extend with optional fields
  return fullSchema.extend({
    units: z.array(z.any()).optional(),
    questions: z.array(z.any()).optional(),
  });
};

// Step 1: Units/Modules validation (only validates units)
const getStep1UnitsSchema = z.object({
  units: z
    .array(
      z.object({
        id: z.any().optional(),
        unit_ref: z.string().min(1, "Unit Ref is required"),
        title: z.string().min(1, "Unit Title is required"),
        description: z.string().optional(),
        mandatory: z.boolean().optional(),
        level: z.any().nullable().optional(),
        glh: z.number().nullable().optional(),
        credit_value: z.number().nullable().optional(),
        learning_outcomes: z.array(z.any()).optional(),
        subUnit: z
          .array(
            z.object({
              id: z.any().optional(),
              title: z.string().min(1, "Assessment Criteria Title is required"),
              type: z.enum(["to-do", "to-know", "req"]).default("to-do"),
              code: z.string().optional(),
              showOrder: z.number().optional(),
              timesMet: z.number().optional(),
              topics: z
                .array(
                  z.object({
                    id: z.number().optional(),
                    title: z.string().min(1, "Topic Title is required"),
                    type: z.string().optional(),
                    showOrder: z.number().optional(),
                    code: z.string().optional(),
                  })
                )
                .optional(),
            })
          )
          .optional(),
      })
    )
    .min(1, "At least one unit is required"),
});

// Step 1: Standard Modules validation
const getStep1StandardSchema = z.object({
  units: z
    .array(
      z.object({
        id: z.any().optional(),
        title: z.string().min(1, "Module Title is required"),
        unit_ref: z.string().min(1, "Module Reference Number is required"),
        description: z.string().optional(),
        active: z.boolean().optional(),
        delivery_method: z.string().optional(),
        otj_hours: z.string().optional(),
        delivery_lead: z.string().optional(),
        sort_order: z.string().optional(),
        learning_outcomes: z.array(z.any()).optional(),
        subUnit: z
          .array(
            z.object({
              id: z.any().optional(),
              title: z.string().min(1, "Topic Title is required"),
              type: z.enum(["Behaviour", "Knowledge", "Skills"]),
            })
          )
          .optional(),
      })
    )
    .min(1, "At least one module is required"),
});

// Step 1: Gateway Questions validation
const getStep1GatewaySchema = z.object({
  questions: z
    .array(
      z
        .object({
          id: z.any().optional(),
          question: z.string().min(1, "Question is required"),
          evidenceRequired: z.boolean().optional(),
          isDropdown: z.boolean().default(true),
          dropdownOptions: z.string().optional(),
        })
        .refine(
          (data) => {
            if (data.isDropdown === true && (!data.dropdownOptions || data.dropdownOptions.trim() === "")) {
              return false;
            }
            return true;
          },
          {
            message: "Dropdown options are required when Is Dropdown is Yes",
            path: ["dropdownOptions"],
          }
        )
    )
    .min(1, "At least one question is required"),
  assigned_standards: z
    .array(z.number())
    .min(1, "At least one standard course must be assigned"),
});

/**
 * Get step-aware validation schema
 * Step 0: Validates only course details (no units/modules/questions)
 * Step 1: Validates only units/modules/questions based on course type
 */
export const getStepValidationSchema = (
  courseType: CourseCoreType,
  step: number
): z.ZodSchema<any> => {
  if (step === 0) {
    // Step 0: Course Details - exclude units/modules/questions
    switch (courseType) {
      case "Qualification":
        return getStep0Schema(qualificationSchema);
      case "Standard":
        return getStep0Schema(standardSchema);
      case "Gateway":
        return getStep0Schema(gatewaySchema);
      default:
        return getStep0Schema(baseCourseSchema);
    }
  } else {
    // Step 1: Units/Modules/Questions validation
    switch (courseType) {
      case "Qualification":
        return getStep1UnitsSchema;
      case "Standard":
        return getStep1StandardSchema;
      case "Gateway":
        return getStep1GatewaySchema;
      default:
        return z.object({}); // Empty schema for unknown types
    }
  }
};

// Dynamic schema based on course type (for backward compatibility)
export const getCourseValidationSchema = (courseType: CourseCoreType) => {
  switch (courseType) {
    case "Qualification":
      return qualificationSchema;
    case "Standard":
      return standardSchema;
    case "Gateway":
      return gatewaySchema;
    default:
      return baseCourseSchema;
  }
};

// Export individual schemas for flexibility
export { baseCourseSchema, qualificationSchema, standardSchema, gatewaySchema };
