import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";

import { Modal } from "../../../../components/Modal/Modal";
import {
    createUserSchema,
    type CreateUserFormData
} from "../../schemas/users.schema";
import type { CreateUserRequest } from "../../../../modules/users/users.types";

import "./UserCreateModal.css";

interface UserCreateModalProps {
    isOpen: boolean;
    isSubmitting: boolean;
    error: string | null;
    onClose: () => void;
    onSubmit: (data: CreateUserRequest) => Promise<void>;
}

export function UserCreateModal({
    isOpen,
    isSubmitting,
    error,
    onClose,
    onSubmit
}: UserCreateModalProps) {
    const [showPassword, setShowPassword] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm<CreateUserFormData>({
        resolver: zodResolver(createUserSchema),
        defaultValues: {
            name: "",
            email: "",
            password: ""
        }
    });

    useEffect(() => {
        if (isOpen) {
            reset({
                name: "",
                email: "",
                password: ""
            });
            setShowPassword(false);
        }
    }, [isOpen, reset]);

    async function handleFormSubmit(data: CreateUserFormData) {
        await onSubmit(data);
        reset();
        setShowPassword(false);
    }

    return (
        <Modal
            isOpen={isOpen}
            title="Criar usuário"
            onClose={onClose}
        >
            <form
                className="user-create-form"
                onSubmit={handleSubmit(handleFormSubmit)}
            >
                <div className="user-create-form__field">
                    <label htmlFor="create-user-name">Nome</label>
                    <input
                        id="create-user-name"
                        type="text"
                        {...register("name")}
                        disabled={isSubmitting}
                        autoComplete="name"
                    />
                    {errors.name && (
                        <span className="user-create-form__error">
                            {errors.name.message}
                        </span>
                    )}
                </div>

                <div className="user-create-form__field">
                    <label htmlFor="create-user-email">E-mail</label>
                    <input
                        id="create-user-email"
                        type="email"
                        {...register("email")}
                        disabled={isSubmitting}
                        autoComplete="email"
                    />
                    {errors.email && (
                        <span className="user-create-form__error">
                            {errors.email.message}
                        </span>
                    )}
                </div>

                <div className="user-create-form__field">
                    <label htmlFor="create-user-password">Senha</label>

                    <div className="user-create-form__password">
                        <input
                            id="create-user-password"
                            type={showPassword ? "text" : "password"}
                            {...register("password")}
                            disabled={isSubmitting}
                            autoComplete="new-password"
                        />
                        <button
                            className="user-create-form__password-toggle"
                            type="button"
                            onClick={() => setShowPassword((current) => !current)}
                            disabled={isSubmitting}
                            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                            title={showPassword ? "Ocultar senha" : "Mostrar senha"}
                        >
                            <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                        </button>
                    </div>

                    {errors.password && (
                        <span className="user-create-form__error">
                            {errors.password.message}
                        </span>
                    )}
                </div>

                {error && (
                    <p className="user-create-form__api-error" role="alert">
                        {error}
                    </p>
                )}

                <div className="user-create-form__actions">
                    <button
                        className="user-create-form__cancel"
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                    >
                        Cancelar
                    </button>
                    <button
                        className="user-create-form__submit"
                        type="submit"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Criando..." : "Criar usuário"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}