import { createScopedClient } from "./http-client";
import { EmployeePosition } from "@/types/personnel-requisition.types";

const employeesHttp = createScopedClient("/employees");

export const responseTimeRelatedService = {
  getPositions(params?: { withoutConfiguration?: boolean }) {
    return employeesHttp.get<EmployeePosition[]>("/positions", {
      params,
    });
  },
};
