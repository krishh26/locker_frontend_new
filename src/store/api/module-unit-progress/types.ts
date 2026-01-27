export type SubUnit = {
  id: number | string;
  subTitle: string;
  learnerMap: boolean;
  trainerMap: boolean;
  comment?: string;
};

export type Unit = {
  id: number | string;
  title: string;
  subUnit?: SubUnit[];
};

export type Course = {
  course_id: number;
  course_name: string;
  units?: Unit[];
};

export type LearnerCourse = {
  user_course_id: number;
  course: Course;
  start_date: string;
  end_date: string;
  course_status: string;
  is_main_course: boolean;
  [key: string]: unknown;
};

export type ModuleUnitProgressData = {
  learner_id: number;
  first_name: string;
  last_name: string;
  user_name: string;
  email: string;
  mobile: string;
  course: LearnerCourse[];
  [key: string]: unknown;
};

export type ModuleUnitProgressResponse = {
  status: boolean;
  message?: string;
  error?: string;
  data?: ModuleUnitProgressData;
};

export type UnitProgress = {
  id: number | string;
  title: string;
  code?: string;
  type?: string;
  mandatory?: boolean;
  unit_id?: number | string;
  learner_progress_percent?: number;
  trainer_progress_percent?: number;
  learner_done?: boolean;
  trainer_done?: boolean;
  fully_completed?: boolean;
  partially_completed?: boolean;
  assessed_date?: string | null;
  iqa_sign_off?: boolean | string | null;
  quarter_review?: {
    induction?: number;
    first?: number;
    second?: number;
    third?: number;
  };
  [key: string]: unknown;
};

export type LearnerUnitProgressResponse = {
  status: boolean;
  message?: string;
  error?: string;
  units?: UnitProgress[];
};
