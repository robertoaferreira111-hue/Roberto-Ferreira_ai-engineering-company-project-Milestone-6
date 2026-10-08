export interface ApiError {
  status: number;
  message: string;
  details?: unknown;
}

export type ApiResult<T> =
  | {
      data: T;
      error: null;
    }
  | {
      data: null;
      error: ApiError;
    };

export interface PaginatedResponse<T> {
  total: number;
  page: number;
  limit: number;
  data: T[];
}