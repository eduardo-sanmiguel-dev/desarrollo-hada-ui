export interface NonconformanceReport {
  id: number;
  employeeId: number;
  employeeCode?: number;
  employeeName?: string | null;
  deviation: string;
  nonconformance: string;
  signatureBase64?: string | null;
  reportedBy: number;
  reportedByName?: string | null;
  createdAt: string;
}

export interface CreateNonconformanceReportDto {
  employeeId: number;
  deviation: string;
  nonconformance: string;
  signatureBase64: string;
}

export interface GetNonconformanceReportsQuery {
  page?: number;
  limit?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface PaginatedNonconformanceReportsResponse {
  items: NonconformanceReport[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
