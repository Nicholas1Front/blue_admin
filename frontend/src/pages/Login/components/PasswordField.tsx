import { useState } from "react";

interface PasswordFieldProps {
    value: string;
    onChange: (value: string) => void;
}

export function PasswordField({ value, onChange }: PasswordFieldProps) {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div>
            <label htmlFor="password">
                Senha
            </label>

            <div>
                <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    required
                />

                <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                    {showPassword ? "Ocultar" : "Mostrar"}
                </button>
            </div>
        </div>
    );
}
