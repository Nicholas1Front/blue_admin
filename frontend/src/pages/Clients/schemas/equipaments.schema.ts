import { z } from "zod";

export const equipamentSchema = z.object({
    type: z.string().min(1, "Informe o tipo."),
    brand: z.string().min(1, "Informe a marca."),
    model: z.string(),
    mainIdentification: z.string(),
    additionalIdentification: z.string()
});

export type EquipamentFormData = z.infer<typeof equipamentSchema>;
