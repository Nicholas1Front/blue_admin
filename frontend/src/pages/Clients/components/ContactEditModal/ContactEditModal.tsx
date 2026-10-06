import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Modal } from "../../../../components/Modal/Modal";
import { contactSchema, type ContactFormData } from "../../schemas/contacts.schema";
import type { ClientContact, UpdateContactRequest } from "../../../../modules/clients/clients.types";

import "./ContactEditModal.css";

interface Props {
    contact: ClientContact | null;
    isSubmitting: boolean;
    error: string | null;
    onClose: () => void;
    onSubmit: (data: UpdateContactRequest) => Promise<void>;
}

export function ContactEditModal({ contact, isSubmitting, error, onClose, onSubmit }: Props) {
    const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<ContactFormData>({
        resolver: zodResolver(contactSchema),
        defaultValues: { name: "", email: "", phoneNumber: "" }
    });

    useEffect(() => {
        if (contact) reset({ name: contact.name, email: contact.email ?? "", phoneNumber: contact.phoneNumber });
    }, [contact, reset]);

    async function handleFormSubmit(data: ContactFormData) {
        if (!contact) return;

        const updateData: UpdateContactRequest = {};

        if (data.name.trim() !== contact.name) {
            updateData.name = data.name.trim();
        }

        const email = (data.email ?? "").trim() || null;

        if (email !== contact.email) {
            updateData.email = email;
        }

        if (data.phoneNumber.trim() !== contact.phoneNumber) {
            updateData.phoneNumber = data.phoneNumber.trim();
        }

        if (Object.keys(updateData).length === 0) return;

        await onSubmit(updateData);
    }

    return (
        <Modal isOpen={contact !== null} title="Editar contato" onClose={onClose}>
            <form className="entity-form" onSubmit={handleSubmit(handleFormSubmit)}>
                <div className="entity-form__field"><label htmlFor="edit-contact-name">Nome</label><input id="edit-contact-name" {...register("name")} disabled={isSubmitting} />{errors.name && <span className="entity-form__error">{errors.name.message}</span>}</div>
                <div className="entity-form__field"><label htmlFor="edit-contact-email">E-mail</label><input id="edit-contact-email" type="email" {...register("email")} disabled={isSubmitting} />{errors.email && <span className="entity-form__error">{errors.email.message}</span>}</div>
                <div className="entity-form__field"><label htmlFor="edit-contact-phone">Telefone</label><input id="edit-contact-phone" {...register("phoneNumber")} disabled={isSubmitting} />{errors.phoneNumber && <span className="entity-form__error">{errors.phoneNumber.message}</span>}</div>
                {error && <p className="entity-form__api-error" role="alert">{error}</p>}
                <div className="entity-form__actions"><button className="entity-form__cancel" type="button" onClick={onClose} disabled={isSubmitting}>Cancelar</button><button className="entity-form__submit" type="submit" disabled={isSubmitting || !isDirty}>{isSubmitting ? "Salvando..." : "Salvar alterações"}</button></div>
            </form>
        </Modal>
    );
}
