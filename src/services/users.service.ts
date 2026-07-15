import { createScopedClient } from "./http-client";
import { AppUser, CreateUserDto, UpdateUserDto } from "@/types/user.types";

const httpClient = createScopedClient("/users");

export const usersService = {
  getAll() {
    return httpClient.get<AppUser[]>("/");
  },
  getById(id: number) {
    return httpClient.get<AppUser>(`/${id}`);
  },
  create(payload: CreateUserDto) {
    return httpClient.post<AppUser>("/", payload);
  },
  update(id: number, payload: UpdateUserDto) {
    return httpClient.patch<AppUser>(`/${id}`, payload);
  },
  delete(id: number) {
    return httpClient.delete<{ message: string }>(`/${id}`);
  },
};
