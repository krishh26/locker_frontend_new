export type Feedback = {
  id: string;
  feedback: 'very_helpful' | 'helpful' | 'neutral' | 'not_helpful';
  createdAt?: string;
};

export type WellbeingResource = {
  id: string;
  resource_name: string;
  description: string;
  location: string;
  category?: string;
  tags?: string[];
  isActive?: boolean;
  createdAt: string;
  updatedAt?: string;
  createdByName?: string;
  updatedBy?: string;
  resourceType: 'FILE' | 'URL';
  lastOpenedDate?: string;
  feedback?: Feedback;
};

export type LearnerResourcesResponse = {
  status?: boolean;
  data: WellbeingResource[];
  message?: string;
  error?: string;
};

export type TrackResourceOpenRequest = {
  resourceId: string;
};

export type TrackResourceOpenResponse = {
  status: boolean;
  data?: {
    id: string;
    resourceId: string;
    openedAt: string;
  };
  message?: string;
  error?: string;
};

export type SubmitFeedbackRequest = {
  resourceId: number | string;
  feedback: 'very_helpful' | 'helpful' | 'neutral' | 'not_helpful';
};

export type SubmitFeedbackResponse = {
  status: boolean;
  data?: Feedback;
  message?: string;
  error?: string;
};

// Admin Resource Management Types
export type AdminResourcesRequest = {
  search?: string;
  page?: number;
  limit?: number;
};

export type AdminResourcesResponse = {
  status: boolean;
  data: WellbeingResource[];
  total?: number;
  page?: number;
  limit?: number;
  message?: string;
  error?: string;
};

export type ResourceResponse = {
  status: boolean;
  data: WellbeingResource;
  message?: string;
  error?: string;
};

export type AddResourcePayload = {
  resource_name: string;
  description: string;
  location: string;
  category?: string;
  tags?: string[];
  resourceType: 'FILE' | 'URL';
  isActive?: boolean;
};

export type UpdateResourcePayload = Partial<AddResourcePayload>;

export type ToggleResourceRequest = {
  id: string;
  isActive: boolean;
};