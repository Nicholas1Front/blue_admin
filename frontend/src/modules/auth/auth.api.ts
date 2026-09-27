import {api} from '../../api/axios';
import type {
    LoginRequest,
    LoginResponse
} from './auth.types';

export async function login(data : LoginRequest) : Promise<LoginResponse>{
    const result = await api.post("/auth/login", data);
    return result.data;
}
