import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare } from "@fortawesome/free-solid-svg-icons";

import type { User } from "../../../../modules/users/users.types";

import "./UserList.css";

interface UserListProps {
    users: User[];
    onEdit: (user: User) => void;
}

export function UserList({ users, onEdit }: UserListProps) {
    return (
        <section className="user-list">
            <header className="user-list__header">
                <div>
                    <span className="user-list__eyebrow">
                        Usuários cadastrados
                    </span>

                    <h2>Lista de usuários</h2>
                </div>

                <span className="user-list__count">
                    {users.length} {users.length === 1 ? "usuário" : "usuários"}
                </span>
            </header>

            <div className="user-list__items">
                {users.map((user) => (
                    <article className="user-list__card" key={user.id}>
                        <div className="user-list__info">
                            <div className="user-list__identity">
                                <span className="user-list__name">
                                    {user.name}
                                </span>

                                <span className="user-list__email">
                                    {user.email}
                                </span>
                            </div>

                            <span className="user-list__id">
                                ID: {user.id}
                            </span>
                        </div>

                        <button
                            className="user-list__edit"
                            type="button"
                            onClick={() => onEdit(user)}
                            aria-label={"Editar usuário " + user.name}
                            title="Editar usuário"
                        >
                            <FontAwesomeIcon icon={faPenToSquare} />
                            <span>Editar</span>
                        </button>
                    </article>
                ))}
            </div>
        </section>
    );
}
