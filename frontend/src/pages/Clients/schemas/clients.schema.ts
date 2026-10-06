import { z } from "zod";

export const createClientSchema = z.object({
    name: z.string().min(1, "Informe o nome."),
    document: z.string().refine(
        (value) => value === "" || (value.length >= 11 && value.length <= 14),
        "O CPF/CNPJ deve ter entre 11 e 14 caracteres."
    ),
    address: z.string()
});

export const updateClientSchema = createClientSchema;

export type ClientFormData = z.infer<typeof createClientSchema>;
