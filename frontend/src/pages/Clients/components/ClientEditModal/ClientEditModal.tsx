import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Modal } from "../../../../components/Modal/Modal";
import {
    updateClientSchema,
    type ClientFormData
} from "../../schemas/clients.schema";
import type {
    Client,
    UpdateClientRequest
} from "../../../../modules/clients/clients.types";

import "./ClientEditModal.css";

interface ClientEditModalProps {
    client: Client | null;
    isSubmitting: boolean;
    error: string | null;
    onClose: () => void;
    onSubmit: (data: UpdateClientRequest) => Promise<void>;
}

export function ClientEditModal({
    client,
    isSubmitting,
    error,
    onClose,
    onSubmit
}: ClientEditModalProps) {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isDirty }
    } = useForm<ClientFormData>({
        resolver: zodResolver(updateClientSchema),
        defaultValues: {
            name: "",
            document: "",
            address: ""
        }
    });

    useEffect(() => {
        if (!client) {
            return;
        }

        reset({
            name: client.name,
            document: client.document ?? "",
            address: client.address ?? ""
        });
    }, [client, reset]);

    async function handleFormSubmit(data: ClientFormData) {
        if (!client) {
            return;
        }

        const updateData: UpdateClientRequest = {};

        if (data.name.trim() !== client.name) {
            updateData.name = data.name.trim();
        }

        const document = data.document.trim() || null;
        if (document !== client.document) {
            updateData.document = document;
        }

        const address = data.address.trim() || null;
        if (address !== client.address) {
            updateData.address = address;
        }

        if (Object.keys(updateData).length === 0) {
            return;
        }

        await onSubmit(updateData);
    }

    return (
        <Modal isOpen={client !== null} title="Editar cliente" onClose={onClose}>
            <form className="client-form" onSubmit={handleSubmit(handleFormSubmit)}>
                <div className="client-form__field">
                    <label htmlFor="edit-client-name">Nome</label>
                    <input id="edit-client-name" type="text" {...register("name")} disabled={isSubmitting} />
                    {errors.name && <span className="client-form__error">{errors.name.message}</span>}
                </div>

                <div className="client-form__field">
                    <label htmlFor="edit-client-document">CPF/CNPJ</label>
                    <input id="edit-client-document" type="text" {...register("document")} disabled={isSubmitting} />
                    {errors.document && <span className="client-form__error">{errors.document.message}</span>}
                </div>

                <div className="client-form__field">
                    <label htmlFor="edit-client-address">Endereço</label>
                    <input id="edit-client-address" type="text" {...register("address")} disabled={isSubmitting} />
                    {errors.address && <span className="client-form__error">{errors.address.message}</span>}
                </div>

                {error && <p className="client-form__api-error" role="alert">{error}</p>}

                <div className="client-form__actions">
                    <button className="client-form__cancel" type="button" onClick={onClose} disabled={isSubmitting}>
                        Cancelar
                    </button>
                    <button className="client-form__submit" type="submit" disabled={isSubmitting || !isDirty}>
                        {isSubmitting ? "Salvando..." : "Salvar alterações"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
