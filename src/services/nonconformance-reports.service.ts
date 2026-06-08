import { createScopedClient } from "./http-client";
import {
  CreateNonconformanceReportDto,
  GetNonconformanceReportsQuery,
  NonconformanceReport,
  PaginatedNonconformanceReportsResponse,
} from "@/types/nonconformance-report.types";

const httpClient = createScopedClient("/nonconformance-reports");

export const nonconformanceReportsService = {
  getAll(query: GetNonconformanceReportsQuery) {
    return httpClient.get<PaginatedNonconformanceReportsResponse>("/", {
      params: query,
    });
  },
  create(payload: CreateNonconformanceReportDto) {
    return httpClient.post<NonconformanceReport>("/", payload);
  },
  getCountByEmployee(employeeId: number) {
    return httpClient.get<{ employeeId: number; totalReports: number }>(
      `/count-by-employee/${employeeId}`,
    );
  },
  exportExcel(ids: number[]) {
    return httpClient.post("/export-excel", { ids }, { responseType: "blob" });
  },
};
