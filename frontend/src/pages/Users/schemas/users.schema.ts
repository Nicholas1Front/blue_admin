import { z } from "zod";

export const updateUserSchema = z.object({
    name: z.string().min(1, "Informe o nome."),
    email: z.string().email("Informe um e-mail válido."),
    password: z.string().optional()
});

export type UpdateUserFormData = z.infer<typeof updateUserSchema>;
