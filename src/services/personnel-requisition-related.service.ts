import { createScopedClient } from "./http-client";
import {
  Area,
  Workplace,
  EmployeePosition,
  ReasonForRequest,
  Employee,
  Project,
  EmployeeGender,
} from "@/types/personnel-requisition.types";

// Create scoped clients for different endpoints
const areasHttp = createScopedClient("/areas");
const workplacesHttp = createScopedClient("/workplaces");
const employeesHttp = createScopedClient("/employees");
const reasonsHttp = createScopedClient("/reasons-for-request");
const projectsHttp = createScopedClient("/projects");

export const personnelRequisitionRelatedService = {
  getAreas() {
    return areasHttp.get<Area[]>("/");
  },
  getWorkplaces() {
    return workplacesHttp.get<Workplace[]>("/");
  },
  getPositions() {
    return employeesHttp.get<EmployeePosition[]>("/positions");
  },
  getGenders() {
    return employeesHttp.get<EmployeeGender[]>("/genders");
  },
  getReasonsForRequest() {
    return reasonsHttp.get<ReasonForRequest[]>("/");
  },
  getEmployeesForReplacement() {
    return employeesHttp.get<Employee[]>("/?replacedBy=null");
  },
  getProjects() {
    return projectsHttp.get<Project[]>("/");
  },
};
