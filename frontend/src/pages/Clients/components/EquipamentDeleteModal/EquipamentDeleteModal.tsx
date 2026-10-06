import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTriangleExclamation, faTrash } from "@fortawesome/free-solid-svg-icons";
import { Modal } from "../../../../components/Modal/Modal";
import type { Equipament } from "../../../../modules/equipaments/equipaments.types";
import "./EquipamentDeleteModal.css";

interface Props { equipament: Equipament | null; isSubmitting: boolean; error: string | null; onClose: () => void; onConfirm: () => Promise<void>; }

export function EquipamentDeleteModal({ equipament, isSubmitting, error, onClose, onConfirm }: Props) {
    const title = equipament ? [equipament.type, equipament.brand, equipament.model, equipament.mainIdentification, equipament.additionalIdentification].filter((value): value is string => Boolean(value)).join(" ") : "";
    return <Modal isOpen={equipament !== null} title="Excluir equipamento" onClose={onClose}>
        {equipament && <div className="entity-delete">
            <div className="entity-delete__warning"><FontAwesomeIcon icon={faTriangleExclamation}/><div><p className="entity-delete__title">Tem certeza que deseja excluir este equipamento?</p><p className="entity-delete__description">O equipamento <strong>{title}</strong> será excluído. Esta ação não pode ser desfeita.</p></div></div>
            {error && <p className="entity-delete__error" role="alert">{error}</p>}
            <div className="entity-delete__actions"><button className="entity-delete__cancel" type="button" onClick={onClose} disabled={isSubmitting}>Cancelar</button><button className="entity-delete__confirm" type="button" onClick={onConfirm} disabled={isSubmitting}><FontAwesomeIcon icon={faTrash}/>{isSubmitting ? "Excluindo..." : "Excluir equipamento"}</button></div>
        </div>}
    </Modal>;
}
