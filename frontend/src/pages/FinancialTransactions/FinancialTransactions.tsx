import { useState, type FormEvent } from "react";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faArrowDown,
    faArrowTrendDown,
    faArrowTrendUp,
    faChevronLeft,
    faChevronRight,
    faMagnifyingGlass,
    faPencil,
    faRotateLeft,
    faPlus,
    faTrash,
    faWallet
} from "@fortawesome/free-solid-svg-icons";

import { AppHeader } from "../../components/AppHeader/AppHeader";
import { BackLink } from "../../components/BackLink/BackLink";
import { Modal } from "../../components/Modal/Modal";
import { FinancialTransactionCreateModal } from "./FinancialTransactionCreateModal";
import {
    useCategories,
    useMonthlyFinancialSummary,
    useTransactionMutations,
    useTransactions,
    useTransactionsByFilters,
    useYearlyFinancialSummary,
    type FinancialTransaction,
    type FinancialType
} from "../../modules/financial";
import type { FinancialTransactionListItem, FindTransactionsByFilters } from "../../modules/financial/transactions/transactions.types";
import "./FinancialTransactions.css";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
});

const monthFormatter = new Intl.DateTimeFormat("pt-BR", { month: "long" });
const referenceDateFormatter = new Intl.DateTimeFormat("pt-BR");

function formatCurrency(value: number | string | null | undefined) {
    return currencyFormatter.format(Number(value ?? 0));
}

function formatReferenceDate(value: string) {
    return referenceDateFormatter.format(new Date(`${value.slice(0, 10)}T12:00:00`));
}

function YearMetric({
    label,
    value,
    description,
    icon,
    tone,
    compact = false
}: {
    label: string;
    value: string;
    description: string;
    icon: IconDefinition;
    tone: "income" | "expense" | "balance";
    compact?: boolean;
}) {
    return (
        <article className={`financial-transactions-metric financial-transactions-metric--${tone}${compact ? " financial-transactions-metric--compact" : ""}`}>
            <div className="financial-transactions-metric__top">
                <span>{label}</span>
                <span className="financial-transactions-metric__icon" aria-hidden="true">
                    <FontAwesomeIcon icon={icon} />
                </span>
            </div>
            <strong className="financial-transactions-metric__value">{value}</strong>
            <p>{description}</p>
        </article>
    );
}

export function FinancialTransactions() {
    document.title = "Lançamentos financeiros | Blue Admin";

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [selectedMonth, setSelectedMonth] = useState(currentMonth);
    const [transactionPage, setTransactionPage] = useState(1);
    const [searchPage, setSearchPage] = useState(1);
    const [searchDescription, setSearchDescription] = useState("");
    const [searchType, setSearchType] = useState<FinancialType | "">("");
    const [searchCategoryId, setSearchCategoryId] = useState("");
    const [searchValue, setSearchValue] = useState("");
    const [searchReferenceDate, setSearchReferenceDate] = useState("");
    const [searchAppliedFilters, setSearchAppliedFilters] = useState<FindTransactionsByFilters>({});
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [transactionToEdit, setTransactionToEdit] = useState<FinancialTransactionListItem | null>(null);
    const [transactionToDelete, setTransactionToDelete] = useState<FinancialTransactionListItem | null>(null);
    const transactionMutations = useTransactionMutations();
    const transactionsPerPage = 10;
    const searchResultsPerPage = 10;

    const availableYears = Array.from(
        { length: currentYear - 1999 },
        (_, index) => currentYear - index
    );
    const availableMonths = Array.from({ length: 12 }, (_, index) => ({
        value: index + 1,
        label: monthFormatter.format(new Date(2000, index, 1))
    }));

    const categoriesQuery = useCategories();
    const yearlyQuery = useYearlyFinancialSummary({ year: selectedYear });
    const monthlyQuery = useMonthlyFinancialSummary({
        year: selectedYear,
        month: selectedMonth,
        limit: 1
    });
    const transactionsQuery = useTransactions({
        year: selectedYear,
        month: selectedMonth,
        page: transactionPage,
        limit: transactionsPerPage
    });
    const filteredTransactionsQuery = useTransactionsByFilters(searchAppliedFilters);

    const yearlySummary = yearlyQuery.data;
    const monthlySummary = monthlyQuery.data;
    const transactionsResult = transactionsQuery.data;
    const filteredTransactions = filteredTransactionsQuery.data;
    const filteredTransactionsTotalPages = Math.ceil((filteredTransactions?.length ?? 0) / searchResultsPerPage);
    const visibleFilteredTransactions = filteredTransactions?.slice(
        (searchPage - 1) * searchResultsPerPage,
        searchPage * searchResultsPerPage
    );
    const monthTitle = new Intl.DateTimeFormat("pt-BR", {
        month: "long",
        year: "numeric"
    }).format(new Date(selectedYear, selectedMonth - 1, 1));
    const capitalizedMonthTitle = monthTitle.charAt(0).toLocaleUpperCase("pt-BR") + monthTitle.slice(1);

    function handleTransactionSaved(transaction: FinancialTransaction) {
        const referenceDate = transaction.referenceDate.slice(0, 10);
        const [year, month] = referenceDate.split("-").map(Number);

        if (Number.isInteger(year) && Number.isInteger(month) && month >= 1 && month <= 12) {
            setSelectedYear(year);
            setSelectedMonth(month);
        }

        setTransactionPage(1);
        setSearchPage(1);
        setIsCreateModalOpen(false);
        setTransactionToEdit(null);
    }

    function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const description = searchDescription.trim();
        if (searchValue.trim() !== "" && (!Number.isFinite(Number(searchValue)) || Number(searchValue) < 1)) {
            return;
        }

        const parsedValue = searchValue.trim() ? Number(searchValue) : undefined;
        const filters: FindTransactionsByFilters = {
            ...(description ? { description } : {}),
            ...(searchCategoryId ? { categoryId: searchCategoryId } : {}),
            ...(searchType ? { type: searchType } : {}),
            ...(parsedValue !== undefined && Number.isFinite(parsedValue) && parsedValue >= 1
                ? { value: parsedValue }
                : {}),
            ...(searchReferenceDate ? { referenceDate: searchReferenceDate } : {})
        };

        setSearchAppliedFilters(filters);
        setSearchPage(1);
    }

    function handleClearSearch() {
        setSearchDescription("");
        setSearchType("");
        setSearchCategoryId("");
        setSearchValue("");
        setSearchReferenceDate("");
        setSearchAppliedFilters({});
        setSearchPage(1);
    }

    const hasActiveSearch = Object.keys(searchAppliedFilters).length > 0;

    async function handleDeleteTransaction() {
        if (!transactionToDelete || transactionMutations.remove.isPending) return;

        try {
            await transactionMutations.remove.mutateAsync(transactionToDelete.id);
            setTransactionToDelete(null);
            setTransactionPage(1);
            setSearchPage(1);
        } catch {
            // O modal permanece aberto para permitir uma nova tentativa.
        }
    }

    function handleYearChange(year: number) {
        if (!Number.isInteger(year) || year < 2000 || year > currentYear) {
            return;
        }

        setSelectedYear(year);
        setTransactionPage(1);

        if (year === currentYear && selectedMonth > currentMonth) {
            setSelectedMonth(currentMonth);
        }
    }

    function handleMonthChange(month: number) {
        if (!Number.isInteger(month) || month < 1 || month > 12) {
            return;
        }

        setSelectedMonth(month);
        setTransactionPage(1);
    }

    return (
        <main className="financial-transactions-page">
            <AppHeader />

            <nav className="page-back-row" aria-label="Navegação da página">
                <BackLink to="/financial" label="Voltar ao dashboard financeiro" />
            </nav>

            <section className="financial-transactions-content">
                <header className="financial-transactions-heading">
                    <span className="financial-transactions-eyebrow">
                        Gestão financeira
                    </span>
                    <h1>Lançamentos financeiros</h1>
                    <p>
                        Consulte e organize as movimentações da empresa, acompanhando
                        entradas, saídas e o resultado financeiro de cada período.
                    </p>
                </header>

                <section
                    className="financial-transactions-yearly"
                    aria-labelledby="financial-transactions-yearly-title"
                >
                    <header className="financial-transactions-yearly__header">
                        <div>
                            <span className="financial-transactions-eyebrow">
                                Visão geral
                            </span>
                            <h2 id="financial-transactions-yearly-title">
                                Resumo anual de {selectedYear}
                            </h2>
                            <p>
                                Totais consolidados do ano selecionado.
                            </p>
                        </div>
                    </header>

                    {yearlyQuery.isError ? (
                        <div className="financial-transactions-feedback" role="alert">
                            <p>Não foi possível carregar o resumo de {selectedYear}.</p>
                            <button type="button" onClick={() => yearlyQuery.refetch()}>
                                Tentar novamente
                            </button>
                        </div>
                    ) : (
                        <div className="financial-transactions-metrics financial-transactions-metrics--annual" aria-live="polite">
                            <YearMetric
                                compact
                                label="Entradas do ano"
                                value={yearlyQuery.isPending ? "Carregando…" : formatCurrency(yearlySummary?.incomesValue)}
                                description={`Receitas registradas em ${selectedYear}`}
                                icon={faArrowTrendUp}
                                tone="income"
                            />
                            <YearMetric
                                compact
                                label="Saídas do ano"
                                value={yearlyQuery.isPending ? "Carregando…" : formatCurrency(yearlySummary?.expensesValue)}
                                description={`Despesas registradas em ${selectedYear}`}
                                icon={faArrowTrendDown}
                                tone="expense"
                            />
                            <YearMetric
                                compact
                                label="Saldo do ano"
                                value={yearlyQuery.isPending ? "Carregando…" : formatCurrency(yearlySummary?.balanceValue)}
                                description="Entradas menos saídas"
                                icon={faWallet}
                                tone="balance"
                            />
                        </div>
                    )}
                </section>

                <section
                    className="financial-transactions-monthly"
                    aria-labelledby="financial-transactions-monthly-title"
                >
                    <header className="financial-transactions-section-heading">
                        <div>
                            <span className="financial-transactions-eyebrow">
                                Acompanhamento mensal
                            </span>
                            <h2 id="financial-transactions-monthly-title">
                                Resumo de {capitalizedMonthTitle}
                            </h2>
                            <p>Veja o total de entradas, saídas e o saldo do período.</p>
                        </div>
                    </header>

                    {monthlyQuery.isError ? (
                        <div className="financial-transactions-feedback" role="alert">
                            <p>Não foi possível carregar o resumo de {monthTitle}.</p>
                            <button type="button" onClick={() => monthlyQuery.refetch()}>
                                Tentar novamente
                            </button>
                        </div>
                    ) : (
                        <div className="financial-transactions-metrics" aria-live="polite">
                            <YearMetric
                                label="Entradas do mês"
                                value={monthlyQuery.isPending ? "Carregando…" : formatCurrency(monthlySummary?.incomesValue)}
                                description={`Receitas registradas em ${monthTitle}`}
                                icon={faArrowTrendUp}
                                tone="income"
                            />
                            <YearMetric
                                label="Saídas do mês"
                                value={monthlyQuery.isPending ? "Carregando…" : formatCurrency(monthlySummary?.expensesValue)}
                                description={`Despesas registradas em ${monthTitle}`}
                                icon={faArrowTrendDown}
                                tone="expense"
                            />
                            <YearMetric
                                label="Saldo do mês"
                                value={monthlyQuery.isPending ? "Carregando…" : formatCurrency(monthlySummary?.balanceValue)}
                                description="Entradas menos saídas"
                                icon={faWallet}
                                tone="balance"
                            />
                        </div>
                    )}
                </section>

                <section className="financial-transactions-period" aria-label="Selecionar período">
                    <div className="financial-transactions-period__copy">
                        <span className="financial-transactions-eyebrow">Período dos lançamentos</span>
                        <p>Escolha o mês e o ano que deseja consultar.</p>
                    </div>

                    <div className="financial-transactions-period__fields">
                        <label className="financial-transactions-period__field">
                            <span>Mês</span>
                            <select
                                aria-label="Selecionar mês dos lançamentos"
                                value={selectedMonth}
                                onChange={(event) => handleMonthChange(Number(event.target.value))}
                            >
                                {availableMonths.map((month) => (
                                    <option
                                        key={month.value}
                                        value={month.value}
                                        disabled={selectedYear === currentYear && month.value > currentMonth}
                                    >
                                        {month.label}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="financial-transactions-period__field">
                            <span>Ano</span>
                            <select
                                aria-label="Selecionar ano dos lançamentos"
                                value={selectedYear}
                                onChange={(event) => handleYearChange(Number(event.target.value))}
                            >
                                {availableYears.map((year) => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </label>
                    </div>
                </section>

                <section
                    className="financial-transactions-list-section"
                    aria-labelledby="financial-transactions-list-title"
                >
                    <header className="financial-transactions-list-section__header">
                        <div>
                            <span className="financial-transactions-eyebrow">Histórico</span>
                            <h2 id="financial-transactions-list-title">
                                Lançamentos de {monthTitle}
                            </h2>
                            <p>
                                {transactionsResult
                                    ? `${transactionsResult.total} ${transactionsResult.total === 1 ? "lançamento encontrado" : "lançamentos encontrados"}`
                                    : "Movimentações organizadas da mais antiga para a mais recente."}
                            </p>
                        </div>

                        <button
                            className="financial-transactions-add-button"
                            type="button"
                            onClick={() => setIsCreateModalOpen(true)}
                        >
                            <FontAwesomeIcon icon={faPlus} aria-hidden="true" />
                            Adicionar lançamento
                        </button>
                    </header>


                    {transactionsQuery.isError ? (
                        <div className="financial-transactions-feedback" role="alert">
                            <p>Não foi possível carregar os lançamentos de {monthTitle}.</p>
                            <button type="button" onClick={() => transactionsQuery.refetch()}>
                                Tentar novamente
                            </button>
                        </div>
                    ) : transactionsQuery.isPending ? (
                        <div className="financial-transactions-list-feedback" role="status">
                            Carregando lançamentos…
                        </div>
                    ) : !transactionsResult ? (
                        <div className="financial-transactions-list-feedback" role="status">
                            Preparando os lançamentos…
                        </div>
                    ) : transactionsResult.transactions.length === 0 ? (
                        <div className="financial-transactions-empty">
                            <span className="financial-transactions-empty__icon" aria-hidden="true">
                                <FontAwesomeIcon icon={faArrowDown} />
                            </span>
                            <h3>"Nenhum lançamento neste período"</h3>
                            <p>
                                {"Não há entradas ou saídas registradas em " + monthTitle + ". Selecione outro mês para consultar o histórico."}
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="financial-transactions-table-wrap">
                                <div className="financial-transactions-table" role="table" aria-label={`Lançamentos de ${monthTitle}`}>
                                    <div className="financial-transactions-table__head" role="row">
                                        <span role="columnheader">Lançamento</span>
                                        <span role="columnheader">Categoria</span>
                                        <span role="columnheader">Data de referência</span>
                                        <span role="columnheader" className="financial-transactions-table__amount-heading">Valor</span>
                                        <span role="columnheader" className="financial-transactions-table__actions-heading">Ações</span>
                                    </div>

                                    {transactionsResult.transactions.map((transaction) => (
                                        <div className="financial-transactions-table__row" role="row" key={transaction.id}>
                                            <div className="financial-transactions-table__description" role="cell">
                                                <span className={`financial-transactions-table__type-icon financial-transactions-table__type-icon--${transaction.type}`} aria-hidden="true">
                                                    <FontAwesomeIcon icon={transaction.type === "income" ? faArrowTrendUp : faArrowTrendDown} />
                                                </span>
                                                <div>
                                                    <strong>{transaction.description}</strong>
                                                    <span>{transaction.type === "income" ? "Entrada" : "Saída"}</span>
                                                </div>
                                            </div>

                                            <span className="financial-transactions-table__category" role="cell" data-label="Categoria" aria-label={`Categoria: ${transaction.categoryName}`}>
                                                {transaction.categoryName}
                                            </span>

                                            <span className="financial-transactions-table__date" role="cell" data-label="Data" aria-label={`Data de referência: ${formatReferenceDate(transaction.referenceDate)}`}>
                                                {formatReferenceDate(transaction.referenceDate)}
                                            </span>

                                            <strong className={`financial-transactions-table__amount financial-transactions-table__amount--${transaction.type}`} role="cell" data-label="Valor" aria-label={`Valor: ${transaction.type === "income" ? "Entrada" : "Saída"} de ${formatCurrency(transaction.value)}`}>
                                                {transaction.type === "income" ? "+" : "−"} {formatCurrency(transaction.value)}
                                            </strong>

                                            <div className="financial-transactions-table__actions" role="cell">
                                                <button
                                                    type="button"
                                                    onClick={() => setTransactionToEdit(transaction)}
                                                    title="Editar lançamento"
                                                    aria-label={`Editar lançamento: ${transaction.description}`}
                                                >
                                                    <FontAwesomeIcon icon={faPencil} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        transactionMutations.remove.reset();
                                                        setTransactionToDelete(transaction);
                                                    }}
                                                    title="Excluir lançamento"
                                                    aria-label={`Excluir lançamento: ${transaction.description}`}
                                                >
                                                    <FontAwesomeIcon icon={faTrash} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {transactionsResult.totalPages > 1 && (
                                <nav className="financial-transactions-pagination" aria-label="Paginação dos lançamentos">
                                    <span>
                                        Página {transactionsResult.page} de {transactionsResult.totalPages}
                                    </span>
                                    <div>
                                        <button
                                            type="button"
                                            onClick={() => setTransactionPage((page) => Math.max(1, page - 1))}
                                            disabled={transactionPage <= 1 || transactionsQuery.isFetching}
                                            aria-label="Página anterior"
                                        >
                                            <FontAwesomeIcon icon={faChevronLeft} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setTransactionPage((page) => Math.min(transactionsResult.totalPages, page + 1))}
                                            disabled={transactionPage >= transactionsResult.totalPages || transactionsQuery.isFetching}
                                            aria-label="Próxima página"
                                        >
                                            <FontAwesomeIcon icon={faChevronRight} />
                                        </button>
                                    </div>
                                </nav>
                            )}
                        </>
                    )}
                </section>

                <section
                    className="financial-transactions-search-section"
                    aria-labelledby="financial-transactions-search-title"
                >
                    <header className="financial-transactions-list-section__header">
                        <div>
                            <span className="financial-transactions-eyebrow">Consulta avançada</span>
                            <h2 id="financial-transactions-search-title">Pesquisar lançamentos</h2>
                            <p>Pesquise em todo o histórico por descrição, tipo, categoria, valor exato ou data de referência.</p>
                        </div>
                    </header>

                    <form className="financial-transactions-search" onSubmit={handleSearchSubmit}>
                        <div className="financial-transactions-search__fields">
                            <label className="financial-transactions-search__field financial-transactions-search__field--description">
                                <span>Descrição</span>
                                <div className="financial-transactions-search__input-wrap">
                                    <FontAwesomeIcon icon={faMagnifyingGlass} aria-hidden="true" />
                                    <input
                                        type="search"
                                        value={searchDescription}
                                        onChange={(event) => setSearchDescription(event.target.value)}
                                        placeholder="Ex.: compra de materiais"
                                        aria-label="Pesquisar pela descrição do lançamento"
                                    />
                                </div>
                            </label>

                            <label className="financial-transactions-search__field">
                                <span>Tipo</span>
                                <select
                                    value={searchType}
                                    onChange={(event) => setSearchType(event.target.value as FinancialType | "")}
                                    aria-label="Filtrar por tipo de lançamento"
                                >
                                    <option value="">Todos os tipos</option>
                                    <option value="income">Entradas</option>
                                    <option value="expense">Saídas</option>
                                </select>
                            </label>

                            <label className="financial-transactions-search__field">
                                <span>Categoria</span>
                                <select
                                    value={searchCategoryId}
                                    onChange={(event) => setSearchCategoryId(event.target.value)}
                                    aria-label="Filtrar por categoria"
                                    disabled={categoriesQuery.isPending || categoriesQuery.isError}
                                >
                                    <option value="">Todas as categorias</option>
                                    {(categoriesQuery.data ?? []).filter((category) => category.type === "income").length > 0 && (
                                        <optgroup label="Entradas">
                                            {(categoriesQuery.data ?? []).filter((category) => category.type === "income").map((category) => (
                                                <option key={category.id} value={category.id}>
                                                    {category.name}{category.active ? "" : " (inativa)"}
                                                </option>
                                            ))}
                                        </optgroup>
                                    )}
                                    {(categoriesQuery.data ?? []).filter((category) => category.type === "expense").length > 0 && (
                                        <optgroup label="Saídas">
                                            {(categoriesQuery.data ?? []).filter((category) => category.type === "expense").map((category) => (
                                                <option key={category.id} value={category.id}>
                                                    {category.name}{category.active ? "" : " (inativa)"}
                                                </option>
                                            ))}
                                        </optgroup>
                                    )}
                                </select>
                            </label>

                            <label className="financial-transactions-search__field">
                                <span>Valor exato (R$)</span>
                                <input
                                    type="number"
                                    min="1"
                                    step="0.01"
                                    value={searchValue}
                                    onChange={(event) => setSearchValue(event.target.value)}
                                    placeholder="Ex.: 150,00"
                                    aria-label="Filtrar pelo valor exato"
                                />
                            </label>

                            <label className="financial-transactions-search__field">
                                <span>Data de referência</span>
                                <input
                                    type="date"
                                    value={searchReferenceDate}
                                    onChange={(event) => setSearchReferenceDate(event.target.value)}
                                    aria-label="Filtrar pela data de referência"
                                />
                            </label>
                        </div>

                        {categoriesQuery.isError && (
                            <p className="financial-transactions-search__notice" role="status">
                                Não foi possível carregar as categorias. Você ainda pode pesquisar pelos outros campos.
                                {" "}
                                <button type="button" onClick={() => categoriesQuery.refetch()}>
                                    Tentar novamente
                                </button>
                            </p>
                        )}

                        {searchValue.trim() !== "" && (!Number.isFinite(Number(searchValue)) || Number(searchValue) < 1) && (
                            <p className="financial-transactions-search__notice" role="status">
                                O valor precisa ser um número maior ou igual a R$ 1,00.
                            </p>
                        )}

                        <div className="financial-transactions-search__actions">
                            {(searchDescription || searchType || searchCategoryId || searchValue || searchReferenceDate || hasActiveSearch) && (
                                <button
                                    className="financial-transactions-search__clear"
                                    type="button"
                                    onClick={handleClearSearch}
                                >
                                    <FontAwesomeIcon icon={faRotateLeft} aria-hidden="true" />
                                    Limpar filtros
                                </button>
                            )}
                            <button className="financial-transactions-search__submit" type="submit">
                                <FontAwesomeIcon icon={faMagnifyingGlass} aria-hidden="true" />
                                Pesquisar lançamentos
                            </button>
                        </div>
                    </form>

                    {!hasActiveSearch ? (
                        <div className="financial-transactions-list-feedback" role="status">
                            Preencha ao menos um filtro e clique em “Pesquisar lançamentos” para consultar o histórico.
                        </div>
                    ) : filteredTransactionsQuery.isError ? (
                        <div className="financial-transactions-feedback" role="alert">
                            <p>Não foi possível pesquisar os lançamentos.</p>
                            <button type="button" onClick={() => filteredTransactionsQuery.refetch()}>
                                Tentar novamente
                            </button>
                        </div>
                    ) : filteredTransactionsQuery.isPending ? (
                        <div className="financial-transactions-list-feedback" role="status">
                            Pesquisando lançamentos…
                        </div>
                    ) : !filteredTransactions || filteredTransactions.length === 0 ? (
                        <div className="financial-transactions-empty">
                            <span className="financial-transactions-empty__icon" aria-hidden="true">
                                <FontAwesomeIcon icon={faArrowDown} />
                            </span>
                            <h3>Nenhum lançamento corresponde aos filtros</h3>
                            <p>Tente ajustar os termos da pesquisa ou limpar os filtros para consultar outros lançamentos.</p>
                        </div>
                    ) : (
                        <>
                            <p className="financial-transactions-search__results-count" aria-live="polite">
                                {filteredTransactions.length} {filteredTransactions.length === 1 ? "lançamento encontrado" : "lançamentos encontrados"}
                            </p>
                            <div className="financial-transactions-table-wrap">
                                <div className="financial-transactions-table" role="table" aria-label="Resultados da pesquisa de lançamentos">
                                    <div className="financial-transactions-table__head" role="row">
                                        <span role="columnheader">Lançamento</span>
                                        <span role="columnheader">Categoria</span>
                                        <span role="columnheader">Data de referência</span>
                                        <span role="columnheader" className="financial-transactions-table__amount-heading">Valor</span>
                                        <span role="columnheader" className="financial-transactions-table__actions-heading">Ações</span>
                                    </div>

                                    {visibleFilteredTransactions?.map((transaction) => (
                                        <div className="financial-transactions-table__row" role="row" key={transaction.id}>
                                            <div className="financial-transactions-table__description" role="cell">
                                                <span className={`financial-transactions-table__type-icon financial-transactions-table__type-icon--${transaction.type}`} aria-hidden="true">
                                                    <FontAwesomeIcon icon={transaction.type === "income" ? faArrowTrendUp : faArrowTrendDown} />
                                                </span>
                                                <div>
                                                    <strong>{transaction.description}</strong>
                                                    <span>{transaction.type === "income" ? "Entrada" : "Saída"}</span>
                                                </div>
                                            </div>
                                            <span className="financial-transactions-table__category" role="cell" data-label="Categoria" aria-label={`Categoria: ${transaction.categoryName}`}>{transaction.categoryName}</span>
                                            <span className="financial-transactions-table__date" role="cell" data-label="Data" aria-label={`Data de referência: ${formatReferenceDate(transaction.referenceDate)}`}>{formatReferenceDate(transaction.referenceDate)}</span>
                                            <strong className={`financial-transactions-table__amount financial-transactions-table__amount--${transaction.type}`} role="cell" data-label="Valor" aria-label={`Valor: ${transaction.type === "income" ? "Entrada" : "Saída"} de ${formatCurrency(transaction.value)}`}>
                                                {transaction.type === "income" ? "+" : "−"} {formatCurrency(transaction.value)}
                                            </strong>
                                            <div className="financial-transactions-table__actions" role="cell">
                                                <button
                                                    type="button"
                                                    onClick={() => setTransactionToEdit(transaction)}
                                                    title="Editar lançamento"
                                                    aria-label={`Editar lançamento: ${transaction.description}`}
                                                >
                                                    <FontAwesomeIcon icon={faPencil} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        transactionMutations.remove.reset();
                                                        setTransactionToDelete(transaction);
                                                    }}
                                                    title="Excluir lançamento"
                                                    aria-label={`Excluir lançamento: ${transaction.description}`}
                                                >
                                                    <FontAwesomeIcon icon={faTrash} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {filteredTransactionsTotalPages > 1 && (
                                <nav className="financial-transactions-pagination" aria-label="Paginação dos resultados da pesquisa">
                                    <span>
                                        Página {searchPage} de {filteredTransactionsTotalPages}
                                    </span>
                                    <div>
                                        <button
                                            type="button"
                                            onClick={() => setSearchPage((page) => Math.max(1, page - 1))}
                                            disabled={searchPage <= 1 || filteredTransactionsQuery.isFetching}
                                            aria-label="Página anterior dos resultados da pesquisa"
                                        >
                                            <FontAwesomeIcon icon={faChevronLeft} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setSearchPage((page) => Math.min(filteredTransactionsTotalPages, page + 1))}
                                            disabled={searchPage >= filteredTransactionsTotalPages || filteredTransactionsQuery.isFetching}
                                            aria-label="Próxima página dos resultados da pesquisa"
                                        >
                                            <FontAwesomeIcon icon={faChevronRight} />
                                        </button>
                                    </div>
                                </nav>
                            )}
                        </>
                    )}
                </section>
            </section>

            {(isCreateModalOpen || transactionToEdit) && (
                <FinancialTransactionCreateModal
                    isOpen
                    selectedYear={selectedYear}
                    selectedMonth={selectedMonth}
                    transaction={transactionToEdit ?? undefined}
                    onClose={() => {
                        setIsCreateModalOpen(false);
                        setTransactionToEdit(null);
                    }}
                    onSaved={handleTransactionSaved}
                />
            )}

            {transactionToDelete && (
                <Modal
                    isOpen
                    title="Excluir lançamento"
                    onClose={() => {
                        if (!transactionMutations.remove.isPending) {
                            setTransactionToDelete(null);
                        }
                    }}
                >
                    <div className="financial-transaction-delete">
                        <p>
                            Tem certeza de que deseja excluir o lançamento
                            {" "}<strong>“{transactionToDelete.description}”</strong>?
                        </p>
                        <p>Essa ação não pode ser desfeita.</p>

                        {transactionMutations.remove.isError && (
                            <p className="financial-transaction-form__error" role="alert">
                                Não foi possível excluir o lançamento. Tente novamente.
                            </p>
                        )}

                        <footer className="financial-transaction-form__actions">
                            <button
                                className="financial-transaction-form__cancel-button"
                                type="button"
                                onClick={() => setTransactionToDelete(null)}
                                disabled={transactionMutations.remove.isPending}
                            >
                                Cancelar
                            </button>
                            <button
                                className="financial-transaction-delete__confirm"
                                type="button"
                                onClick={handleDeleteTransaction}
                                disabled={transactionMutations.remove.isPending}
                            >
                                {transactionMutations.remove.isPending ? "Excluindo…" : "Excluir lançamento"}
                            </button>
                        </footer>
                    </div>
                </Modal>
            )}
        </main>
    );
}
