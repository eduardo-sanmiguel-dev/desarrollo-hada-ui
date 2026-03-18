import { createScopedClient } from "./http-client";
import {
  CreatePersonnelRequisitionDto,
  GetPersonnelRequisitionsQuery,
  PaginatedPersonnelRequisitionsResponse,
  UpdatePersonnelRequisitionDto,
  PersonnelRequisitionResponse,
} from "@/types/personnel-requisition.types";

const httpClient = createScopedClient("/personnel-requisitions");

export const personnelRequisitionsService = {
  getAll(params?: GetPersonnelRequisitionsQuery) {
    return httpClient.get<PaginatedPersonnelRequisitionsResponse>("/", {
      params,
    });
  },
  getById(id: number) {
    return httpClient.get<PersonnelRequisitionResponse>(`/${id}`);
  },
  create(payload: CreatePersonnelRequisitionDto) {
    return httpClient.post<PersonnelRequisitionResponse>("/", payload);
  },
  update(id: number, payload: UpdatePersonnelRequisitionDto) {
    return httpClient.patch<PersonnelRequisitionResponse>(`/${id}`, payload);
  },
  delete(id: number) {
    return httpClient.delete<{ message: string }>(`/${id}`);
  },
  createAuthorizationRequest({ requisitionId }: { requisitionId: number }) {
    return httpClient.post<{ message: string }>(
      `/authorize-request/${requisitionId}`,
    );
  },
};
