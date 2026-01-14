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

