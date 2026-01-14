export interface SafeguardingContact {
  id?: string;
  telNumber: string;
  mobileNumber: string;
  emailAddress: string;
  additionalInfo: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SafeguardingContactResponse {
  status: boolean;
  message?: string;
  error?: string;
  data?: SafeguardingContact;
}

export interface SafeguardingContactListResponse {
  status: boolean;
  message?: string;
  error?: string;
  data?: SafeguardingContact[];
}

export interface CreateSafeguardingContactPayload {
  telNumber: string;
  mobileNumber: string;
  emailAddress: string;
  additionalInfo: string;
}
