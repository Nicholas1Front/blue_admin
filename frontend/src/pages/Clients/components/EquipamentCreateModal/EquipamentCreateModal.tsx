import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Modal } from "../../../../components/Modal/Modal";
import { equipamentSchema, type EquipamentFormData } from "../../schemas/equipaments.schema";
import type { CreateEquipamentRequest } from "../../../../modules/equipaments/equipaments.types";

import "./EquipamentCreateModal.css";

interface Props { clientId: string; isOpen: boolean; isSubmitting: boolean; error: string | null; onClose: () => void; onSubmit: (data: CreateEquipamentRequest) => Promise<void>; }

export function EquipamentCreateModal({ clientId, isOpen, isSubmitting, error, onClose, onSubmit }: Props) {
    const { register, handleSubmit, reset, formState: { errors } } = useForm<EquipamentFormData>({
        resolver: zodResolver(equipamentSchema),
        defaultValues: { type: "", brand: "", model: "", mainIdentification: "", additionalIdentification: "" }
    });
    useEffect(() => { if (isOpen) reset({ type: "", brand: "", model: "", mainIdentification: "", additionalIdentification: "" }); }, [isOpen, reset]);

    async function handleFormSubmit(data: EquipamentFormData) {
        if (!clientId) return;

        await onSubmit({
            type: data.type.trim(),
            brand: data.brand.trim(),
            model: data.model.trim() || null,
            mainIdentification: data.mainIdentification.trim() || null,
            additionalIdentification: data.additionalIdentification.trim() || null
        });
        reset();
    }

    return <Modal isOpen={isOpen} title="Adicionar equipamento" onClose={onClose}>
        <form className="entity-form" onSubmit={handleSubmit(handleFormSubmit)}>
            <div className="entity-form__field"><label htmlFor="create-equipament-type">Tipo</label><input id="create-equipament-type" {...register("type")} disabled={isSubmitting}/>{errors.type && <span className="entity-form__error">{errors.type.message}</span>}</div>
            <div className="entity-form__field"><label htmlFor="create-equipament-brand">Marca</label><input id="create-equipament-brand" {...register("brand")} disabled={isSubmitting}/>{errors.brand && <span className="entity-form__error">{errors.brand.message}</span>}</div>
            <div className="entity-form__field"><label htmlFor="create-equipament-model">Modelo</label><input id="create-equipament-model" {...register("model")} disabled={isSubmitting}/></div>
            <div className="entity-form__field"><label htmlFor="create-equipament-main-identification">Identificação</label><input id="create-equipament-main-identification" {...register("mainIdentification")} disabled={isSubmitting}/>{errors.mainIdentification && <span className="entity-form__error">{errors.mainIdentification.message}</span>}</div>
            <div className="entity-form__field"><label htmlFor="create-equipament-additional-identification">Identificação adicional</label><input id="create-equipament-additional-identification" {...register("additionalIdentification")} disabled={isSubmitting}/></div>
            {error && <p className="entity-form__api-error" role="alert">{error}</p>}
            <div className="entity-form__actions"><button className="entity-form__cancel" type="button" onClick={onClose} disabled={isSubmitting}>Cancelar</button><button className="entity-form__submit entity-form__submit--success" type="submit" disabled={isSubmitting}>{isSubmitting ? "Adicionando..." : "Adicionar equipamento"}</button></div>
        </form>
    </Modal>;
}
