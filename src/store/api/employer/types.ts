export interface EmployerFile {
  key: string;
  url: string;
}

export interface Employer {
  employer_id: number;
  employer_name: string;
  msi_employer_id: string;
  business_department?: string;
  business_location?: string;
  branch_code?: string;
  address_1: string;
  address_2: string;
  city: string;
  employer_county: string;
  country: string;
  postal_code: string;
  business_category?: string;
  number_of_employees?: string;
  telephone?: string;
  website?: string;
  key_contact_name?: string;
  key_contact_number?: string;
  email: string;
  business_description?: string;
  comments?: string;
  assessment_date?: string;
  assessment_renewal_date?: string;
  insurance_renewal_date?: string;
  file?: EmployerFile | null;
  created_at?: string;
  updated_at?: string;
}

export interface EmployerListResponse {
  message: string;
  status: boolean;
  data: Employer[];
  meta_data?: {
    page: number;
    page_size: number;
    pages: number;
    items: number;
  };
}

export interface EmployerFilters {
  page?: number;
  page_size?: number;
  keyword?: string;
}

export interface CreateEmployerRequest {
  employer_name: string;
  msi_employer_id: string;
  business_department?: string;
  business_location?: string;
  branch_code?: string;
  address_1: string;
  address_2: string;
  city: string;
  employer_county: string;
  country: string;
  postal_code: string;
  business_category?: string;
  number_of_employees?: string;
  telephone?: string;
  website?: string;
  key_contact_name?: string;
  key_contact_number?: string;
  email: string;
  business_description?: string;
  comments?: string;
  assessment_date?: string;
  assessment_renewal_date?: string;
  insurance_renewal_date?: string;
  file?: EmployerFile | null;
}

export interface UpdateEmployerRequest {
  employer_name?: string;
  msi_employer_id?: string;
  business_department?: string;
  business_location?: string;
  branch_code?: string;
  address_1?: string;
  address_2?: string;
  city?: string;
  employer_county?: string;
  country?: string;
  postal_code?: string;
  business_category?: string;
  number_of_employees?: string;
  telephone?: string;
  website?: string;
  key_contact_name?: string;
  key_contact_number?: string;
  email?: string;
  business_description?: string;
  comments?: string;
  assessment_date?: string;
  assessment_renewal_date?: string;
  insurance_renewal_date?: string;
  file?: EmployerFile | null;
}

export interface EmployerResponse {
  message: string;
  status: boolean;
  data: Employer;
}

export interface BulkCreateEmployerRequest {
  employers: Omit<CreateEmployerRequest, "file">[];
}

export interface BulkCreateEmployerResponse {
  message: string;
  status: boolean;
  data?: {
    created: number;
    failed: number;
  };
}

export interface UploadFileResponse {
  message: string;
  status: boolean;
  data: EmployerFile[];
}

