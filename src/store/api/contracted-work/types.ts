export interface LastEditor {
  first_name: string;
  last_name: string;
}

export interface ContractedWork {
  id: number;
  learner_id: number;
  company: string;
  contract_start: string; // ISO date string
  contract_end: string | null; // ISO date string, nullable
  contracted_work_hours_per_week: string | number;
  yearly_holiday_entitlement_in_hours?: number | null;
  last_editer?: LastEditor | null;
  created_at: string;
  updated_at: string;
}

export interface ContractedWorkListResponse {
  status: boolean;
  message?: string;
  data: ContractedWork[];
  error?: string;
}

export interface ContractedWorkResponse {
  status: boolean;
  message?: string;
  data?: ContractedWork;
  error?: string;
}

export interface CreateContractedWorkRequest {
  learner_id: number;
  company: string;
  contract_start: string; // ISO date string
  contract_end?: string | null; // ISO date string, optional
  contracted_work_hours_per_week: string | number;
  yearly_holiday_entitlement_in_hours?: number | null;
}

export interface UpdateContractedWorkRequest {
  company?: string;
  contract_start?: string; // ISO date string
  contract_end?: string | null; // ISO date string, optional
  contracted_work_hours_per_week?: string | number;
  yearly_holiday_entitlement_in_hours?: number | null;
}

