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
  create(payload: CreateNonconformanceReportDto, file: File) {
    const formData = new FormData();
    formData.append("employeeId", String(payload.employeeId));
    formData.append("deviation", payload.deviation);
    formData.append("nonconformance", payload.nonconformance);
    formData.append("signatureBase64", payload.signatureBase64);
    formData.append("file", file);

    return httpClient.post<NonconformanceReport>("/", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
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
