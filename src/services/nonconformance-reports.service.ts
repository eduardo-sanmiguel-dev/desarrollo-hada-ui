import { createScopedClient } from "./http-client";
import {
  CreateNonconformanceReportDto,
  NonconformanceReport,
} from "@/types/nonconformance-report.types";

const httpClient = createScopedClient("/nonconformance-reports");

export const nonconformanceReportsService = {
  getAll() {
    return httpClient.get<NonconformanceReport[]>("/");
  },
  create(payload: CreateNonconformanceReportDto) {
    return httpClient.post<NonconformanceReport>("/", payload);
  },
  exportExcel(ids: number[]) {
    return httpClient.post("/export-excel", { ids }, { responseType: "blob" });
  },
};
