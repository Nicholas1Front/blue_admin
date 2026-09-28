import { useEffect } from "react";

import { AppHeader } from "../../components/AppHeader/AppHeader";
import { useUsers } from "../../modules/users/useUsers";
import { UserList } from "./components/UserList/UserList";

import "./Users.css";

export function Users() {
    const {
        users,
        isLoading,
        error,
        loadUsers,
    } = useUsers();

    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

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
                        onEdit={() => {}}
                    />
                )}
            </section>
        </main>
    );
}
