import {
  Area,
  EmployeeGender,
  EmployeePosition,
  PersonnelRequisitionResponse,
  User,
} from "./personnel-requisition.types";

export interface Collaborator {
  id: number;
  code: number;
  name: string;
  birthdate?: string | Date | null;
  dateOfAdmission?: string | Date | null;
  area?: Area;
  position?: EmployeePosition;
  gender?: EmployeeGender;
  personnelRequisition?: PersonnelRequisitionResponse;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  deletedAt?: string | Date | null;
  createdBy?: User;
  updatedBy?: User;
  deletedBy?: User;
}

export interface CreateCollaboratorDto {
  code: number;
  name: string;
  birthdate: string;
  dateOfAdmission: string;
  areaId: number;
  positionId: number;
  genderId: number;
  personnelRequisitionId?: number;
}

export type UpdateCollaboratorDto = Partial<CreateCollaboratorDto>;

export interface CollaboratorResponse {
  id: number;
  code: number;
  name: string;
  birthdate?: string | null;
  dateOfAdmission?: string | null;
  area: Area;
  position: EmployeePosition;
  gender: EmployeeGender;
  personnelRequisition?: PersonnelRequisitionResponse;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  createdBy?: User;
  updatedBy?: User;
  deletedBy?: User;
}

export interface CollaboratorImportError {
  row: number;
  reason: string;
}

export interface CollaboratorImportResponse {
  created: number;
  updated: number;
  skipped: number;
  errors: CollaboratorImportError[];
}
