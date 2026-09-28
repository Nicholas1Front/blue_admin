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
        response.data.token,
        {
            id : response.data.id,
            name : response.data.name,
            email : response.data.email
        }
    );

    return response;
}
