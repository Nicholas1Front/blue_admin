import { z } from "zod";

export const contactSchema = z.object({
    name: z.string().min(1, "Informe o nome."),
    email: z.string().email("Informe um e-mail válido."),
    phoneNumber: z.string().min(1, "Informe o telefone.")
});

export type ContactFormData = z.infer<typeof contactSchema>;
