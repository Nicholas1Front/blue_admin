import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTriangleExclamation, faTrash } from "@fortawesome/free-solid-svg-icons";
import { Modal } from "../../../../components/Modal/Modal";
import type { ClientContact } from "../../../../modules/clients/clients.types";
import "./ContactDeleteModal.css";

interface Props { contact: ClientContact | null; isSubmitting: boolean; error: string | null; onClose: () => void; onConfirm: () => Promise<void>; }

export function ContactDeleteModal({ contact, isSubmitting, error, onClose, onConfirm }: Props) {
    return <Modal isOpen={contact !== null} title="Excluir contato" onClose={onClose}>
        {contact && <div className="entity-delete">
            <div className="entity-delete__warning"><FontAwesomeIcon icon={faTriangleExclamation}/><div><p className="entity-delete__title">Tem certeza que deseja excluir este contato?</p><p className="entity-delete__description">O contato <strong>{contact.name}</strong> será excluído. Esta ação não pode ser desfeita.</p></div></div>
            {error && <p className="entity-delete__error" role="alert">{error}</p>}
            <div className="entity-delete__actions"><button className="entity-delete__cancel" type="button" onClick={onClose} disabled={isSubmitting}>Cancelar</button><button className="entity-delete__confirm" type="button" onClick={onConfirm} disabled={isSubmitting}><FontAwesomeIcon icon={faTrash}/>{isSubmitting ? "Excluindo..." : "Excluir contato"}</button></div>
        </div>}
    </Modal>;
}
