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
    message : string,
    data : {
        token : string,
        id : string,
        name : string,
        email : string
    }
}