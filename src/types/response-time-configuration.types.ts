import { EmployeePosition, User } from "./personnel-requisition.types";

export interface ResponseTimeConfiguration {
  id: number;
  responseTimeInDays: number;
  position?: EmployeePosition;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  deletedAt?: string | Date | null;
  createdBy?: User;
  updatedBy?: User;
  deletedBy?: User;
}

export interface CreateResponseTimeConfigurationDto {
  positionId: number;
  responseTimeInDays: number;
}

export type UpdateResponseTimeConfigurationDto =
  Partial<CreateResponseTimeConfigurationDto>;

export interface GetResponseTimeConfigurationsQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortField?: "id" | "position" | "responseTimeInDays" | "createdAt";
  sortDirection?: "asc" | "desc";
}

export interface ResponseTimeConfigurationResponse {
  id: number;
  responseTimeInDays: number;
  position: EmployeePosition;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  createdBy?: User;
  updatedBy?: User;
  deletedBy?: User;
}

export interface PaginatedResponseTimeConfigurationsResponse {
  items: ResponseTimeConfigurationResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
