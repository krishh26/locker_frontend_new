export type FormUser = {
  user_id: string | number;
  user_name: string;
  email: string;
};

export type Form = {
  id: string | number;
  form_name: string;
  type: string;
};

export type SubmittedForm = {
  id: string | number;
  form: Form;
  user: FormUser;
  is_locked: boolean;
  created_at: string;
};

export type SubmittedFormsResponse = {
  status: boolean;
  message?: string;
  error?: string;
  data?: SubmittedForm[];
  meta_data?: {
    page: number;
    items: number;
    page_size: number;
    pages: number;
  };
};

export type FormSubmission = {
  id: string | number;
  form_data?: Record<string, unknown>;
  form_files?: unknown;
  created_at: string;
  updated_at?: string;
  is_locked?: boolean;
  user: FormUser;
  form: {
    id: string | number;
    form_name: string;
    description?: string;
    form_data?: FormField[];
    type: string;
  };
};

export type FormSubmissionsResponse = {
  status: boolean;
  message?: string;
  error?: string;
  data?: FormSubmission[];
  meta_data?: {
    page: number;
    items: number;
    page_size: number;
    pages: number;
  };
};

export type LockFormRequest = {
  formId: string | number;
  userId: string | number;
  reason: string;
};

export type UnlockFormRequest = {
  formId: string | number;
  userId: string | number;
  reason: string;
};

export type LockFormResponse = {
  status: boolean;
  message?: string;
  error?: string;
};

export type UnlockFormResponse = {
  status: boolean;
  message?: string;
  error?: string;
};

// Forms List Types
export type FormListItem = {
  id: string | number;
  form_name: string;
  description?: string;
  type: string;
  created_at: string;
};

export type FormListResponse = {
  status: boolean;
  message?: string;
  error?: string;
  data?: FormListItem[];
  meta_data?: {
    page: number;
    items: number;
    page_size: number;
    pages: number;
  };
};

export type DeleteFormRequest = {
  formId: string | number;
};

export type DeleteFormResponse = {
  status: boolean;
  message?: string;
  error?: string;
};

export type AssignUsersRequest = {
  formId: string | number;
  user_ids?: (string | number)[];
  assign?: string; // "All" | "All Learner" | "All EQA" | "All Trainer" | "All Employer" | "All IQA" | "All LIQA"
};

export type AssignUsersResponse = {
  status: boolean;
  message?: string;
  error?: string;
};

export type User = {
  user_id: string | number;
  user_name: string;
  email?: string;
};

export type UsersListResponse = {
  status: boolean;
  message?: string;
  error?: string;
  data?: User[];
};

// Table field ("table" type): fixed text, inputs, or Locker data per cell.
export type TableCellType = "static" | "text" | "date" | "checkbox" | "preset";

export type TableCell = {
  type: TableCellType;
  /** Fixed text for "static" cells. */
  text?: string;
  /** Preset key for "preset" cells, e.g. "courseName". */
  presetField?: string;
};

export type TableColumn = { id: string; header: string };

export type TableRow = { id: string; cells: Record<string, TableCell> };

export type TableConfig = {
  showHeader: boolean;
  columns: TableColumn[];
  rows: TableRow[];
};

/** Answer for a table field: rowId -> columnId -> value ("true"/"" for checkboxes). */
export type TableAnswer = Record<string, Record<string, string>>;

// Form Details Types
export type FormField = {
  id: string;
  type: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: { label: string; value: string }[];
  width?: "full" | "half" | "third";
  presetField?: string;
  signatureRole?: string;
  content?: string;
  table?: TableConfig;
};

export type FormDetails = {
  id: string | number;
  form_name: string;
  description?: string;
  type: string;
  form_data?: FormField[]; // API returns form_data instead of fields
  fields?: FormField[]; // Keep for backward compatibility
  is_locked?: boolean;
  created_at?: string;
  updated_at?: string;
  access_rights?: string;
  completion_roles?: string;
  email_roles?: string;
  enable_complete_function?: boolean;
  set_request_signature?: boolean;
  other_emails?: string | null;
};

export type FormDetailsResponse = {
  status: boolean;
  message?: string;
  error?: string;
  data?: FormDetails;
};

export type FormDataDetails = {
  id: number;
  form_data: Record<string, string>; // Object mapping field IDs to values
  form_files: Record<string, string> | null;
  is_locked: boolean;
  locked_at: string | null;
  unlocked_at: string | null;
  unlock_reason: string | null;
  created_at: string;
  updated_at: string;
  form: {
    id: number;
    form_name: string;
    description: string;
    form_data: FormField[]; // Array of field definitions
    type: string;
    access_rights: string;
    enable_complete_function: boolean;
    completion_roles: string;
    set_request_signature: boolean;
    email_roles: string;
    other_emails: string | null;
    created_at: string;
    updated_at: string;
  };
  locked_by: number | null;
  unlocked_by: number | null;
};

export type FormDataDetailsResponse = {
  status: boolean;
  message?: string;
  error?: string;
  data?: FormDataDetails;
};

export type SubmitFormRequest = {
  formId: string | number;
  userId: string | number;
  formData: FormData | Record<string, unknown>; // Can be FormData (with files) or JSON object
  submit?: boolean; // true for final submission, false/undefined for draft
};

export type SubmitFormResponse = {
  status: boolean;
  message?: string;
  error?: string;
};

// Simple Form Field Type (matching SimpleFormBuilder interface)
export type SimpleFormField = {
  id: string;
  type: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: { label: string; value: string }[];
  width?: "full" | "half" | "third";
  presetField?: string;
  signatureRole?: string;
  content?: string;
  table?: TableConfig;
};

// Create Form Request
export type CreateFormRequest = {
  form_name: string;
  description?: string;
  type: string;
  form_data: SimpleFormField[];
  access_rights: string; // Comma-separated roles wrapped in single quotes: "'Admin','Learner'"
  completion_roles?: string; // Comma-separated roles wrapped in single quotes
  enable_complete_function?: boolean;
  set_request_signature?: boolean;
  email_roles: string; // Comma-separated roles wrapped in single quotes
  other_emails?: string | null;
  organisation_id?: number;
};

// Update Form Request
export type UpdateFormRequest = {
  form_name?: string;
  description?: string;
  type?: string;
  form_data?: SimpleFormField[];
  access_rights?: string;
  completion_roles?: string;
  enable_complete_function?: boolean;
  set_request_signature?: boolean;
  email_roles?: string;
  other_emails?: string | null;
  organisation_id?: number;
};

// Form Template Types
export type FormTemplate = {
  id: string | number;
  template_name: string;
  form_data: SimpleFormField[];
  created_at: string;
};

export type FormTemplateListResponse = {
  status: boolean;
  message?: string;
  error?: string;
  data?: FormTemplate[];
  meta_data?: {
    page: number;
    page_size: number;
    pages: number;
    items: number;
  };
};

export type FormTemplateResponse = {
  status: boolean;
  message?: string;
  error?: string;
  data?: FormTemplate;
};

export type CreateFormTemplateRequest = {
  template_name: string;
  form_data: SimpleFormField[];
  organisation_id?: number;
};

export type DeleteFormTemplateRequest = {
  templateId: string | number;
};

export type DeleteFormTemplateResponse = {
  status: boolean;
  message?: string;
  error?: string;
};

