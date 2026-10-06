import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Modal } from "../../../../components/Modal/Modal";
import { contactSchema, type ContactFormData } from "../../schemas/contacts.schema";
import type { CreateContactRequest } from "../../../../modules/clients/clients.types";

import "./ContactCreateModal.css";

interface Props {
    isOpen: boolean;
    isSubmitting: boolean;
    error: string | null;
    onClose: () => void;
    onSubmit: (data: CreateContactRequest) => Promise<void>;
}

export function ContactCreateModal({ isOpen, isSubmitting, error, onClose, onSubmit }: Props) {
    const { register, handleSubmit, reset, formState: { errors } } = useForm<ContactFormData>({
        resolver: zodResolver(contactSchema),
        defaultValues: { name: "", email: "", phoneNumber: "" }
    });

    useEffect(() => {
        if (isOpen) reset({ name: "", email: "", phoneNumber: "" });
    }, [isOpen, reset]);

    async function handleFormSubmit(data: ContactFormData) {
        await onSubmit({
            name: data.name.trim(),
            email: data.email.trim() || null,
            phoneNumber: data.phoneNumber.trim()
        });
        reset();
    }

    return (
        <Modal isOpen={isOpen} title="Adicionar contato" onClose={onClose}>
            <form className="entity-form" onSubmit={handleSubmit(handleFormSubmit)}>
                <div className="entity-form__field"><label htmlFor="create-contact-name">Nome</label><input id="create-contact-name" {...register("name")} disabled={isSubmitting} />{errors.name && <span className="entity-form__error">{errors.name.message}</span>}</div>
                <div className="entity-form__field"><label htmlFor="create-contact-email">E-mail</label><input id="create-contact-email" type="email" {...register("email")} disabled={isSubmitting} />{errors.email && <span className="entity-form__error">{errors.email.message}</span>}</div>
                <div className="entity-form__field"><label htmlFor="create-contact-phone">Telefone</label><input id="create-contact-phone" {...register("phoneNumber")} disabled={isSubmitting} />{errors.phoneNumber && <span className="entity-form__error">{errors.phoneNumber.message}</span>}</div>
                {error && <p className="entity-form__api-error" role="alert">{error}</p>}
                <div className="entity-form__actions"><button className="entity-form__cancel" type="button" onClick={onClose} disabled={isSubmitting}>Cancelar</button><button className="entity-form__submit entity-form__submit--success" type="submit" disabled={isSubmitting}>{isSubmitting ? "Adicionando..." : "Adicionar contato"}</button></div>
            </form>
        </Modal>
    );
}
