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
