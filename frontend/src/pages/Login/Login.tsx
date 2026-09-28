import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { login } from "../../modules/auth/auth.api";
import { useAuth } from "../../modules/auth/useAuth";

export function Login() {
    const navigate = useNavigate();
    const { setUser } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");

        try {
            const response = await login({
                email,
                password
            });

            setUser({
                id: response.id,
                name: response.name,
                email: response.email
            });

            navigate("/dashboard");
        } catch (err) {
            console.error("Login falhou", err);
            setError("Email ou senha inválidos.");
        }
    }

    return (
        <main>
            <section>
                <h1>Bem-vindo ao sistema</h1>
                <p>Gerencie as informações da sua empresa em um só lugar.</p>
            </section>

            <section>
                <h2>Entrar</h2>

                <form onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="email">
                            Email
                        </label>

                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="password">
                            Senha
                        </label>

                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            required
                        />
                    </div>

                    {error && (
                        <p role="alert">
                            {error}
                        </p>
                    )}

                    <button type="submit">
                        Entrar
                    </button>
                </form>
            </section>
        </main>
    );
}
