import { useCallback, useState } from "react";

import { getUsers } from "./users.api";
import type { User } from "./users.types";

interface UseUsersReturn {
    users: User[];
    isLoading: boolean;
    error: string | null;
    loadUsers: () => Promise<void>;
}

export function useUsers(): UseUsersReturn {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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

    return {
        users,
        isLoading,
        error,
        loadUsers,
    };
}
