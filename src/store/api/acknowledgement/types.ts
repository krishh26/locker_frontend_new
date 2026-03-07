export interface Acknowledgement {
  id: string;
  message: string;
  fileName?: string;
  filePath?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AcknowledgementResponse {
  status: boolean;
  message?: string;
  error?: string;
  data?: Acknowledgement;
}

export interface AcknowledgementListResponse {
  status: boolean;
  message?: string;
  error?: string;
  data?: Acknowledgement[];
}

export interface CreateAcknowledgementPayload {
  message: string;
  file?: File;
  organisation_id?: number;
  centre_id?: number;
}

export interface UpdateAcknowledgementPayload {
  id: string;
  message: string;
  file?: File;
}

export interface AcknowledgementFilters {
  organisation_id?: number;
  centre_id?: number;
}
