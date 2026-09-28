import { useEffect } from "react";

import { useUsers } from "../../modules/users/useUsers";

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
                    <p>Carregando usuários...</p>
                )}

                {!isLoading && error && (
                    <div role="alert">
                        <p>{error}</p>
                        <button type="button" onClick={loadUsers}>
                            Tentar novamente
                        </button>
                    </div>
                )}

                {!isLoading && !error && (
                    <section>
                        <p>
                            {users.length}{" "}
                            {users.length === 1 ? "usuário" : "usuários"}
                        </p>

                        <div>
                            {users.map((user) => (
                                <article key={user.id}>
                                    <h2>{user.name}</h2>
                                    <p>{user.email}</p>
                                </article>
                            ))}
                        </div>
                    </section>
                )}
            </section>
        </main>
    );
}
