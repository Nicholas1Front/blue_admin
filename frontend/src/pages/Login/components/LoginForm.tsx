import type { FormEvent } from "react";
import { useState } from "react";

import { login } from "../../../modules/auth/auth.api";
import { useAuth } from "../../../modules/auth/useAuth";
import { EmailField } from "./EmailField";
import { PasswordField } from "./PasswordField";

interface LoginFormProps {
    onSuccess: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
    const { setUser } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");

        try {
            const response = await login({ email, password });

            setUser({
                id: response.id,
                name: response.name,
                email: response.email
            });

            onSuccess();
        } catch (err) {
            console.error("Login falhou", err);
            setError("Email ou senha inválidos.");
        }
    }

    return (
        <form onSubmit={handleSubmit}>
            <EmailField value={email} onChange={setEmail} />
            <PasswordField value={password} onChange={setPassword} />

            {error && <p role="alert">{error}</p>}

            <button type="submit">
                Entrar
            </button>
        </form>
    );
}
