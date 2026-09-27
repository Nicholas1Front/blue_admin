export interface AuthUser {
    id : string,
    name : string,
    email : string
}

export interface LoginRequest {
    email : string,
    password : string
}

export interface LoginResponse {
    id : string,
    name : string,
    email : string,
    token : string
}