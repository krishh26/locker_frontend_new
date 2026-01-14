/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from 'zod'
import { COURSE_TYPES } from '../constants'

export const getEvidenceFormSchema = (userRole?: string, isEditMode?: boolean) => {
  const canEditDeclaration = ['Trainer', 'Admin', 'IQA'].includes(
    userRole || ''
  )

  // Task schema for Qualification courses (mappable level)
  const taskSchema = z.object({
    id: z.union([z.string(), z.number()]),
    title: z.string(),
    code: z.string().optional(),
    learnerMap: z.boolean().optional(),
    trainerMap: z.boolean().optional(),
    signedOff: z.boolean().optional(),
    comment: z.string().optional(),
  })

  // Unit schema for Qualification courses (contains tasks)
  const qualificationUnitSchema = z.object({
    id: z.union([z.string(), z.number()]),
    title: z.string(),
    code: z.string().optional(),
    tasks: z.array(taskSchema).optional(),
  })

  // Module schema for Qualification courses (contains units)
  const moduleSchema = z.object({
    id: z.union([z.string(), z.number()]),
    title: z.string(),
    code: z.string().optional(),
    units: z.array(qualificationUnitSchema).optional(),
  })

  // SubUnit schema for Standard courses
  const subUnitSchema = z.object({
    id: z.union([z.string(), z.number()]),
    title: z.string(),
    learnerMap: z.boolean().optional(),
    trainerMap: z.boolean().optional(),
    signedOff: z.boolean().optional(),
    comment: z.string().optional(),
    topics: z.array(taskSchema).optional(),
  })

  // Unit schema for Standard courses
  const standardUnitSchema = z.object({
    id: z.union([z.string(), z.number()]),
    title: z.string(),
    type: z.string().optional(),
    code: z.string().optional(),
    course_id: z.union([z.string(), z.number()]).optional(),
    learnerMap: z.boolean().optional(),
    trainerMap: z.boolean().optional(),
    signedOff: z.boolean().optional(),
    comment: z.string().optional(),
    subUnit: z.array(subUnitSchema).optional(),
  })

  // Union schema for units (can be StandardUnit or Qualification structure)
  const unitSchema = z.union([
    standardUnitSchema,
    z.object({
      id: z.union([z.string(), z.number()]).optional(),
      course_id: z.union([z.string(), z.number()]).optional(),
      modules: z.array(moduleSchema).optional(),
    }),
  ])

  return z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    trainer_feedback: z.string().optional(),
    points_for_improvement: z.string().optional(),
    audio: z.any().optional(),
    file: isEditMode
      ? z.any().optional()
      : z
          .any()
          .refine(
            (val) => {
              // In create mode, file must be present (either File from upload or File from document creation)
              // Check if it's a File instance or has a url property (for existing files)
              if (val === null || val === undefined) {
                return false
              }
              // Check if it's a File instance
              if (val instanceof File) {
                return true
              }
              // Check if it has a url property (for existing files in edit mode edge cases)
              if (val && typeof val === 'object' && 'url' in val) {
                return true
              }
              return false
            },
            {
              message: 'Please upload a file or create a document. You must either upload a file or create a document before submitting.',
            }
          ),
    file_key: z.string().optional(),
    learner_comments: z.string().optional(),
    evidence_time_log: z.boolean(),
    session: z.string().optional(),
    grade: z.string().optional(),
    declaration: canEditDeclaration
      ? z.boolean().optional()
      : z.boolean().refine((val) => val === true, {
          message: 'You must accept the declaration',
        }),
    assessment_method: z
      .array(z.string())
      .min(1, 'Please select at least one assessment method'),
    selectedCourses: z
      .array(z.any())
      .min(1, 'Please select at least one course'),
    courseSelectedTypes: z
      .record(z.string(), z.array(z.string()))
      .optional(),
    units: z
      .array(unitSchema),
    signatures: z
      .array(
        z.object({
          role: z.string(),
          name: z.string(),
          signed: z.boolean(),
          es: z.string().optional(),
          date: z.string().optional(),
          signature_required: z.boolean(),
        })
      )
      .optional(),
  })
  .refine(
    (data) => {
      // Validate courseSelectedTypes for Standard courses
      const selectedCourses = data.selectedCourses || []
      const courseSelectedTypes = data.courseSelectedTypes || {}
      const standardCourses = selectedCourses.filter(
        (c: any) => c.course_core_type === COURSE_TYPES.STANDARD
      )

      // Check each Standard course has at least one type selected
      // Match the form validation logic: check if it's an array and has at least one element
      for (const course of standardCourses) {
        const selectedTypes = courseSelectedTypes[course.course_id] || []
        if (!Array.isArray(selectedTypes) || selectedTypes.length === 0) {
          return false
        }
      }
      return true
    },
    {
      message:
        'Please select at least one type (Knowledge, Behaviour, or Skills) for each Standard course',
      path: ['courseSelectedTypes'], // This will attach the error to the courseSelectedTypes field
    }
  )
  .refine(
    (data) => {
      // Validate that for each selected type in Standard courses, at least one learnerMap is checked
      const selectedCourses = data.selectedCourses || []
      const courseSelectedTypes = data.courseSelectedTypes || {}
      const units = data.units || []
      const standardCourses = selectedCourses.filter(
        (c: any) => c.course_core_type === COURSE_TYPES.STANDARD
      )

      // Check each Standard course
      for (const course of standardCourses) {
        const courseId = course.course_id
        const selectedTypes = courseSelectedTypes[courseId] || []
        
        // Skip if no types selected (courseSelectedTypes validation will handle that)
        if (selectedTypes.length === 0) {
          continue
        }

        // Find units for this course
        const courseUnits = units.filter(
          (u: any) => u.course_id === courseId
        )

        // Check each selected type individually
        for (const selectedType of selectedTypes) {
          // Find units of this type for this course
          const unitsOfType = courseUnits.filter(
            (u: any) => String(u.type) === String(selectedType)
          )

          // Check if at least one unit or subUnit has learnerMap for this type
          const hasLearnerMapForType = unitsOfType.some((unit: any) => {
            // Check subUnits first
            if (unit.subUnit && unit.subUnit.length > 0) {
              return unit.subUnit.some(
                (sub: any) => sub.learnerMap === true
              )
            }
            // Check unit itself
            return unit.learnerMap === true
          })

          if (!hasLearnerMapForType) {
            return false
          }
        }
      }
      return true
    },
    {
      message:
        'For Standard courses, at least one Learner Map must be checked for each selected type (Knowledge, Behaviour, or Skills)',
      path: ['units'], // This will attach the error to the units field
    }
  )
  .refine(
    (data) => {
      // Validate that for Qualification courses, at least one unit is selected and each unit has at least one learnerMap
      const selectedCourses = data.selectedCourses || []
      const units = data.units || []
      const qualificationCourses = selectedCourses.filter(
        (c: any) => c.course_core_type === COURSE_TYPES.QUALIFICATION
      )

      // Check each Qualification course
      for (const course of qualificationCourses) {
        const courseId = course.course_id
        const courseUnits = units.filter(
          (u: any) => u.course_id === courseId
        )

        // Check if at least one unit is selected for this course
        if (courseUnits.length === 0) {
          return false
        }

        // Check that each selected unit has at least one topic with learnerMap
        // Structure: unit => subUnit => topics
        for (const unit of courseUnits) {
          let hasTopicLearnerMap = false

          // Check if unit has subUnit property (Standard/Qualification structure)
          if ('subUnit' in unit && unit.subUnit && Array.isArray(unit.subUnit)) {
            hasTopicLearnerMap = unit.subUnit.some((subUnit: any) => {
              if (subUnit.topics && Array.isArray(subUnit.topics)) {
                return subUnit.topics.some((topic: any) => topic.learnerMap === true)
              }
              return false
            })
          }

          // If this unit has no learnerMap checked, validation fails
          if (!hasTopicLearnerMap) {
            return false
          }
        }
      }
      return true
    },
    {
      message:
        'For Qualification courses, at least one unit must be selected and at least one Learner Map must be checked for each selected unit',
      path: ['units'], // This will attach the error to the units field
    }
  )
}
