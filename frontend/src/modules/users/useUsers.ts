import { useCallback, useState } from "react";

import {
    createUser,
    deleteUser,
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
    isDeleting: boolean;
    error: string | null;
    createError: string | null;
    updateError: string | null;
    deleteError: string | null;
    loadUsers: () => Promise<void>;
    addUser: (data: CreateUserRequest) => Promise<User>;
    editUser: (
        id: string,
        data: UpdateUserRequest
    ) => Promise<User>;
    removeUser: (id: string) => Promise<void>;
}

export function useUsers(): UseUsersReturn {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [createError, setCreateError] = useState<string | null>(null);
    const [updateError, setUpdateError] = useState<string | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);

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

    const removeUser = useCallback(
        async (id: string) => {
            setIsDeleting(true);
            setDeleteError(null);

            try {
                await deleteUser(id);

                setUsers((currentUsers) =>
                    currentUsers.filter((user) => user.id !== id)
                );
            } catch (error) {
                const message =
                    error instanceof Error
                        ? error.message
                        : "Não foi possível excluir o usuário.";

                setDeleteError(message);
                throw error;
            } finally {
                setIsDeleting(false);
            }
        },
        []
    );

    return {
        users,
        isLoading,
        isCreating,
        isUpdating,
        isDeleting,
        error,
        createError,
        updateError,
        deleteError,
        loadUsers,
        addUser,
        editUser,
        removeUser
    };
}
