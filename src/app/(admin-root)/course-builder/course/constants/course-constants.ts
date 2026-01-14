/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Course Constants
 * 
 * Constants and options for course builder forms
 */

// Course types for forms
export const COURSE_TYPES = [
  "Functional Skills - Maths",
  "Functional Skills English",
  "Btec National",
  "Diploma",
  "RQF",
] as const;

// Course levels for forms
export const COURSE_LEVELS = [
  "Entry Level",
  "Level 1",
  "Level 2",
  "Level 3",
  "Level 4",
  "Level 5",
  "Level 6",
  "Level 7",
  "Level 8",
] as const;

// Gateway course interface
export interface GatewayCourse {
  course_id: number;
  course_name: string;
  course_code: string;
  active: boolean;
  [key: string]: any;
}

// Awarding body options
export const AWARDING_BODY_OPTIONS = [
  "EDEXCEL",
  "City and Guilds",
  "OCR",
  "UFI",
  "IMIAL",
  "BCS",
  "ILM",
  "SQA",
  "OCNW",
  "CIMGT",
  "EDI",
  "LLUK",
  "NCFE",
  "EAL",
  "CACHE",
  "GQA",
  "CAA",
  "EQL",
  "1st4sport",
  "CSkills",
  "Future",
  "CMI",
  "AIM",
  "ABBE",
  "FIRST",
  "VTCT",
  "CYQ",
  "CFA",
  "AAT",
  "BIoR",
  "NOCN",
  "NPTC",
  "CIH",
  "SkillsFirst",
  "TBA",
  "IQ",
  "ABC",
  "IAM",
  "SFEDI",
  "IWFM",
  "SEMTA",
  "PAAVQ-SET",
  "CCEA",
  "HABC",
  "Ascentis",
  "ASDAN",
  "FDQ",
  "Active IQ",
  "Pearson",
  "ECITB",
  "CIBTAC",
  "BTEC",
  "People 1st",
  "Skills for Care",
  "CII",
  "CIEH",
  "APT",
  "WJEC",
  "BIIAB",
  "NFOPP",
  "No Awarding Body",
] as const;

// Duration periods
export const DURATION_PERIODS = [
  "Days",
  "Weeks",
  "Months",
  "Years",
] as const;

// Yes/No options
export const YES_NO_OPTIONS = [
  { value: true, label: "Yes" },
  { value: false, label: "No" },
] as const;

// Yes/No options as strings for Select components
export const YES_NO_OPTIONS_STRINGS = ["Yes", "No"] as const;

// Course type configuration
export const COURSE_TYPE_CONFIG = {
  Qualification: {
    label: "Qualification",
    description: "Create a qualification course with units and criteria",
  },
  Standard: {
    label: "Standard",
    description: "Create a standard course with modules and topics",
  },
  Gateway: {
    label: "Gateway",
    description: "Create a gateway course for assessments",
  },
} as const;


export function removeEmptyStrings(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(item => removeEmptyStrings(item)).filter(item => item !== null && item !== undefined && item !== '')
  } else if (obj !== null && typeof obj === 'object') {
    const cleaned: any = {}
    for (const key in obj) {
      const value = obj[key]
      if (value === '' || value === null) {
        continue // Skip empty strings and null values
      } else if (Array.isArray(value)) {
        const cleanedArray = removeEmptyStrings(value)
        if (cleanedArray.length > 0) {
          cleaned[key] = cleanedArray
        }
      } else if (value !== null && typeof value === 'object') {
        const cleanedObj = removeEmptyStrings(value)
        if (Object.keys(cleanedObj).length > 0) {
          cleaned[key] = cleanedObj
        }
      } else {
        cleaned[key] = value
      }
    }
    return cleaned
  }
  return obj
}
