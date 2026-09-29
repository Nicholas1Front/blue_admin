import { useEffect, useState } from "react";

import { AppHeader } from "../../components/AppHeader/AppHeader";
import { useAuth } from "../../modules/auth/useAuth";
import { useUsers } from "../../modules/users/useUsers";
import type {
    CreateUserRequest,
    User
} from "../../modules/users/users.types";
import { UserCreateModal } from "./components/UserCreateModal/UserCreateModal";
import { UserDeleteModal } from "./components/UserDeleteModal/UserDeleteModal";
import { UserEditModal } from "./components/UserEditModal/UserEditModal";
import { UserList } from "./components/UserList/UserList";
import { UserSearch } from "./components/UserSearch/UserSearch";
import { UserSearchResults } from "./components/UserSearchResults/UserSearchResults";
import { UserViewModal } from "./components/UserViewModal/UserViewModal";

import "./Users.css";

export function Users() {
    const {
        user: authenticatedUser,
        updateAuthenticatedUser
    } = useAuth();

    const {
        users,
        searchResults,
        isLoading,
        isCreating,
        isUpdating,
        isDeleting,
        isSearching,
        error,
        createError,
        updateError,
        deleteError,
        searchError,
        hasSearched,
        loadUsers,
        searchUsers,
        clearSearch,
        clearCreateError,
        clearUpdateError,
        clearDeleteError,
        addUser,
        editUser,
        removeUser
    } = useUsers();

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [viewingUser, setViewingUser] = useState<User | null>(null);
    const [deletingUser, setDeletingUser] = useState<User | null>(null);

    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    function handleCloseEdit() {
        if (isUpdating) {
            return;
        }

        setSelectedUser(null);
    }

    function handleCloseDelete() {
        if (isDeleting) {
            return;
        }

        setDeletingUser(null);
    }

    async function handleCreateUser(data: CreateUserRequest) {
        await addUser(data);
        setIsCreateModalOpen(false);
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

    async function handleDeleteUser() {
        if (!deletingUser) {
            return;
        }

        await removeUser(deletingUser.id);
        setDeletingUser(null);
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
                    <>
                        <UserList
                            users={users}
                            onView={setViewingUser}
                            onEdit={(user) => {
                                clearUpdateError();
                                setSelectedUser(user);
                            }}
                            onDelete={(user) => {
                                clearDeleteError();
                                setDeletingUser(user);
                            }}
                        />

                        <UserSearch
                            isSearching={isSearching}
                            onSearch={searchUsers}
                            onClear={clearSearch}
                        />

                        <UserSearchResults
                            users={searchResults}
                            isSearching={isSearching}
                            hasSearched={hasSearched}
                            error={searchError}
                            onView={setViewingUser}
                            onEdit={(user) => {
                                clearUpdateError();
                                setSelectedUser(user);
                            }}
                            onDelete={(user) => {
                                clearDeleteError();
                                setDeletingUser(user);
                            }}
                        />

                        <section className="users-create">
                            <div className="users-create__content">
                                <span className="users-create__eyebrow">
                                    Adição de usuário
                                </span>

                                <h2>Criar novo usuário</h2>

                                <p>
                                    Adicione um novo usuário com acesso ao sistema.
                                </p>
                            </div>

                            <button
                                className="users-create__button"
                                type="button"
                                onClick={() => {
                                    clearCreateError();
                                    setIsCreateModalOpen(true);
                                }}
                            >
                                Criar usuário
                            </button>
                        </section>
                    </>
                )}
            </section>

            <UserViewModal
                user={viewingUser}
                onClose={() => setViewingUser(null)}
            />

            <UserCreateModal
                isOpen={isCreateModalOpen}
                isSubmitting={isCreating}
                error={createError}
                onClose={() => {
                    if (!isCreating) {
                        setIsCreateModalOpen(false);
                    }
                }}
                onSubmit={handleCreateUser}
            />

            <UserEditModal
                user={selectedUser}
                isSubmitting={isUpdating}
                error={updateError}
                onClose={handleCloseEdit}
                onSubmit={handleUpdateUser}
            />

            <UserDeleteModal
                user={deletingUser}
                isSubmitting={isDeleting}
                error={deleteError}
                onClose={handleCloseDelete}
                onConfirm={handleDeleteUser}
            />
        </main>
    );
}
