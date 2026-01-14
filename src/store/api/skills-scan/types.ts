export type CourseUnit = {
  id: string | number;
  title: string;
  glh?: number | null;
  credit_value?: number | null;
  level?: string | number | null;
  code?: string;
  type?: string;
  mandatory?: boolean;
  subUnit?: SubUnit[];
  unit_ref?: string;
  progressByDate?: ProgressByDate[];
  quarter_review?: {
    induction?: number;
    first?: number;
    second?: number;
    third?: number;
  };
};

export type SubUnit = {
  id: string;
  title: string;
  topics?: SubTopic[];
  rating?: number;
  type?: string;
  quarter_review?: {
    induction?: number;
    first?: number;
    second?: number;
    third?: number;
  };
  showOrder?: number | string;
  timesMet?: number | string;
  progressByDate?: ProgressByDate[];
};

export type SubTopic = {
 code?: string;
 type?: string;
 id: string | number;
 title: string;
 showOrder?: number | string;
};

export type ProgressByDate = {
  date: string;
  rating: number;
};

export type Course = {
  course_id: string;
  course_name: string;
  start_date: string;
  end_date: string;
};

export type LearnerCourse = {
  course: Course;
  start_date: string;
  end_date: string;
};

export type SkillsScanResponse = {
  status: boolean;
  data?: CourseUnit[];
  message?: string;
  error?: string;
};

export type UpdateCourseUnitSkillRequest = {
  course: {
    units: CourseUnit[];
    // Include all other course fields
    course_id?: string | number;
    course_name?: string;
    course_code?: string;
    course_core_type?: string;
    [key: string]: unknown; // Allow for additional course fields
  };
};

export type UpdateCourseUnitSkillResponse = {
  status: boolean;
  message?: string;
  error?: string;
};

