import { z } from "zod";

export const categoryFormSchema = z.object({
    name: z.string().trim().min(1, "Informe o nome da categoria."),
    description: z.string(),
    type: z.enum(["income", "expense"])
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;
