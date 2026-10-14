import { useEffect, useState, type FormEvent } from "react";

import { Modal } from "../../components/Modal/Modal";
import {
    useCategories,
    useCategoryMutations,
    useTransactionMutations
} from "../../modules/financial";

interface FinancialTransactionCreateModalProps {
    isOpen: boolean;
    selectedYear: number;
    selectedMonth: number;
    onClose: () => void;
    onCreated: () => void;
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
    onCreated
}: FinancialTransactionCreateModalProps) {
    const categoriesQuery = useCategories({ active: true });
    const categoryMutations = useCategoryMutations();
    const transactionMutations = useTransactionMutations();

    const [description, setDescription] = useState("");
    const [value, setValue] = useState("");
    const [referenceDate, setReferenceDate] = useState(
        () => getDefaultReferenceDate(selectedYear, selectedMonth)
    );
    const [categoryId, setCategoryId] = useState("");
    const [showCategoryForm, setShowCategoryForm] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [newCategoryDescription, setNewCategoryDescription] = useState("");
    const [newCategoryType, setNewCategoryType] = useState<"income" | "expense">("expense");
    const [formError, setFormError] = useState("");

    const categories = categoriesQuery.data ?? [];
    const isSubmitting = transactionMutations.create.isPending || categoryMutations.create.isPending;

    useEffect(() => {
        if (!isOpen) return;

        setDescription("");
        setValue("");
        setReferenceDate(getDefaultReferenceDate(selectedYear, selectedMonth));
        setCategoryId("");
        setShowCategoryForm(false);
        setNewCategoryName("");
        setNewCategoryDescription("");
        setNewCategoryType("expense");
        setFormError("");
    }, [isOpen, selectedYear, selectedMonth]);

    function handleClose() {
        if (!isSubmitting) onClose();
    }

    async function handleCreateTransaction(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
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
        if (!categoryId) {
            setFormError("Selecione uma categoria para continuar.");
            return;
        }
        if (!referenceDate) {
            setFormError("Informe a data de referência.");
            return;
        }

        try {
            await transactionMutations.create.mutateAsync({
                categoryId,
                description: description.trim(),
                value: parsedValue,
                referenceDate
            });
            onCreated();
        } catch {
            setFormError("Não foi possível salvar o lançamento. Confira os dados e tente novamente.");
        }
    }

    async function handleCreateCategory(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
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
            title="Adicionar lançamento"
            onClose={handleClose}
        >
            <div className="financial-transaction-form">
                <p className="financial-transaction-form__intro">
                    Registre uma entrada ou saída. O tipo será definido pela categoria escolhida.
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
                                    {categories.map((category) => (
                                        <option key={category.id} value={category.id}>
                                            {category.name} · {category.type === "income" ? "Entrada" : "Saída"}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <button
                                className="financial-transaction-form__text-button"
                                type="button"
                                onClick={() => {
                                    setShowCategoryForm((visible) => !visible);
                                    setFormError("");
                                }}
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

                        {formError && (
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
                                disabled={isSubmitting || categoriesQuery.isPending || categoriesQuery.isError || !categoryId}
                            >
                                {transactionMutations.create.isPending ? "Salvando…" : "Salvar lançamento"}
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
                        {formError && (
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
