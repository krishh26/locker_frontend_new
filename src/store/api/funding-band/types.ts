export interface Course {
  course_id: number;
  course_name: string;
  course_code?: string;
  level?: string;
}

export interface FundingBand {
  id: number;
  course_id: number;
  band_name: string;
  amount: number;
  course: Course;
}

export interface FundingBandListResponse {
  status: boolean;
  message?: string;
  data: FundingBand[];
  meta_data?: {
    page: number;
    pages: number;
    items: number;
    page_size: number;
  };
}

export interface FundingBandResponse {
  status: boolean;
  message?: string;
  data: FundingBand;
}

export interface CreateFundingBandRequest {
  course_id: number;
  band_name: string;
  amount: number;
}

export interface UpdateFundingBandRequest {
  amount: number;
}

export interface FundingBandFilters {
  page?: number;
  page_size?: number;
  keyword?: string;
}

