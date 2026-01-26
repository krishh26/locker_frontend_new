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
  title: string;
  signed_off_percentage?: number;
  awaiting_sign_off_percentage?: number;
  completed?: boolean | string;
  assessed?: boolean | string;
  iqa_sign_off?: boolean | string;
  claimable_status?: string;
};

export type LearnerUnitProgressData = {
  learner_name: string;
  uln?: string;
  registration_number?: string;
  training_provider?: string;
  course_name: string;
  units: UnitProgress[];
};

export type LearnerUnitProgressResponse = {
  status: boolean;
  message?: string;
  error?: string;
  data?: LearnerUnitProgressData;
};
