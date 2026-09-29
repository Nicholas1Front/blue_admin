import { useCallback, useState } from "react";

import {
    getUsers,
    updateUser
} from "./users.api";
import type {
    UpdateUserRequest,
    User
} from "./users.types";

interface UseUsersReturn {
    users: User[];
    isLoading: boolean;
    isUpdating: boolean;
    error: string | null;
    updateError: string | null;
    loadUsers: () => Promise<void>;
    editUser: (
        id: string,
        data: UpdateUserRequest
    ) => Promise<void>;
}

export function useUsers(): UseUsersReturn {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [error, setError] = useState<string | null>(null);
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
        isUpdating,
        error,
        updateError,
        loadUsers,
        editUser
    };
}
