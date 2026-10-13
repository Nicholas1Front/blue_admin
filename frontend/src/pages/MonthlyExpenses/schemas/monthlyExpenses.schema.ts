import { z } from "zod";

export const monthlyExpenseFormSchema = z.object({
    name: z.string().trim().min(1, "Informe o nome da despesa."),
    description: z.string(),
    expectedValue: z.string().refine(
        (value) =>
            value.trim() !== "" &&
            Number.isFinite(Number(value)) &&
            Number(value) >= 1,
        "Informe um valor maior ou igual a R$ 1,00."
    ),
    dueDate: z.string(),
    notes: z.string()
});

export type MonthlyExpenseFormValues = z.infer<typeof monthlyExpenseFormSchema>;
