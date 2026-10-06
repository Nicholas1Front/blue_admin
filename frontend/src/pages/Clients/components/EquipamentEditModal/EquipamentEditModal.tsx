import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Modal } from "../../../../components/Modal/Modal";
import { equipamentSchema, type EquipamentFormData } from "../../schemas/equipaments.schema";
import type { Equipament, UpdateEquipamentRequest } from "../../../../modules/equipaments/equipaments.types";

import "./EquipamentEditModal.css";

interface Props { equipament: Equipament | null; isSubmitting: boolean; error: string | null; onClose: () => void; onSubmit: (data: UpdateEquipamentRequest) => Promise<void>; }

export function EquipamentEditModal({ equipament, isSubmitting, error, onClose, onSubmit }: Props) {
    const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<EquipamentFormData>({
        resolver: zodResolver(equipamentSchema),
        defaultValues: { type: "", brand: "", model: "", mainIdentification: "", additionalIdentification: "" }
    });
    useEffect(() => { if (equipament) reset({ type: equipament.type, brand: equipament.brand, model: equipament.model ?? "", mainIdentification: equipament.mainIdentification ?? "", additionalIdentification: equipament.additionalIdentification ?? "" }); }, [equipament, reset]);

    async function handleFormSubmit(data: EquipamentFormData) {
        if (!equipament) return;
        const updateData: UpdateEquipamentRequest = {};
        if (data.type.trim() !== equipament.type) updateData.type = data.type.trim();
        if (data.brand.trim() !== equipament.brand) updateData.brand = data.brand.trim();
        const model = data.model.trim() || null;
        if (model !== equipament.model) updateData.model = model;
        const mainIdentification = data.mainIdentification.trim() || null;
        if (mainIdentification !== equipament.mainIdentification) updateData.mainIdentification = mainIdentification;
        const additionalIdentification = data.additionalIdentification.trim() || null;
        if (additionalIdentification !== equipament.additionalIdentification) updateData.additionalIdentification = additionalIdentification;
        if (Object.keys(updateData).length === 0) return;
        await onSubmit(updateData);
    }

    return <Modal isOpen={equipament !== null} title="Editar equipamento" onClose={onClose}>
        <form className="entity-form" onSubmit={handleSubmit(handleFormSubmit)}>
            <div className="entity-form__field"><label htmlFor="edit-equipament-type">Tipo</label><input id="edit-equipament-type" {...register("type")} disabled={isSubmitting}/>{errors.type && <span className="entity-form__error">{errors.type.message}</span>}</div>
            <div className="entity-form__field"><label htmlFor="edit-equipament-brand">Marca</label><input id="edit-equipament-brand" {...register("brand")} disabled={isSubmitting}/>{errors.brand && <span className="entity-form__error">{errors.brand.message}</span>}</div>
            <div className="entity-form__field"><label htmlFor="edit-equipament-model">Modelo</label><input id="edit-equipament-model" {...register("model")} disabled={isSubmitting}/></div>
            <div className="entity-form__field"><label htmlFor="edit-equipament-main-identification">Identificação</label><input id="edit-equipament-main-identification" {...register("mainIdentification")} disabled={isSubmitting}/>{errors.mainIdentification && <span className="entity-form__error">{errors.mainIdentification.message}</span>}</div>
            <div className="entity-form__field"><label htmlFor="edit-equipament-additional-identification">Identificação adicional</label><input id="edit-equipament-additional-identification" {...register("additionalIdentification")} disabled={isSubmitting}/></div>
            {error && <p className="entity-form__api-error" role="alert">{error}</p>}
            <div className="entity-form__actions"><button className="entity-form__cancel" type="button" onClick={onClose} disabled={isSubmitting}>Cancelar</button><button className="entity-form__submit" type="submit" disabled={isSubmitting || !isDirty}>{isSubmitting ? "Salvando..." : "Salvar alterações"}</button></div>
        </form>
    </Modal>;
}
