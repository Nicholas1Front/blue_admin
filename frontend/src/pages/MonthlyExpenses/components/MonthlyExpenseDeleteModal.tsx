import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTriangleExclamation, faTrash } from "@fortawesome/free-solid-svg-icons";

import { Modal } from "../../../components/Modal/Modal";
import type { MonthlyExpense } from "../../../modules/financial/monthlyExpenses/monthlyExpenses.types";

interface MonthlyExpenseDeleteModalProps {
    expense: MonthlyExpense | null;
    isSubmitting: boolean;
    error: string | null;
    onClose: () => void;
    onConfirm: () => Promise<void>;
}

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
});

export function MonthlyExpenseDeleteModal({
    expense,
    isSubmitting,
    error,
    onClose,
    onConfirm
}: MonthlyExpenseDeleteModalProps) {
    return (
        <Modal isOpen={expense !== null} title="Excluir despesa mensal" onClose={onClose}>
            {expense && (
                <div className="monthly-expense-delete">
                    <div className="monthly-expense-delete__warning">
                        <FontAwesomeIcon icon={faTriangleExclamation} />
                        <div>
                            <strong>Tem certeza que deseja excluir esta despesa?</strong>
                            <p><strong>{expense.name}</strong> será removida permanentemente. Esta ação não pode ser desfeita.</p>
                            <span>Valor previsto: {currencyFormatter.format(Number(expense.expectedValue))}</span>
                        </div>
                    </div>

                    {error && <p className="monthly-expense-form-error" role="alert">{error}</p>}

                    <div className="monthly-expense-modal__actions">
                        <button className="monthly-expense-button monthly-expense-button--secondary" type="button" onClick={onClose} disabled={isSubmitting}>Cancelar</button>
                        <button className="monthly-expense-button monthly-expense-button--danger" type="button" onClick={onConfirm} disabled={isSubmitting}>
                            <FontAwesomeIcon icon={faTrash} />
                            {isSubmitting ? "Excluindo…" : "Excluir despesa"}
                        </button>
                    </div>
                </div>
            )}
        </Modal>
    );
}
