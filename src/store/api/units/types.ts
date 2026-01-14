export type SubUnit = {
  id: number;
  code: string;
  title: string;
  type: string;
  showOrder: number;
  timesMet: number;
  topics?: Array<{
    id: string;
    code: string;
    title: string;
    type: string;
    showOrder: number;
  }>;
};

export type Unit = {
  id: number;
  title: string;
  code: string;
  mandatory: boolean;
  glh: number;
  level: string;
  credit_value: number;
  subUnit?: SubUnit[];
};

export type UnitsListResponse = {
  status: boolean;
  units?: Unit[];
  message?: string;
  error?: string;
};

export type SaveUnitsRequest = {
  learner_id: number;
  course_id: number;
  unit_ids: string[];
};

export type SaveUnitsResponse = {
  status: boolean;
  data?: { savedCount: number };
  message?: string;
  error?: string;
};

