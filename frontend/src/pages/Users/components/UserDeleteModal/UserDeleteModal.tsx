import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTriangleExclamation, faTrash } from "@fortawesome/free-solid-svg-icons";

import { Modal } from "../../../../components/Modal/Modal";
import type { User } from "../../../../modules/users/users.types";

import "./UserDeleteModal.css";

interface UserDeleteModalProps {
    user: User | null;
    isSubmitting: boolean;
    error: string | null;
    onClose: () => void;
    onConfirm: () => Promise<void>;
}

export function UserDeleteModal({
    user,
    isSubmitting,
    error,
    onClose,
    onConfirm
}: UserDeleteModalProps) {
    return (
        <Modal
            isOpen={user !== null}
            title="Excluir usuário"
            onClose={onClose}
        >
            {user && (
                <div className="user-delete">
                    <div className="user-delete__warning">
                        <FontAwesomeIcon icon={faTriangleExclamation} />

                        <div>
                            <p className="user-delete__title">
                                Tem certeza que deseja excluir este usuário?
                            </p>

                            <p className="user-delete__description">
                                O usuário <strong>{user.name}</strong> perderá o acesso ao sistema.
                                Esta ação não pode ser desfeita.
                            </p>
                        </div>
                    </div>

                    {error && (
                        <p className="user-delete__error" role="alert">
                            {error}
                        </p>
                    )}

                    <div className="user-delete__actions">
                        <button
                            className="user-delete__cancel"
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            Cancelar
                        </button>

                        <button
                            className="user-delete__confirm"
                            type="button"
                            onClick={onConfirm}
                            disabled={isSubmitting}
                        >
                            <FontAwesomeIcon icon={faTrash} />
                            {isSubmitting ? "Excluindo..." : "Excluir usuário"}
                        </button>
                    </div>
                </div>
            )}
        </Modal>
    );
}
