/**
 * Assessment Methods Utility
 * 
 * Provides a list of assessment methods used in evidence forms.
 * Each method has a value (short code) and title (display name).
 */

export interface AssessmentMethod {
  value: string;
  title: string;
}

export const ASSESSMENT_METHODS: AssessmentMethod[] = [
  { value: 'Obs', title: 'Observations' },
  { value: 'PA', title: 'Practical assessment' },
  { value: 'ET', title: 'Exams and Tests' },
  { value: 'PD', title: 'Professional discussion' },
  { value: 'I', title: 'Interview' },
  { value: 'Q&A', title: 'Question and Answers' },
  { value: 'P', title: 'Project' },
  { value: 'RA', title: 'Reflective Account' },
  { value: 'WT', title: 'Witness Testimony' },
  { value: 'PE', title: 'Product Evidence' },
  { value: 'SI', title: 'Simulation' },
  { value: 'OT', title: 'Other' },
  { value: 'RPL', title: 'Recognised prior learning' },
];

/**
 * Get assessment method by value
 */
export const getAssessmentMethodByValue = (value: string): AssessmentMethod | undefined => {
  return ASSESSMENT_METHODS.find((method) => method.value === value);
};

/**
 * Get assessment method by title
 */
export const getAssessmentMethodByTitle = (title: string): AssessmentMethod | undefined => {
  return ASSESSMENT_METHODS.find((method) => method.title === title);
};

/**
 * Get all assessment method titles as an array
 */
export const getAssessmentMethodTitles = (): string[] => {
  return ASSESSMENT_METHODS.map((method) => method.title);
};

/**
 * Get all assessment method values as an array
 */
export const getAssessmentMethodValues = (): string[] => {
  return ASSESSMENT_METHODS.map((method) => method.value);
};

