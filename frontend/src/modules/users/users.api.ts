import { api } from "../../api/axios";
import type { ApiResponse } from "../../api/api.types";
import type {
    CreateUserRequest,
    FindUserFilters,
    UpdateUserRequest,
    User
} from "./users.types";

export async function getUsers(): Promise<User[]> {
    const result = await api.get<ApiResponse<User[]>>(
        "/users/users-dashboard"
    );

    return result.data.data;
}

export async function findUsers(
    filters: FindUserFilters
): Promise<User[]> {
    const result = await api.get<ApiResponse<User[]>>(
        "/users/find-user",
        {
            params : filters
        }
    );

    return result.data.data;
}

export async function createUser(
    data: CreateUserRequest
): Promise<User> {
    const result = await api.post<ApiResponse<User>>(
        "/users/create-user",
        data
    );

    return result.data.data;
}

export async function updateUser(
    id: string,
    data: UpdateUserRequest
): Promise<User> {
    const result = await api.put<ApiResponse<User>>(
        `/users/update-user/${id}`,
        data
    );

    return result.data.data;
}

export async function deleteUser(
    id: string
): Promise<void> {
    await api.delete(
        `/users/delete-user/${id}`
    );
}
