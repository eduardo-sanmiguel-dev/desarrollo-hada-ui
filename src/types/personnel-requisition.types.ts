// Core types
export interface Area {
  id: number;
  name: string;
  description?: string;
}

export interface Workplace {
  id: number;
  name: string;
  code?: string;
}

export interface PositionRequiredConfig {
  responseTimeInDays: number;
}

export interface EmployeePosition {
  id: number;
  name: string;
  code?: string;
}

export interface Employee {
  id: number;
  name: string;
  code: string;
  position?: EmployeePosition;
  gender?: EmployeeGender;
  area?: EmployeeArea;
}

export interface EmployeeArea {
  id: number;
  name: string;
}

export interface EmployeeGender {
  id: number;
  name: string;
}

export interface Project {
  id: number;
  name: string;
}

export interface ReasonForRequest {
  id: number;
  name: string;
  description?: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  code?: string;
}

// Personnel Requisition types
export interface PersonnelRequisition {
  id: number;
  requestDate: string | Date;
  area?: Area;
  workplace?: Workplace;
  positionRequired?: EmployeePosition & { config?: PositionRequiredConfig };
  numberOfVacancies: number;
  percentageOfCompliance?: number;
  isExternal: boolean;
  reasonForRequest?: ReasonForRequest;
  usersRemplaced?: number[] | User[];
  projectReplaced?: Project;
  observations?: string;
  isAuthorized?: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  deletedAt?: string | Date | null;
  requestingUser?: User;
  createdBy?: User;
  updatedBy?: User;
  deletedBy?: User;
  authorizedBy?: User;
  positionRequestingUser?: EmployeePosition;
  // Optional fields from form (not typically in API response)
  areaId?: number;
  workplaceId?: number;
  positionRequiredId?: number;
  reasonForRequestId?: number;
  projectReplacedName?: string;
}

// DTO types for API
export interface CreatePersonnelRequisitionDto {
  areaId: number;
  workplaceId: number;
  positionRequiredId: number;
  numberOfVacancies: number;
  isExternal: boolean;
  reasonForRequestId: number;
  usersRemplaced?: number[];
  projectReplacedName?: string;
  observations?: string;
}

export interface UpdatePersonnelRequisitionDto extends Partial<CreatePersonnelRequisitionDto> {}

export interface GetPersonnelRequisitionsQuery {
  page?: number;
  limit?: number;
  areaId?: number;
  positionRequiredId?: number;
  isAuthorized?: boolean;
  excludeFullCompliance?: boolean;
  search?: string;
  sortField?:
    | "id"
    | "requestDate"
    | "createdAt"
    | "numberOfVacancies"
    | "isExternal"
    | "reasonForRequest"
    | "area"
    | "requestingUser"
    | "positionRequestingUser"
    | "workplace"
    | "positionRequired";
  sortDirection?: "asc" | "desc";
}

export interface PaginatedPersonnelRequisitionsResponse {
  items: PersonnelRequisitionResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// API Response types
export interface PersonnelRequisitionResponse {
  id: number;
  requestDate: string;
  area: Area;
  workplace: Workplace;
  positionRequired: EmployeePosition & { config?: PositionRequiredConfig };
  numberOfVacancies: number;
  percentageOfCompliance: number;
  isExternal: boolean;
  reasonForRequest: ReasonForRequest;
  usersRemplaced: User[];
  projectReplaced?: Project;
  observations?: string;
  isAuthorized: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  requestingUser?: User;
  createdBy?: User;
  updatedBy?: User;
  deletedBy?: User;
  positionRequestingUser?: EmployeePosition;
}
