import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTriangleExclamation, faTrash } from "@fortawesome/free-solid-svg-icons";

import { Modal } from "../../../../components/Modal/Modal";
import type { Client } from "../../../../modules/clients/clients.types";

import "./ClientDeleteModal.css";

interface ClientDeleteModalProps {
    client: Client | null;
    isSubmitting: boolean;
    error: string | null;
    onClose: () => void;
    onConfirm: () => Promise<void>;
}

export function ClientDeleteModal({
    client,
    isSubmitting,
    error,
    onClose,
    onConfirm
}: ClientDeleteModalProps) {
    return (
        <Modal isOpen={client !== null} title="Excluir cliente" onClose={onClose}>
            {client && (
                <div className="client-delete">
                    <div className="client-delete__warning">
                        <FontAwesomeIcon icon={faTriangleExclamation} />
                        <div>
                            <p className="client-delete__title">Tem certeza que deseja excluir este cliente?</p>
                            <p className="client-delete__description">
                                O cliente <strong>{client.name}</strong> e os dados relacionados a ele serão excluídos.
                                Esta ação não pode ser desfeita.
                            </p>
                        </div>
                    </div>

                    {error && <p className="client-delete__error" role="alert">{error}</p>}

                    <div className="client-delete__actions">
                        <button className="client-delete__cancel" type="button" onClick={onClose} disabled={isSubmitting}>
                            Cancelar
                        </button>
                        <button className="client-delete__confirm" type="button" onClick={onConfirm} disabled={isSubmitting}>
                            <FontAwesomeIcon icon={faTrash} />
                            {isSubmitting ? "Excluindo..." : "Excluir cliente"}
                        </button>
                    </div>
                </div>
            )}
        </Modal>
    );
}
