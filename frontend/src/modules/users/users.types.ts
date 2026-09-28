export interface User {
    id : string;
    name : string;
    email : string;
    createdAt : string;
    updatedAt : string;
}

export interface CreateUserRequest {
    name : string;
    email : string;
    password : string;
}

export interface UpdateUserRequest {
    name?: string;
    email?: string;
    password?: string;
}

export interface FindUserFilters {
    id?: string;
    name?: string;
    email?: string;
}
