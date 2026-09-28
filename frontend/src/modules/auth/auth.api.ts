import { api } from "../../api/axios";
import { authService } from "./auth.service";
import type {
    ApiResponse
} from "../../api/api.types";
import type {
    LoginRequest,
    LoginResponse
} from "./auth.types";

export async function login(
    data : LoginRequest
) : Promise<LoginResponse> {
    const result = await api.post<ApiResponse<LoginResponse>>(
        "/auth/login",
        data
    );

    const response = result.data.data;

    authService.saveSession(
        response.token,
        {
            id : response.id,
            name : response.name,
            email : response.email
        }
    );

    return response;
}
