import { useCallback, useState } from "react";

import {
    createUser,
    getUsers,
    updateUser
} from "./users.api";
import type {
    CreateUserRequest,
    UpdateUserRequest,
    User
} from "./users.types";

interface UseUsersReturn {
    users: User[];
    isLoading: boolean;
    isCreating: boolean;
    isUpdating: boolean;
    error: string | null;
    createError: string | null;
    updateError: string | null;
    loadUsers: () => Promise<void>;
    addUser: (data: CreateUserRequest) => Promise<User>;
    editUser: (
        id: string,
        data: UpdateUserRequest
    ) => Promise<User>;
}

export function useUsers(): UseUsersReturn {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [createError, setCreateError] = useState<string | null>(null);
    const [updateError, setUpdateError] = useState<string | null>(null);

    const loadUsers = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const data = await getUsers();
            setUsers(data);
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : "Não foi possível carregar os usuários.";

            setError(message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const addUser = useCallback(
        async (data: CreateUserRequest) => {
            setIsCreating(true);
            setCreateError(null);

            try {
                const newUser = await createUser(data);
                setUsers((currentUsers) => [...currentUsers, newUser]);
                return newUser;
            } catch (error) {
                const message =
                    error instanceof Error
                        ? error.message
                        : "Não foi possível criar o usuário.";

                setCreateError(message);
                throw error;
            } finally {
                setIsCreating(false);
            }
        },
        []
    );

    const editUser = useCallback(
        async (id: string, data: UpdateUserRequest) => {
            setIsUpdating(true);
            setUpdateError(null);

            try {
                const updatedUser = await updateUser(id, data);

                setUsers((currentUsers) =>
                    currentUsers.map((user) =>
                        user.id === updatedUser.id
                            ? updatedUser
                            : user
                    )
                );

                return updatedUser;
            } catch (error) {
                const message =
                    error instanceof Error
                        ? error.message
                        : "Não foi possível atualizar o usuário.";

                setUpdateError(message);
                throw error;
            } finally {
                setIsUpdating(false);
            }
        },
        []
    );

    return {
        users,
        isLoading,
        isCreating,
        isUpdating,
        error,
        createError,
        updateError,
        loadUsers,
        addUser,
        editUser
    };
}
