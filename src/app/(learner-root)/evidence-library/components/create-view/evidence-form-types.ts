export type EvidenceFormValues = {
  title: string;
  description: string;
  trainer_feedback: string;
  points_for_improvement: string;
  audio: File | null;
  file: File | null;
  file_key?: string;
  learner_comments: string;
  evidence_time_log: boolean;
  session: string;
  grade: string;
  declaration: boolean;
  assessment_method: string[];
  selectedCourses: Array<{
    course_id: number;
    course_name: string;
    course_code: string;
    course_core_type?: string;
    units?: StandardUnit[];
  }>;
  courseSelectedTypes: Record<string | number, string[]>;
  units: (StandardUnit | { id: string | number; course_id?: string | number; subUnit?: Array<{ id?: string | number; topics?: Array<{ id?: string | number; learnerMap?: boolean; trainerMap?: boolean; signedOff?: boolean; comment?: string }> }> })[];
  signatures: SignatureData[];
};

export interface SignatureData {
  role: string;
  name: string;
  signed: boolean;
  es?: string;
  date?: string;
  signature_required: boolean;
}

export interface Task {
  id: string | number;
  title: string;
  code?: string;
  type?: string;
  showOrder?: number;
  learnerMap?: boolean;
  trainerMap?: boolean;
  signedOff?: boolean;
  comment?: string;
  mapping_id?: number;
}

export interface Unit {
  id: string | number;
  title: string;
  type?: string;
  code?: string;
  description?: string;
  showOrder?: number;
  tasks?: Task[];
  learnerMap?: boolean;
  trainerMap?: boolean;
  signedOff?: boolean;
  comment?: string;
  mapping_id?: number;
}

export interface Module {
  id: string | number;
  title: string;
  code?: string;
  type?: string;
  description?: string;
  showOrder?: number;
  units?: Unit[];
  learnerMap?: boolean;
  trainerMap?: boolean;
  signedOff?: boolean;
  comment?: string;
  mapping_id?: number;
}

export interface SubUnit {
  id: string | number;
  title: string;
  description?: string;
  type?: string;
  showOrder?: number;
  code?: string;
  learnerMap?: boolean;
  trainerMap?: boolean;
  signedOff?: boolean;
  comment?: string;
  mapping_id?: number;
}

export interface StandardUnit {
  id: string | number;
  title: string;
  type?: string;
  code?: string;
  unit_ref?: string;
  mandatory?: boolean;
  description?: string;
  delivery_method?: string;
  otj_hours?: string;
  delivery_lead?: string;
  sort_order?: string;
  active?: boolean;
  subUnit: SubUnit[];
  learnerMap?: boolean;
  trainerMap?: boolean;
  signedOff?: boolean;
  comment?: string;
  course_id?: string | number;
  mapping_id?: number;
}

