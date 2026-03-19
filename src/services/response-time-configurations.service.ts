import { createScopedClient } from "./http-client";
import {
  CreateResponseTimeConfigurationDto,
  GetResponseTimeConfigurationsQuery,
  PaginatedResponseTimeConfigurationsResponse,
  ResponseTimeConfigurationResponse,
  UpdateResponseTimeConfigurationDto,
} from "@/types/response-time-configuration.types";

const httpClient = createScopedClient("/position-configurations");

export const responseTimeConfigurationsService = {
  getAll(params?: GetResponseTimeConfigurationsQuery) {
    return httpClient.get<PaginatedResponseTimeConfigurationsResponse>("/", {
      params,
    });
  },
  getById(id: number) {
    return httpClient.get<ResponseTimeConfigurationResponse>(`/${id}`);
  },
  create(payload: CreateResponseTimeConfigurationDto) {
    return httpClient.post<ResponseTimeConfigurationResponse>("/", payload);
  },
  update(id: number, payload: UpdateResponseTimeConfigurationDto) {
    return httpClient.patch<ResponseTimeConfigurationResponse>(
      `/${id}`,
      payload,
    );
  },
  delete(id: number) {
    return httpClient.delete<{ message: string }>(`/${id}`);
  },
};
