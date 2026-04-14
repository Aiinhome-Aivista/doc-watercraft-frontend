/**
 * Standard API Response Structure
 * Adjust this generic interface based on what your backend actually returns.
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
  errors?: any[];
}

/**
 * Standard Pagination Meta Data
 */
export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

/**
 * Paginated Response Structure
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: PaginationMeta;
}

/**
 * Basic Error Response mapping
 */
export interface ApiErrorResponse {
  message: string;
  code?: string | number;
  errors?: Record<string, string[]>; // e.g. validation errors
}
