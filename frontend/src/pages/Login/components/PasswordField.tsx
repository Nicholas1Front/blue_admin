import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faEye,
    faEyeSlash,
    faLock
} from "@fortawesome/free-solid-svg-icons";

interface PasswordFieldProps {
    value: string;
    onChange: (value: string) => void;
}

export function PasswordField({ value, onChange }: PasswordFieldProps) {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className="login-field">
            <label htmlFor="password">
                Senha
            </label>

            <div className="login-field__control">
                <FontAwesomeIcon
                    className="login-field__icon"
                    icon={faLock}
                    aria-hidden="true"
                />

                <input
                    className="login-password__input"
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    placeholder="Digite sua senha"
                    autoComplete="current-password"
                    required
                />

                <button
                    className="login-password__toggle"
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    title={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                    <FontAwesomeIcon
                        icon={showPassword ? faEyeSlash : faEye}
                        aria-hidden="true"
                    />
                </button>
            </div>
        </div>
    );
}
