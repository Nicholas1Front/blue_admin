import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope } from "@fortawesome/free-solid-svg-icons";

interface EmailFieldProps {
    value: string;
    onChange: (value: string) => void;
}

export function EmailField({ value, onChange }: EmailFieldProps) {
    return (
        <div className="login-field">
            <label htmlFor="email">
                Email
            </label>

            <div className="login-field__control">
                <FontAwesomeIcon
                    className="login-field__icon"
                    icon={faEnvelope}
                    aria-hidden="true"
                />

                <input
                    id="email"
                    name="email"
                    type="email"
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    placeholder="seu@email.com"
                    autoComplete="email"
                    required
                />
            </div>
        </div>
    );
}
