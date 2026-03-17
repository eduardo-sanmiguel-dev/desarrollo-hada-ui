import { createScopedClient } from "./http-client";
import {
  Area,
  Workplace,
  EmployeePosition,
  ReasonForRequest,
  Employee,
  Project,
} from "@/types/personnel-requisition.types";

// Create scoped clients for different endpoints
const areasHttp = createScopedClient("/areas");
const workplacesHttp = createScopedClient("/workplaces");
const employeesHttp = createScopedClient("/employees");
const reasonsHttp = createScopedClient("/reasons-for-request");
const projectsHttp = createScopedClient("/projects");

export const personnelRequisitionRelatedService = {
  /**
   * Get all areas
   */
  getAreas() {
    return areasHttp.get<Area[]>("/");
  },

  /**
   * Get all workplaces
   */
  getWorkplaces() {
    return workplacesHttp.get<Workplace[]>("/");
  },

  /**
   * Get all employee positions
   */
  getPositions() {
    return employeesHttp.get<EmployeePosition[]>("/positions");
  },

  /**
   * Get all reasons for request
   */
  getReasonsForRequest() {
    return reasonsHttp.get<ReasonForRequest[]>("/");
  },

  /**
   * Get employees available for replacement (where replacedBy is null)
   */
  getEmployeesForReplacement() {
    return employeesHttp.get<Employee[]>("/?replacedBy=null");
  },

  /**
   * Get all projects
   */
  getProjects() {
    return projectsHttp.get<Project[]>("/");
  },
};
