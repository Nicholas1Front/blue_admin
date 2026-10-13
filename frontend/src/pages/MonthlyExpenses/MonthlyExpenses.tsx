import { useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faRotate } from "@fortawesome/free-solid-svg-icons";

import { AppHeader } from "../../components/AppHeader/AppHeader";
import { BackLink } from "../../components/BackLink/BackLink";
import {
    useMonthlyExpenseMutations,
    useMonthlyExpensesByFilters,
    useMonthlyExpensesOverview
} from "../../modules/financial";
import type {
    CreateMonthlyExpenseRequest,
    FindMonthlyExpensesFilters,
    MonthlyExpense
} from "../../modules/financial/monthlyExpenses/monthlyExpenses.types";
import { MonthlyExpenseOverview } from "./components/MonthlyExpenseOverview";
import { MonthlyExpenseSearch } from "./components/MonthlyExpenseSearch";
import { MonthlyExpenseList } from "./components/MonthlyExpenseList";
import { MonthlyExpenseFormModal } from "./components/MonthlyExpenseFormModal";
import { MonthlyExpenseDeleteModal } from "./components/MonthlyExpenseDeleteModal";

import "./MonthlyExpenses.css";

function getErrorMessage(error: unknown, fallback: string) {
    return error instanceof Error ? error.message : fallback;
}

export function MonthlyExpenses() {
    document.title = "Despesas mensais | Blue Admin";

    const [filters, setFilters] = useState<FindMonthlyExpensesFilters>({});
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<MonthlyExpense | null>(null);
    const [deletingExpense, setDeletingExpense] = useState<MonthlyExpense | null>(null);

    const overviewQuery = useMonthlyExpensesOverview();
    const filteredQuery = useMonthlyExpensesByFilters(filters);
    const mutations = useMonthlyExpenseMutations();

    const hasFilters = Object.values(filters).some((value) => value !== undefined);
    const filteredExpenses = filteredQuery.data;
    const expenses = useMemo(() => {
        const allExpenses = hasFilters
            ? (filteredExpenses ?? [])
            : [
                ...(overviewQuery.data?.activeExpenses.expensesDetails ?? []),
                ...(overviewQuery.data?.deactiveExpenses.expensesDetails ?? [])
            ];

        return [...allExpenses].sort((a, b) => {
            if (a.active !== b.active) return a.active ? -1 : 1;
            return a.name.localeCompare(b.name, "pt-BR");
        });
    }, [filteredExpenses, hasFilters, overviewQuery.data]);

    const formError = editingExpense
        ? getErrorMessage(mutations.update.error, "")
        : getErrorMessage(mutations.create.error, "");
    const visibleFormError = formError || null;

    function openCreateModal() {
        mutations.create.reset();
        mutations.update.reset();
        setEditingExpense(null);
        setIsFormOpen(true);
    }

    function openEditModal(expense: MonthlyExpense) {
        mutations.create.reset();
        mutations.update.reset();
        setEditingExpense(expense);
        setIsFormOpen(true);
    }

    function closeFormModal() {
        if (mutations.create.isPending || mutations.update.isPending) return;
        setIsFormOpen(false);
        setEditingExpense(null);
    }

    async function handleSaveExpense(data: CreateMonthlyExpenseRequest) {
        try {
            if (editingExpense) {
                await mutations.update.mutateAsync({
                    id: editingExpense.id,
                    data
                });
            } else {
                await mutations.create.mutateAsync(data);
            }

            setIsFormOpen(false);
            setEditingExpense(null);
        } catch {
            // O erro da mutação é apresentado dentro do modal.
        }
    }

    function openDeleteModal(expense: MonthlyExpense) {
        mutations.remove.reset();
        setDeletingExpense(expense);
    }

    function closeDeleteModal() {
        if (mutations.remove.isPending) return;
        setDeletingExpense(null);
    }

    async function handleDeleteExpense() {
        if (!deletingExpense) return;

        try {
            await mutations.remove.mutateAsync(deletingExpense.id);
            setDeletingExpense(null);
        } catch {
            // O erro da mutação é apresentado dentro do modal.
        }
    }

    async function handleToggleStatus(expense: MonthlyExpense) {
        mutations.activate.reset();
        mutations.deactivate.reset();

        try {
            if (expense.active) {
                await mutations.deactivate.mutateAsync(expense.id);
            } else {
                await mutations.activate.mutateAsync(expense.id);
            }
        } catch {
            // O erro fica disponível no alerta da listagem.
        }
    }

    const listError = hasFilters
        ? filteredQuery.isError
            ? getErrorMessage(filteredQuery.error, "Não foi possível pesquisar as despesas.")
            : null
        : overviewQuery.isError
            ? getErrorMessage(overviewQuery.error, "Não foi possível carregar as despesas.")
            : null;

    const statusError = mutations.activate.error ?? mutations.deactivate.error;
    const isLoadingList = hasFilters ? filteredQuery.isPending : overviewQuery.isPending;
    const isSearching = hasFilters && filteredQuery.isFetching;

    return (
        <main className="monthly-expenses-page">
            <AppHeader />
            <nav className="page-back-row" aria-label="Navegação da página">
                <BackLink />
            </nav>

            <section className="monthly-expenses-content">
                <header className="monthly-expenses-heading">
                    <div>
                        <span className="monthly-expense-eyebrow">Gestão financeira</span>
                        <h1>Despesas mensais</h1>
                        <p>
                            Organize os compromissos recorrentes da oficina, acompanhe os custos
                            previstos e mantenha seus cadastros atualizados.
                        </p>
                    </div>
                    <button
                        className="monthly-expense-button monthly-expense-button--primary monthly-expenses-heading__refresh"
                        type="button"
                        onClick={() => {
                            void overviewQuery.refetch();
                            if (hasFilters) void filteredQuery.refetch();
                        }}
                        disabled={overviewQuery.isFetching || filteredQuery.isFetching}
                    >
                        <FontAwesomeIcon icon={faRotate} />
                        Atualizar
                    </button>
                </header>

                {overviewQuery.isError && (
                    <div className="monthly-expense-alert" role="alert">
                        <span>Não foi possível carregar o resumo das despesas.</span>
                        <button type="button" onClick={() => void overviewQuery.refetch()}>Tentar novamente</button>
                    </div>
                )}

                <MonthlyExpenseOverview
                    overview={overviewQuery.data}
                    isLoading={overviewQuery.isPending}
                />

                <section className="monthly-expense-management">
                    <div className="monthly-expense-management__toolbar">
                        <div>
                            <span className="monthly-expense-eyebrow">Gerenciamento</span>
                            <h2>Seus compromissos</h2>
                        </div>
                        <button
                            className="monthly-expense-button monthly-expense-button--success"
                            type="button"
                            onClick={openCreateModal}
                        >
                            <FontAwesomeIcon icon={faPlus} />
                            Adicionar despesa
                        </button>
                    </div>

                    <MonthlyExpenseSearch
                        isSearching={isSearching}
                        hasSearched={hasFilters}
                        onSearch={(nextFilters) => setFilters(nextFilters)}
                        onClear={() => setFilters({})}
                    />

                    {statusError && (
                        <div className="monthly-expense-alert" role="alert">
                            {getErrorMessage(statusError, "Não foi possível alterar a situação da despesa.")}
                        </div>
                    )}

                    <MonthlyExpenseList
                        expenses={expenses}
                        isLoading={isLoadingList}
                        isSearching={isSearching}
                        hasSearched={hasFilters}
                        error={listError}
                        onEdit={openEditModal}
                        onDelete={openDeleteModal}
                        onToggleStatus={(expense) => void handleToggleStatus(expense)}
                    />
                    {!hasFilters && overviewQuery.data && (
                        <footer className="monthly-expense-overview-footer">
                            <div>
                                <span>Total de despesas cadastradas</span>
                                <strong>{overviewQuery.data.numberExpenses}</strong>
                            </div>
                            <div>
                                <span>Soma geral prevista, incluindo inativas</span>
                                <strong>{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(overviewQuery.data.totalSum)}</strong>
                            </div>
                        </footer>
                    )}
                </section>
            </section>

            <MonthlyExpenseFormModal
                isOpen={isFormOpen}
                expense={editingExpense}
                isSubmitting={mutations.create.isPending || mutations.update.isPending}
                error={visibleFormError}
                onClose={closeFormModal}
                onSubmit={handleSaveExpense}
            />

            <MonthlyExpenseDeleteModal
                expense={deletingExpense}
                isSubmitting={mutations.remove.isPending}
                error={mutations.remove.error ? getErrorMessage(mutations.remove.error, "Não foi possível excluir a despesa.") : null}
                onClose={closeDeleteModal}
                onConfirm={handleDeleteExpense}
            />
        </main>
    );
}
