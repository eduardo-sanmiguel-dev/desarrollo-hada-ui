import { User as AuditUser } from "./personnel-requisition.types";

export interface AppUser {
  id: number;
  code: number;
  name: string;
  email: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  deletedAt?: string | Date | null;
  createdBy?: AuditUser;
  updatedBy?: AuditUser;
  deletedBy?: AuditUser;
}

export interface CreateUserDto {
  code: number;
  name: string;
  email: string;
  password: string;
}

export type UpdateUserDto = Partial<CreateUserDto>;
