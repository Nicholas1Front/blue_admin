import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Modal } from "../../../components/Modal/Modal";
import type {
    CreateMonthlyExpenseRequest,
    MonthlyExpense
} from "../../../modules/financial/monthlyExpenses/monthlyExpenses.types";
import {
    monthlyExpenseFormSchema,
    type MonthlyExpenseFormValues
} from "../schemas/monthlyExpenses.schema";

interface MonthlyExpenseFormModalProps {
    isOpen: boolean;
    expense: MonthlyExpense | null;
    isSubmitting: boolean;
    error: string | null;
    onClose: () => void;
    onSubmit: (data: CreateMonthlyExpenseRequest) => Promise<void>;
}

function toDateInput(value: string | null | undefined) {
    if (!value) return "";
    return new Date(value).toISOString().slice(0, 10);
}

export function MonthlyExpenseFormModal({
    isOpen,
    expense,
    isSubmitting,
    error,
    onClose,
    onSubmit
}: MonthlyExpenseFormModalProps) {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm<MonthlyExpenseFormValues>({
        resolver: zodResolver(monthlyExpenseFormSchema),
        defaultValues: {
            name: "",
            description: "",
            expectedValue: "",
            dueDate: "",
            notes: ""
        }
    });

    useEffect(() => {
        if (!isOpen) return;

        reset({
            name: expense?.name ?? "",
            description: expense?.description ?? "",
            expectedValue: expense ? String(expense.expectedValue) : "",
            dueDate: toDateInput(expense?.dueDate),
            notes: expense?.notes ?? ""
        });
    }, [expense, isOpen, reset]);

    async function handleFormSubmit(values: MonthlyExpenseFormValues) {
        const data: CreateMonthlyExpenseRequest = {
            name: values.name.trim(),
            description: values.description.trim() || null,
            expectedValue: Number(values.expectedValue),
            dueDate: values.dueDate
                ? new Date(`${values.dueDate}T12:00:00`).toISOString()
                : null,
            notes: values.notes.trim() || null
        };

        await onSubmit(data);
    }

    return (
        <Modal
            isOpen={isOpen}
            title={expense ? "Editar despesa mensal" : "Adicionar despesa mensal"}
            onClose={onClose}
        >
            <form className="monthly-expense-form" onSubmit={handleSubmit(handleFormSubmit)}>
                <div className="monthly-expense-field">
                    <label htmlFor="monthly-expense-name">Nome da despesa</label>
                    <input id="monthly-expense-name" autoFocus {...register("name")} disabled={isSubmitting} placeholder="Ex.: aluguel da oficina" />
                    {errors.name && <span className="monthly-expense-form-error">{errors.name.message}</span>}
                </div>

                <div className="monthly-expense-field">
                    <label htmlFor="monthly-expense-description">Descrição <span>(opcional)</span></label>
                    <textarea id="monthly-expense-description" rows={2} {...register("description")} disabled={isSubmitting} placeholder="Detalhes sobre essa despesa" />
                </div>

                <div className="monthly-expense-form__row">
                    <div className="monthly-expense-field">
                        <label htmlFor="monthly-expense-value">Valor previsto (R$)</label>
                        <input id="monthly-expense-value" type="number" min="1" step="0.01" inputMode="decimal" {...register("expectedValue")} disabled={isSubmitting} placeholder="0,00" />
                        {errors.expectedValue && <span className="monthly-expense-form-error">{errors.expectedValue.message}</span>}
                    </div>
                    <div className="monthly-expense-field">
                        <label htmlFor="monthly-expense-due-date">Dia de vencimento <span>(opcional)</span></label>
                        <input id="monthly-expense-due-date" type="date" {...register("dueDate")} disabled={isSubmitting} />
                    </div>
                </div>

                <div className="monthly-expense-field">
                    <label htmlFor="monthly-expense-notes">Observações <span>(opcional)</span></label>
                    <textarea id="monthly-expense-notes" rows={3} {...register("notes")} disabled={isSubmitting} placeholder="Informações adicionais" />
                </div>

                {error && <p className="monthly-expense-form-error" role="alert">{error}</p>}

                <div className="monthly-expense-modal__actions">
                    <button className="monthly-expense-button monthly-expense-button--secondary" type="button" onClick={onClose} disabled={isSubmitting}>Cancelar</button>
                    <button className="monthly-expense-button monthly-expense-button--primary" type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Salvando…" : expense ? "Salvar alterações" : "Adicionar despesa"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
