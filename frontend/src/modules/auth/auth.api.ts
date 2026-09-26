import {api} from '../../api/axios';

export interface LoginRequest{
    email : string,
    password : string
}

export async function login(data : LoginRequest) : Promise<any> {
    const response = await api.post('/auth/login', data)

    return response.data
}