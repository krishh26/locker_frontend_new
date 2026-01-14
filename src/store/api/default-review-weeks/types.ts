export interface DefaultReviewWeeksConfig {
  id?: string;
  noReviewWeeks: number;
  noInductionWeeks: number;
  requireFileUpload: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface DefaultReviewWeeksConfigResponse {
  status: boolean;
  message?: string;
  error?: string;
  data?: DefaultReviewWeeksConfig;
}

export interface SaveDefaultReviewWeeksConfigRequest {
  noReviewWeeks: number;
  noInductionWeeks: number;
  requireFileUpload: boolean;
}
