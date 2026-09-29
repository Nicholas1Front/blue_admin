import { useEffect, useState } from "react";

import { AppHeader } from "../../components/AppHeader/AppHeader";
import { useAuth } from "../../modules/auth/useAuth";
import { useUsers } from "../../modules/users/useUsers";
import type { User } from "../../modules/users/users.types";
import { UserEditModal } from "./components/UserEditModal/UserEditModal";
import { UserViewModal } from "./components/UserViewModal/UserViewModal";
import { UserList } from "./components/UserList/UserList";

import "./Users.css";

export function Users() {
    const {
        user: authenticatedUser,
        updateAuthenticatedUser
    } = useAuth();

    const {
        users,
        isLoading,
        isUpdating,
        error,
        updateError,
        loadUsers,
        editUser
    } = useUsers();

    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [viewingUser, setViewingUser] = useState<User | null>(null);

    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    function handleCloseEdit() {
        if (isUpdating) {
            return;
        }

        setSelectedUser(null);
    }

    async function handleUpdateUser(
        data: Parameters<typeof editUser>[1]
    ) {
        if (!selectedUser) {
            return;
        }

        const updatedUser = await editUser(selectedUser.id, data);

        if (authenticatedUser?.id === updatedUser.id) {
            updateAuthenticatedUser({
                id: updatedUser.id,
                name: updatedUser.name,
                email: updatedUser.email
            });
        }

        setSelectedUser(null);
    }

    return (
        <main className="users-page">
            <AppHeader />

            <section className="users-content">
                <header className="users-header">
                    <div>
                        <span className="users-header__eyebrow">
                            Administração
                        </span>

                        <h1>Usuários</h1>

                        <p>
                            Gerencie os usuários com acesso ao sistema.
                        </p>
                    </div>
                </header>

                {isLoading && (
                    <div className="users-feedback">
                        <p>Carregando usuários...</p>
                    </div>
                )}

                {!isLoading && error && (
                    <div className="users-feedback" role="alert">
                        <p>{error}</p>

                        <button type="button" onClick={loadUsers}>
                            Tentar novamente
                        </button>
                    </div>
                )}

                {!isLoading && !error && (
                    <UserList
                        users={users}
                        onView={setViewingUser}
                        onEdit={setSelectedUser}
                    />
                )}
            </section>

            <UserViewModal
                user={viewingUser}
                onClose={() => setViewingUser(null)}
            />

            <UserEditModal
                user={selectedUser}
                isSubmitting={isUpdating}
                error={updateError}
                onClose={handleCloseEdit}
                onSubmit={handleUpdateUser}
            />
        </main>
    );
}
