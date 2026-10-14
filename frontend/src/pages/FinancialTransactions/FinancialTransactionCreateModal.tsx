import { useState, type FormEvent } from "react";

import { Modal } from "../../components/Modal/Modal";
import {
    useCategories,
    useCategoryMutations,
    useTransactionMutations,
    type FinancialTransaction
} from "../../modules/financial";
import type { FinancialTransactionListItem } from "../../modules/financial/transactions/transactions.types";

interface FinancialTransactionCreateModalProps {
    isOpen: boolean;
    selectedYear: number;
    selectedMonth: number;
    onClose: () => void;
    onSaved: (transaction: FinancialTransaction) => void;
    transaction?: FinancialTransactionListItem;
}

function getDefaultReferenceDate(year: number, month: number) {
    const today = new Date();
    const day = year === today.getFullYear() && month === today.getMonth() + 1
        ? today.getDate()
        : 1;

    return [
        String(year),
        String(month).padStart(2, "0"),
        String(day).padStart(2, "0")
    ].join("-");
}

export function FinancialTransactionCreateModal({
    isOpen,
    selectedYear,
    selectedMonth,
    onClose,
    onSaved,
    transaction
}: FinancialTransactionCreateModalProps) {
    const categoriesQuery = useCategories({ active: true });
    const categoryMutations = useCategoryMutations();
    const transactionMutations = useTransactionMutations();

    const isEditing = Boolean(transaction);
    const [description, setDescription] = useState(() => transaction?.description ?? "");
    const [value, setValue] = useState(() => transaction ? String(transaction.value) : "");
    const [referenceDate, setReferenceDate] = useState(
        () => transaction?.referenceDate.slice(0, 10) ?? getDefaultReferenceDate(selectedYear, selectedMonth)
    );
    const [categoryId, setCategoryId] = useState(() => transaction?.categoryId ?? "");
    const [showCategoryForm, setShowCategoryForm] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [newCategoryDescription, setNewCategoryDescription] = useState("");
    const [newCategoryType, setNewCategoryType] = useState<"income" | "expense">("expense");
    const [formError, setFormError] = useState("");

    const categories = categoriesQuery.data ?? [];
    const incomeCategories = categories.filter((category) => category.type === "income");
    const expenseCategories = categories.filter((category) => category.type === "expense");
    const monthStart = [
        String(selectedYear),
        String(selectedMonth).padStart(2, "0"),
        "01"
    ].join("-");
    const monthEnd = [
        String(selectedYear),
        String(selectedMonth).padStart(2, "0"),
        String(new Date(selectedYear, selectedMonth, 0).getDate()).padStart(2, "0")
    ].join("-");
    const isSubmitting = transactionMutations.create.isPending || categoryMutations.create.isPending;

    function handleClose() {
        if (!isSubmitting) onClose();
    }

    async function handleCreateTransaction(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (isSubmitting) return;
        setFormError("");

        const parsedValue = Number(value.replace(",", "."));
        if (!description.trim()) {
            setFormError("Informe uma descrição para o lançamento.");
            return;
        }
        if (!Number.isFinite(parsedValue) || parsedValue < 1) {
            setFormError("Informe um valor válido maior ou igual a R$ 1,00.");
            return;
        }
        if (categoriesQuery.isError) {
            setFormError("Não foi possível validar as categorias. Tente novamente antes de salvar.");
            return;
        }
        if (!categoryId || !categories.some((category) => category.id === categoryId)) {
            setFormError("Selecione uma categoria ativa para continuar.");
            return;
        }
        if (!referenceDate) {
            setFormError("Informe a data de referência.");
            return;
        }
        if (!/^\d{4}-\d{2}-\d{2}$/.test(referenceDate)) {
            setFormError("Informe uma data de referência válida.");
            return;
        }
        if (!isEditing && (referenceDate < monthStart || referenceDate > monthEnd)) {
            setFormError("A data de referência deve estar dentro do mês selecionado.");
            return;
        }

        try {
            const payload = {
                categoryId,
                description: description.trim(),
                value: parsedValue,
                referenceDate
            };
            const savedTransaction = transaction
                ? await transactionMutations.update.mutateAsync({
                    id: transaction.id,
                    data: payload
                })
                : await transactionMutations.create.mutateAsync(payload);
            onSaved(savedTransaction);
        } catch {
            setFormError("Não foi possível salvar o lançamento. Confira os dados e tente novamente.");
        }
    }

    async function handleCreateCategory(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (isSubmitting) return;
        setFormError("");

        if (!newCategoryName.trim()) {
            setFormError("Informe o nome da categoria.");
            return;
        }

        try {
            const category = await categoryMutations.create.mutateAsync({
                name: newCategoryName.trim(),
                description: newCategoryDescription.trim() || null,
                type: newCategoryType
            });
            setCategoryId(category.id);
            setShowCategoryForm(false);
            setNewCategoryName("");
            setNewCategoryDescription("");
        } catch {
            setFormError("Não foi possível criar a categoria. Verifique os dados e tente novamente.");
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            title={isEditing ? "Editar lançamento" : "Adicionar lançamento"}
            onClose={handleClose}
        >
            <div className="financial-transaction-form">
                <p className="financial-transaction-form__intro">
                    {isEditing
                        ? "Atualize os dados do lançamento. O tipo será definido pela categoria escolhida."
                        : "Registre uma entrada ou saída. O tipo será definido pela categoria escolhida."}
                </p>

                <form onSubmit={handleCreateTransaction}>
                    <div className="financial-transaction-form__fields">
                        <label className="financial-transaction-form__field">
                            <span>Descrição</span>
                            <input
                                autoFocus
                                type="text"
                                value={description}
                                onChange={(event) => setDescription(event.target.value)}
                                placeholder="Ex.: Pagamento de serviço"
                                maxLength={160}
                                required
                            />
                        </label>

                        <div className="financial-transaction-form__row">
                            <label className="financial-transaction-form__field">
                                <span>Valor (R$)</span>
                                <input
                                    type="number"
                                    inputMode="decimal"
                                    min="1"
                                    step="0.01"
                                    value={value}
                                    onChange={(event) => setValue(event.target.value)}
                                    placeholder="0,00"
                                    required
                                />
                            </label>

                            <label className="financial-transaction-form__field">
                                <span>Data de referência</span>
                                <input
                                    type="date"
                                    min={monthStart}
                                    max={monthEnd}
                                    value={referenceDate}
                                    onChange={(event) => setReferenceDate(event.target.value)}
                                    required
                                />
                            </label>
                        </div>

                        <div className="financial-transaction-form__category-heading">
                            <label className="financial-transaction-form__field">
                                <span>Categoria</span>
                                <select
                                    value={categoryId}
                                    onChange={(event) => setCategoryId(event.target.value)}
                                    disabled={categoriesQuery.isPending || categories.length === 0}
                                    required
                                >
                                    <option value="">
                                        {categoriesQuery.isPending ? "Carregando categorias…" : "Selecione uma categoria"}
                                    </option>
                                    {incomeCategories.length > 0 && (
                                        <optgroup
                                            className="financial-transaction-form__category-group financial-transaction-form__category-group--income"
                                            label="↑ Entradas"
                                        >
                                            {incomeCategories.map((category) => (
                                                <option
                                                    className="financial-transaction-form__category-option financial-transaction-form__category-option--income"
                                                    key={category.id}
                                                    value={category.id}
                                                >
                                                    ↗ {category.name}
                                                </option>
                                            ))}
                                        </optgroup>
                                    )}
                                    {expenseCategories.length > 0 && (
                                        <optgroup
                                            className="financial-transaction-form__category-group financial-transaction-form__category-group--expense"
                                            label="↓ Saídas"
                                        >
                                            {expenseCategories.map((category) => (
                                                <option
                                                    className="financial-transaction-form__category-option financial-transaction-form__category-option--expense"
                                                    key={category.id}
                                                    value={category.id}
                                                >
                                                    ↘ {category.name}
                                                </option>
                                            ))}
                                        </optgroup>
                                    )}
                                </select>
                            </label>
                            <button
                                className="financial-transaction-form__text-button"
                                type="button"
                                onClick={() => {
                                    setShowCategoryForm((visible) => !visible);
                                    setFormError("");
                                }}
                                disabled={isSubmitting}
                            >
                                {showCategoryForm ? "Cancelar categoria" : "Criar categoria"}
                            </button>
                        </div>

                        {categoriesQuery.isError && (
                            <p className="financial-transaction-form__inline-error" role="alert">
                                Não foi possível carregar as categorias. Tente novamente mais tarde.
                            </p>
                        )}

                        {categories.length === 0 && !categoriesQuery.isPending && !categoriesQuery.isError && (
                            <p className="financial-transaction-form__hint">
                                Você ainda não tem categorias ativas. Crie uma abaixo para continuar.
                            </p>
                        )}

                        {formError && !showCategoryForm && (
                            <p className="financial-transaction-form__error" role="alert">
                                {formError}
                            </p>
                        )}

                        <footer className="financial-transaction-form__actions">
                            <button
                                className="financial-transaction-form__cancel-button"
                                type="button"
                                onClick={handleClose}
                                disabled={isSubmitting}
                            >
                                Cancelar
                            </button>
                            <button
                                className="financial-transaction-form__submit-button"
                                type="submit"
                                disabled={isSubmitting || showCategoryForm || categoriesQuery.isPending || categoriesQuery.isError || !categoryId}
                            >
                                {transactionMutations.create.isPending || transactionMutations.update.isPending
                                    ? "Salvando…"
                                    : isEditing ? "Salvar alterações" : "Salvar lançamento"}
                            </button>
                        </footer>
                    </div>
                </form>

                {showCategoryForm && (
                    <form className="financial-transaction-form__new-category" onSubmit={handleCreateCategory}>
                        <h3>Nova categoria</h3>
                        <label className="financial-transaction-form__field">
                            <span>Nome da categoria</span>
                            <input
                                type="text"
                                value={newCategoryName}
                                onChange={(event) => setNewCategoryName(event.target.value)}
                                placeholder="Ex.: Manutenção"
                                maxLength={100}
                                required
                            />
                        </label>
                        <label className="financial-transaction-form__field">
                            <span>Descrição (opcional)</span>
                            <input
                                type="text"
                                value={newCategoryDescription}
                                onChange={(event) => setNewCategoryDescription(event.target.value)}
                                placeholder="Para que essa categoria será usada?"
                                maxLength={250}
                            />
                        </label>
                        <label className="financial-transaction-form__field">
                            <span>Tipo</span>
                            <select
                                value={newCategoryType}
                                onChange={(event) => setNewCategoryType(event.target.value as "income" | "expense")}
                            >
                                <option value="expense">Saída</option>
                                <option value="income">Entrada</option>
                            </select>
                        </label>
                        {formError && showCategoryForm && (
                            <p className="financial-transaction-form__error" role="alert">
                                {formError}
                            </p>
                        )}
                        <button
                            className="financial-transaction-form__secondary-button"
                            type="submit"
                            disabled={isSubmitting}
                        >
                            {categoryMutations.create.isPending ? "Criando categoria…" : "Criar e selecionar categoria"}
                        </button>
                    </form>
                )}
            </div>
        </Modal>
    );
}
