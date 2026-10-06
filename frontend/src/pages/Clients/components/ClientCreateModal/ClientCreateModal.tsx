import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Modal } from "../../../../components/Modal/Modal";
import {
    createClientSchema,
    type ClientFormData
} from "../../schemas/clients.schema";
import type { CreateClientRequest } from "../../../../modules/clients/clients.types";

import "./ClientCreateModal.css";

interface ClientCreateModalProps {
    isOpen: boolean;
    isSubmitting: boolean;
    error: string | null;
    onClose: () => void;
    onSubmit: (data: CreateClientRequest) => Promise<void>;
}

export function ClientCreateModal({
    isOpen,
    isSubmitting,
    error,
    onClose,
    onSubmit
}: ClientCreateModalProps) {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm<ClientFormData>({
        resolver: zodResolver(createClientSchema),
        defaultValues: {
            name: "",
            document: "",
            address: ""
        }
    });

    useEffect(() => {
        if (isOpen) {
            reset({
                name: "",
                document: "",
                address: ""
            });
        }
    }, [isOpen, reset]);

    async function handleFormSubmit(data: ClientFormData) {
        await onSubmit({
            name: data.name.trim(),
            document: data.document.trim() || null,
            address: data.address.trim() || undefined
        });
        reset();
    }

    return (
        <Modal isOpen={isOpen} title="Adicionar cliente" onClose={onClose}>
            <form className="client-form" onSubmit={handleSubmit(handleFormSubmit)}>
                <div className="client-form__field">
                    <label htmlFor="create-client-name">Nome</label>
                    <input
                        id="create-client-name"
                        type="text"
                        {...register("name")}
                        disabled={isSubmitting}
                        autoComplete="organization"
                    />
                    {errors.name && <span className="client-form__error">{errors.name.message}</span>}
                </div>

                <div className="client-form__field">
                    <label htmlFor="create-client-document">CPF/CNPJ</label>
                    <input
                        id="create-client-document"
                        type="text"
                        {...register("document")}
                        disabled={isSubmitting}
                    />
                    {errors.document && <span className="client-form__error">{errors.document.message}</span>}
                </div>

                <div className="client-form__field">
                    <label htmlFor="create-client-address">Endereço</label>
                    <input
                        id="create-client-address"
                        type="text"
                        {...register("address")}
                        disabled={isSubmitting}
                    />
                    {errors.address && <span className="client-form__error">{errors.address.message}</span>}
                </div>

                {error && <p className="client-form__api-error" role="alert">{error}</p>}

                <div className="client-form__actions">
                    <button className="client-form__cancel" type="button" onClick={onClose} disabled={isSubmitting}>
                        Cancelar
                    </button>
                    <button className="client-form__submit client-form__submit--success" type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Adicionando..." : "Adicionar cliente"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
