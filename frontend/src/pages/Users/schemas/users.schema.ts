import { z } from "zod";

export const createUserSchema = z.object({
    name: z.string().min(1, "Informe o nome."),
    email: z.string().email("Informe um e-mail válido."),
    password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres.")
});

export type CreateUserFormData = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
    name: z.string().min(1, "Informe o nome."),
    email: z.string().email("Informe um e-mail válido."),
    password: z.union([
        z.literal(""),
        z.string().min(6, "A nova senha deve ter pelo menos 6 caracteres.")
    ])
});

export type UpdateUserFormData = z.infer<typeof updateUserSchema>;
