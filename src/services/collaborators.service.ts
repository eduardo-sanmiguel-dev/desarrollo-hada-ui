import { createScopedClient } from "./http-client";
import {
  Collaborator,
  CollaboratorImportResponse,
  CollaboratorResponse,
  CreateCollaboratorDto,
  UpdateCollaboratorDto,
} from "@/types/collaborator.types";

const httpClient = createScopedClient("/employees");

export const collaboratorsService = {
  getAll() {
    return httpClient.get<Collaborator[]>("/");
  },
  getById(id: number) {
    return httpClient.get<CollaboratorResponse>(`/${id}`);
  },
  create(payload: CreateCollaboratorDto) {
    return httpClient.post<CollaboratorResponse>("/", payload);
  },
  update(id: number, payload: UpdateCollaboratorDto) {
    return httpClient.patch<CollaboratorResponse>(`/${id}`, payload);
  },
  delete(id: number) {
    return httpClient.delete<{ message: string }>(`/${id}`);
  },
  importFromExcel(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    return httpClient.post<CollaboratorImportResponse>(
      "/import-excel",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
  },
};
