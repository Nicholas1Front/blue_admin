import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye } from "@fortawesome/free-solid-svg-icons";

import type { User } from "../../../../modules/users/users.types";

import "./UserViewModal.css";
import { Modal } from "../../../../components/Modal/Modal";

interface UserViewModalProps {
    user: User | null;
    onClose: () => void;
}

function formatDate(value: string): string {
    return new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "medium",
        timeStyle: "short"
    }).format(new Date(value));
}

export function UserViewModal({
    user,
    onClose
}: UserViewModalProps) {
    return (
        <Modal
            isOpen={user !== null}
            title="Detalhes do usuário"
            onClose={onClose}
        >
            {user && (
                <div className="user-view">
                    <div className="user-view__item">
                        <span className="user-view__label">Nome</span>
                        <span className="user-view__value">{user.name}</span>
                    </div>

                    <div className="user-view__item">
                        <span className="user-view__label">E-mail</span>
                        <span className="user-view__value">{user.email}</span>
                    </div>

                    <div className="user-view__item">
                        <span className="user-view__label">ID</span>
                        <span className="user-view__value user-view__value--id">
                            {user.id}
                        </span>
                    </div>

                    <div className="user-view__item">
                        <span className="user-view__label">Criado em</span>
                        <span className="user-view__value">
                            {formatDate(user.createdAt)}
                        </span>
                    </div>

                    <div className="user-view__item">
                        <span className="user-view__label">Última atualização</span>
                        <span className="user-view__value">
                            {formatDate(user.updatedAt)}
                        </span>
                    </div>

                    <div className="user-view__note">
                        <FontAwesomeIcon icon={faEye} />
                        <span>
                            A senha não é exibida por segurança.
                        </span>
                    </div>
                </div>
            )}
        </Modal>
    );
}
