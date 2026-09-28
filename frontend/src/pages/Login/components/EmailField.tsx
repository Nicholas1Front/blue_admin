interface EmailFieldProps {
    value: string;
    onChange: (value: string) => void;
}

export function EmailField({ value, onChange }: EmailFieldProps) {
    return (
        <div>
            <label htmlFor="email">
                Email
            </label>

            <input
                id="email"
                name="email"
                type="email"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                required
            />
        </div>
    );
}
