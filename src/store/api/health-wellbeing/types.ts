export type Feedback = {
  id: string;
  feedback: 'very_helpful' | 'helpful' | 'neutral' | 'not_helpful';
  createdAt?: string;
};

export type WellbeingResource = {
  id: string;
  /** Display name; learner list includes it when set on the resource. */
  resource_name?: string;
  description: string | null;
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
  /** API may return a string (`neutral`, etc.) or a `Feedback` object */
  feedback?: Feedback | Feedback['feedback'];
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