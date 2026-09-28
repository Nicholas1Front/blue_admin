import { api } from "../../api/axios";
import { authService } from "./auth.service";
import type {
    LoginRequest,
    LoginResponse
} from "./auth.types";

export async function login(
    data : LoginRequest
) : Promise<LoginResponse> {
    const result = await api.post<LoginResponse>(
        "/auth/login",
        data
    );

    const response = result.data;

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
