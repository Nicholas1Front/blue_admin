import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";

import { Modal } from "../../../../components/Modal/Modal";
import { updateUserSchema, type UpdateUserFormData } from "../../schemas/users.schema";
import type {
    UpdateUserRequest,
    User
} from "../../../../modules/users/users.types";

import "./UserEditModal.css";

interface UserEditModalProps {
    user: User | null;
    isSubmitting: boolean;
    error: string | null;
    onClose: () => void;
    onSubmit: (data: UpdateUserRequest) => Promise<void>;
}

export function UserEditModal({
    user,
    isSubmitting,
    error,
    onClose,
    onSubmit
}: UserEditModalProps) {
    const [showPassword, setShowPassword] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isDirty }
    } = useForm<UpdateUserFormData>({
        resolver: zodResolver(updateUserSchema),
        defaultValues: {
            name: "",
            email: "",
            password: ""
        }
    });

    useEffect(() => {
        if (!user) {
            return;
        }

        reset({
            name: user.name,
            email: user.email,
            password: ""
        });
        setShowPassword(false);
    }, [user, reset]);

    async function handleFormSubmit(data: UpdateUserFormData) {
        if (!user) {
            return;
        }

        const updateData: UpdateUserRequest = {};

        if (data.name !== user.name) {
            updateData.name = data.name;
        }

        if (data.email !== user.email) {
            updateData.email = data.email;
        }

        if (data.password) {
            updateData.password = data.password;
        }

        if (Object.keys(updateData).length === 0) {
            return;
        }

        await onSubmit(updateData);
    }

    return (
        <Modal
            isOpen={user !== null}
            title="Editar usuário"
            onClose={onClose}
        >
            <form
                className="user-edit-form"
                onSubmit={handleSubmit(handleFormSubmit)}
            >
                <div className="user-edit-form__field">
                    <label htmlFor="user-name">Nome</label>
                    <input
                        id="user-name"
                        type="text"
                        {...register("name")}
                        disabled={isSubmitting}
                    />
                    {errors.name && (
                        <span className="user-edit-form__error">
                            {errors.name.message}
                        </span>
                    )}
                </div>

                <div className="user-edit-form__field">
                    <label htmlFor="user-email">E-mail</label>
                    <input
                        id="user-email"
                        type="email"
                        {...register("email")}
                        disabled={isSubmitting}
                    />
                    {errors.email && (
                        <span className="user-edit-form__error">
                            {errors.email.message}
                        </span>
                    )}
                </div>

                <div className="user-edit-form__field">
                    <label htmlFor="user-password">Nova senha</label>

                    <div className="user-edit-form__password">
                        <input
                            id="user-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Deixe vazio para manter a senha atual"
                            {...register("password")}
                            disabled={isSubmitting}
                        />
                        <button
                            className="user-edit-form__password-toggle"
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
                        <span className="user-edit-form__error">
                            {errors.password.message}
                        </span>
                    )}
                </div>

                {error && (
                    <p className="user-edit-form__api-error" role="alert">
                        {error}
                    </p>
                )}

                <div className="user-edit-form__actions">
                    <button
                        className="user-edit-form__cancel"
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                    >
                        Cancelar
                    </button>
                    <button
                        className="user-edit-form__submit"
                        type="submit"
                        disabled={isSubmitting || !isDirty}
                    >
                        {isSubmitting ? "Salvando..." : "Salvar alterações"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}