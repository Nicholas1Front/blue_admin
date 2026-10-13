import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faPenToSquare,
    faTrash,
    faToggleOff,
    faToggleOn,
    faCalendarDays,
    faCircleCheck,
    faCircleXmark
} from "@fortawesome/free-solid-svg-icons";

import type { MonthlyExpense } from "../../../modules/financial/monthlyExpenses/monthlyExpenses.types";

interface MonthlyExpenseListProps {
    expenses: MonthlyExpense[];
    isLoading: boolean;
    isSearching: boolean;
    hasSearched: boolean;
    error: string | null;
    onEdit: (expense: MonthlyExpense) => void;
    onDelete: (expense: MonthlyExpense) => void;
    onToggleStatus: (expense: MonthlyExpense) => void;
}

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
});

function formatCurrency(value: number | string) {
    return currencyFormatter.format(Number(value));
}

function formatDate(value: string | null) {
    if (!value) return "Não informado";
    return new Date(value).toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

function formatDateTime(value: string) {
    return new Date(value).toLocaleString("pt-BR", {
        dateStyle: "short",
        timeStyle: "short"
    });
}

export function MonthlyExpenseList({
    expenses,
    isLoading,
    isSearching,
    hasSearched,
    error,
    onEdit,
    onDelete,
    onToggleStatus
}: MonthlyExpenseListProps) {
    return (
        <section className="monthly-expense-list-section" aria-labelledby="monthly-expense-list-title">
            <header className="monthly-expense-list-section__heading">
                <div>
                    <span className="monthly-expense-eyebrow">Cadastro</span>
                    <h2 id="monthly-expense-list-title">{hasSearched ? "Resultados da pesquisa" : "Todas as despesas"}</h2>
                    <p>{hasSearched ? "Despesas que correspondem aos filtros informados." : "Visualize e gerencie os compromissos recorrentes da oficina."}</p>
                </div>
                <span className="monthly-expense-list-count">{isLoading || isSearching ? "…" : expenses.length} {expenses.length === 1 ? "despesa" : "despesas"}</span>
            </header>

            {error && <div className="monthly-expense-alert" role="alert">{error}</div>}

            {isLoading || isSearching ? (
                <div className="monthly-expense-empty-state">Carregando despesas…</div>
            ) : expenses.length === 0 ? (
                <div className="monthly-expense-empty-state">
                    <span>{hasSearched ? "Nenhuma despesa encontrada" : "Nenhuma despesa cadastrada"}</span>
                    <p>{hasSearched ? "Tente alterar ou limpar os filtros de pesquisa." : "Use “Adicionar despesa” para registrar o primeiro compromisso recorrente."}</p>
                </div>
            ) : (
                <div className="monthly-expense-list">
                    {expenses.map((expense) => (
                        <article className="monthly-expense-card" key={expense.id}>
                            <div className="monthly-expense-card__main">
                                <div className="monthly-expense-card__title-row">
                                    <div className="monthly-expense-card__title">
                                        <h3>{expense.name}</h3>
                                        <span className={`monthly-expense-status monthly-expense-status--${expense.active ? "active" : "inactive"}`}>
                                            <FontAwesomeIcon icon={expense.active ? faCircleCheck : faCircleXmark} />
                                            {expense.active ? "Ativa" : "Inativa"}
                                        </span>
                                    </div>
                                    <strong className="monthly-expense-card__value">{formatCurrency(expense.expectedValue)}</strong>
                                </div>

                                {expense.description && <p className="monthly-expense-card__description">{expense.description}</p>}

                                <dl className="monthly-expense-card__details">
                                    <div>
                                        <dt><FontAwesomeIcon icon={faCalendarDays} /> Vencimento</dt>
                                        <dd>{formatDate(expense.dueDate)}</dd>
                                    </div>
                                    <div>
                                        <dt>ID</dt>
                                        <dd className="monthly-expense-card__id" title={expense.id}>{expense.id}</dd>
                                    </div>
                                    <div>
                                        <dt>Criada em</dt>
                                        <dd>{formatDateTime(expense.createdAt)}</dd>
                                    </div>
                                    <div>
                                        <dt>Atualizada em</dt>
                                        <dd>{formatDateTime(expense.updatedAt)}</dd>
                                    </div>
                                </dl>

                                {expense.notes && (
                                    <div className="monthly-expense-card__notes">
                                        <span>Observações</span>
                                        <p>{expense.notes}</p>
                                    </div>
                                )}
                            </div>

                            <div className="monthly-expense-card__actions" aria-label={`Ações para ${expense.name}`}>
                                <button className="monthly-expense-icon-button" type="button" onClick={() => onEdit(expense)} aria-label={`Editar ${expense.name}`} title="Editar">
                                    <FontAwesomeIcon icon={faPenToSquare} />
                                </button>
                                <button className="monthly-expense-icon-button" type="button" onClick={() => onToggleStatus(expense)} aria-label={expense.active ? `Desativar ${expense.name}` : `Ativar ${expense.name}`} title={expense.active ? "Desativar despesa" : "Ativar despesa"}>
                                    <FontAwesomeIcon icon={expense.active ? faToggleOff : faToggleOn} />
                                </button>
                                <button className="monthly-expense-icon-button monthly-expense-icon-button--danger" type="button" onClick={() => onDelete(expense)} aria-label={`Excluir ${expense.name}`} title="Excluir">
                                    <FontAwesomeIcon icon={faTrash} />
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </section>
    );
}
