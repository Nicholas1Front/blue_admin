import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faCalendarDays,
    faChevronRight,
    faFilter,
    faChartColumn,
    faFileCircleCheck,
    faFileCircleXmark,
    faFileInvoiceDollar,
    faFilePen,
    faFileSignature,
    faFilePdf,
    faPlus,
    faChevronDown,
    faChevronUp,
    faPenToSquare,
    faPaperPlane,
    faTrashCan,
    faRotateRight,
    faTags,
    faWrench
} from "@fortawesome/free-solid-svg-icons";

import { AppHeader } from "../../components/AppHeader/AppHeader";
import { BudgetCategoriesManager } from "./components/BudgetCategoriesManager/BudgetCategoriesManager";
import { BudgetAdvancedFiltersForm } from "./components/BudgetAdvancedFiltersForm/BudgetAdvancedFiltersForm";
import { BudgetServiceConversionSearchModal } from "./components/BudgetServiceConversionSearchModal/BudgetServiceConversionSearchModal";
import { ClientSelectModal } from "../Clients/components/ClientSelectModal/ClientSelectModal";
import { ClientCreateModal } from "../Clients/components/ClientCreateModal/ClientCreateModal";
import { EquipamentSelectModal } from "../Clients/components/EquipamentSelectModal/EquipamentSelectModal";
import { EquipamentCreateModal } from "../Clients/components/EquipamentCreateModal/EquipamentCreateModal";
import { useClients } from "../../modules/clients/useClients";
import { useEquipaments } from "../../modules/equipaments/useEquipaments";
import type { Client, CreateClientRequest } from "../../modules/clients/clients.types";
import type { CreateEquipamentRequest } from "../../modules/equipaments/equipaments.types";
import { updateBudgetAdvancedFilter, validateBudgetAdvancedFilters } from "./utils/budgetFilters.utils";
import { BackLink } from "../../components/BackLink/BackLink";
import {
    useBudgetDashboard,
    useBudgetsByAdvancedFilters,
    useBudgetMutations
} from "../../modules/budgets";
import type {
    BudgetSearchSummary,
    BudgetStatus,
    FindBudgetsByAdvancedFilters
} from "../../modules/budgets";
import "./Budgets.css";

const PAGE_SIZE = 10;

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
});

const statusLabels: Record<BudgetStatus, string> = {
    rascunho: "Rascunho",
    enviado: "Enviado",
    aprovado: "Aprovado",
    rejeitado: "Rejeitado",
    expirado: "Expirado",
    cancelado: "Cancelado"
};

const statusTones: Record<BudgetStatus, string> = {
    rascunho: "neutral",
    enviado: "info",
    aprovado: "success",
    rejeitado: "danger",
    expirado: "warning",
    cancelado: "muted"
};

const statusCards: Array<{
    status: BudgetStatus;
    icon: typeof faFilePen;
}> = [
    { status: "rascunho", icon: faFilePen },
    { status: "enviado", icon: faPaperPlane },
    { status: "aprovado", icon: faFileCircleCheck },
    { status: "rejeitado", icon: faFileCircleXmark },
    { status: "expirado", icon: faFileSignature },
    { status: "cancelado", icon: faFileInvoiceDollar }
];

function formatCurrency(value: number | string | null | undefined) {
    return currencyFormatter.format(Number(value ?? 0));
}

function formatDate(value: string) {
    return new Date(`${value.slice(0, 10)}T12:00:00`).toLocaleDateString("pt-BR");
}

function formatEquipment(equipment: BudgetSearchSummary["equipament"]) {
    return [
        equipment.type,
        equipment.brand,
        equipment.model,
        equipment.mainIdentification,
        equipment.additionalIdentification
    ].filter(Boolean).join(" · ");
}

function formatBudgetName(budget: BudgetSearchSummary) {
    return `Orçamento ${budget.id} - ${budget.client.name} - ${formatEquipment(budget.equipament) || "Equipamento não informado"}`;
}

function getPeriodRange(year: number, month: number) {
    const lastDay = new Date(year, month, 0).getDate();
    const pad = (value: number) => String(value).padStart(2, "0");

    return {
        createdAtFrom: `${year}-${pad(month)}-01`,
        createdAtTo: `${year}-${pad(month)}-${lastDay}`
    };
}

function BudgetPagination({
    page,
    totalPages,
    total,
    onPageChange
}: {
    page: number;
    totalPages: number;
    total: number;
    onPageChange: (page: number) => void;
}) {
    if (total === 0) return null;

    return (
        <nav className="budgets-pagination" aria-label="Paginação dos orçamentos">
            <span>
                Página <strong>{page}</strong> de <strong>{Math.max(totalPages, 1)}</strong>
                <span> · {total} {total === 1 ? "orçamento" : "orçamentos"}</span>
            </span>
            <div className="budgets-pagination__actions">
                <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => onPageChange(page - 1)}
                >
                    Anterior
                </button>
                <button
                    type="button"
                    disabled={totalPages === 0 || page >= totalPages}
                    onClick={() => onPageChange(page + 1)}
                >
                    Próxima
                </button>
            </div>
        </nav>
    );
}

function BudgetListItem({ budget }: { budget: BudgetSearchSummary }) {
    return (
        <Link
            className="budgets-list-item"
            to={`/budgets/${encodeURIComponent(budget.id)}`}
            aria-label={`Consultar ${formatBudgetName(budget)}`}
        >
            <div className="budgets-list-item__main">
                <div className="budgets-list-item__identity">
                    <div>
                        <strong className="budgets-list-item__title">{formatBudgetName(budget)}</strong>
                    </div>
                    <span className={`budgets-status budgets-status--${statusTones[budget.status]}`}>
                        {statusLabels[budget.status]}
                    </span>
                </div>

                <div className="budgets-list-item__meta">
                    <span>
                        <small>Criado em</small>
                        <strong>{formatDate(budget.createdAt)}</strong>
                    </span>
                    <span>
                        <small>Itens</small>
                        <strong>{budget._count?.items ?? 0}</strong>
                    </span>
                    <span>
                        <small>Valor final</small>
                        <strong className="budgets-list-item__amount">
                            {formatCurrency(budget.finalAmount)}
                        </strong>
                    </span>
                </div>
            </div>
            <FontAwesomeIcon
                className="budgets-list-item__arrow"
                icon={faChevronRight}
                aria-hidden="true"
            />
        </Link>
    );
}

export function Budgets() {
    const navigate = useNavigate();
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const [selectedMonth, setSelectedMonth] = useState(currentMonth);
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [page, setPage] = useState(1);
    const [selectedStatus, setSelectedStatus] = useState<BudgetStatus | null>(null);
    const [filterForm, setFilterForm] = useState<FindBudgetsByAdvancedFilters>({});
    const [submittedFilters, setSubmittedFilters] = useState<FindBudgetsByAdvancedFilters | null>(null);
    const [filterError, setFilterError] = useState<string | null>(null);
    const [serviceConversionSearchOpen, setServiceConversionSearchOpen] = useState(false);
    const [budgetSearchAction, setBudgetSearchAction] = useState<"edit" | "delete" | "pdf" | null>(null);
    const [budgetCreationStep, setBudgetCreationStep] = useState<"client" | "equipament" | null>(null);
    const [budgetCreationClient, setBudgetCreationClient] = useState<Pick<Client, "id" | "name"> | null>(null);
    const [budgetCreationError, setBudgetCreationError] = useState<string | null>(null);
    const [isCreateBudgetClientOpen, setIsCreateBudgetClientOpen] = useState(false);
    const [isCreateBudgetEquipamentOpen, setIsCreateBudgetEquipamentOpen] = useState(false);
    const [isOverviewExpanded, setIsOverviewExpanded] = useState(true);
    const [isFiltersExpanded, setIsFiltersExpanded] = useState(true);
    const clientsQuery = useClients();
    const equipamentsQuery = useEquipaments();
    const budgetMutations = useBudgetMutations();

    const availableYears = Array.from(
        { length: currentYear - 1999 },
        (_, index) => currentYear - index
    );
    const availableMonths = Array.from({ length: 12 }, (_, index) => ({
        value: index + 1,
        label: new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(
            new Date(2000, index, 1)
        )
    }));

    useEffect(() => {
        if (budgetCreationStep === "client") void clientsQuery.loadClients();
    }, [budgetCreationStep, clientsQuery.loadClients]);

    useEffect(() => {
        if (budgetCreationStep === "equipament" && budgetCreationClient) {
            void equipamentsQuery.loadEquipaments(budgetCreationClient.id);
        }
    }, [budgetCreationStep, budgetCreationClient, equipamentsQuery.loadEquipaments]);

    const dashboardQuery = useBudgetDashboard({
        year: selectedYear,
        month: selectedMonth,
        page: 1,
        limit: 1
    });

    const periodRange = getPeriodRange(selectedYear, selectedMonth);
    const listFilters: FindBudgetsByAdvancedFilters = {
        ...periodRange,
        ...(selectedStatus ? { status: selectedStatus } : {}),
        page,
        limit: PAGE_SIZE
    };
    const budgetsQuery = useBudgetsByAdvancedFilters(listFilters);
    const filteredBudgetsQuery = useBudgetsByAdvancedFilters(
        submittedFilters ?? { page: 1, limit: PAGE_SIZE },
        Boolean(submittedFilters)
    );

    const dashboard = dashboardQuery.data;
    const budgetList = budgetsQuery.data;
    const periodTitle = new Intl.DateTimeFormat("pt-BR", {
        month: "long",
        year: "numeric"
    }).format(new Date(selectedYear, selectedMonth - 1, 1));

    function openBudgetCreation() {
        setBudgetCreationError(null);
        setBudgetCreationClient(null);
        setBudgetCreationStep("client");
    }

    function openBudgetSearch(action: "edit" | "delete" | "pdf") {
        setBudgetSearchAction(action);
    }

    function closeBudgetSearch() {
        setBudgetSearchAction(null);
    }

    async function createBudgetForEquipment(equipamentId: string) {
        if (!budgetCreationClient) return;
        setBudgetCreationError(null);
        try {
            const budget = await budgetMutations.create.mutateAsync({
                clientId: budgetCreationClient.id,
                equipamentId
            });
            setBudgetCreationStep(null);
            setBudgetCreationClient(null);
            navigate(`/budgets/${encodeURIComponent(budget.id)}`);
        } catch (error) {
            setBudgetCreationError(
                error instanceof Error ? error.message : "Não foi possível criar o orçamento."
            );
            setBudgetCreationStep("equipament");
        }
    }

    async function createBudgetClient(data: CreateClientRequest) {
        const client = await clientsQuery.addClient(data);
        setBudgetCreationClient({ id: client.id, name: client.name });
        setIsCreateBudgetClientOpen(false);
        setBudgetCreationError(null);
        setBudgetCreationStep("equipament");
    }

    async function createBudgetEquipament(data: CreateEquipamentRequest) {
        if (!budgetCreationClient) return;
        const equipament = await equipamentsQuery.addEquipament(budgetCreationClient.id, data);
        setIsCreateBudgetEquipamentOpen(false);
        await createBudgetForEquipment(equipament.id);
    }

    function handleMonthChange(month: number) {
        setSelectedMonth(month);
        setPage(1);
    }

    function handleYearChange(year: number) {
        if (!Number.isInteger(year) || year < 2000 || year > currentYear) return;

        setSelectedYear(year);
        setPage(1);

        if (year === currentYear && selectedMonth > currentMonth) {
            setSelectedMonth(currentMonth);
        }
    }

    function selectStatus(status: BudgetStatus | null) {
        setSelectedStatus(status);
        setPage(1);
    }

    function updateFilter(key: keyof FindBudgetsByAdvancedFilters, value: string, numeric = false) {
        setFilterForm(current => updateBudgetAdvancedFilter(current, key, value, numeric));
    }

    function submitAdvancedFilters(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const validationError = validateBudgetAdvancedFilters(filterForm);

        if (validationError) {
            setFilterError(validationError);
            return;
        }

        setFilterError(null);
        setSubmittedFilters({ ...filterForm, page: 1, limit: PAGE_SIZE });
    }

    function clearAdvancedFilters() {
        setFilterForm({});
        setSubmittedFilters(null);
        setFilterError(null);
    }

    function changeFilterPage(nextPage: number) {
        setSubmittedFilters(current => current ? { ...current, page: nextPage } : current);
    }

    return (
        <main className="budgets-page">
            <title>Orçamentos | Blue Admin</title>
            <AppHeader />
            <nav className="page-back-row" aria-label="Navegação da página">
                <BackLink />
            </nav>

            <section className="budgets-content">
                <header className="budgets-heading">
                    <div className="budgets-heading__copy">
                        <span className="budgets-eyebrow">Gestão comercial</span>
                        <h1>Orçamentos em perspectiva.</h1>
                        <p>
                            Organize suas propostas, acompanhe os status e consulte
                            os orçamentos registrados no período.
                        </p>
                    </div>

                    <div className="budgets-period-control">
                        <span className="budgets-period-control__label">
                            <FontAwesomeIcon icon={faCalendarDays} aria-hidden="true" />
                            Período de análise
                        </span>
                        <div className="budgets-period-control__picker">
                            <label>
                                <span>Mês</span>
                                <select
                                    aria-label="Selecionar mês dos orçamentos"
                                    value={selectedMonth}
                                    onChange={event => handleMonthChange(Number(event.target.value))}
                                >
                                    {availableMonths.map(month => (
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
                            <label>
                                <span>Ano</span>
                                <select
                                    aria-label="Selecionar ano dos orçamentos"
                                    value={selectedYear}
                                    onChange={event => handleYearChange(Number(event.target.value))}
                                >
                                    {availableYears.map(year => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </select>
                            </label>
                        </div>
                    </div>
                </header>

                {(dashboardQuery.isError || budgetsQuery.isError) && (
                    <div className="budgets-alert" role="alert">
                        <span>
                            Não foi possível carregar todas as informações dos orçamentos.
                            Confira sua conexão e tente novamente.
                        </span>
                        <button
                            type="button"
                            onClick={() => {
                                if (dashboardQuery.isError) void dashboardQuery.refetch();
                                if (budgetsQuery.isError) void budgetsQuery.refetch();
                            }}
                        >
                            <FontAwesomeIcon icon={faRotateRight} aria-hidden="true" />
                            Tentar novamente
                        </button>
                    </div>
                )}

                <section className="budgets-quick-actions" aria-label="Acessos rápidos">
                    <div className="budgets-quick-actions__heading">
                        <span className="budgets-quick-actions__eyebrow">Acesso rápido</span>
                        <h2>Atalhos de orçamento</h2>
                    </div>

                    <div className="budgets-quick-actions__grid">
                        <button type="button" className="budgets-action-button budgets-action-button--create" onClick={openBudgetCreation}>
                            <FontAwesomeIcon icon={faPlus} aria-hidden="true" />
                            <span>Criar orçamento</span>
                        </button>
                        <button type="button" className="budgets-action-button budgets-action-button--convert" onClick={() => setServiceConversionSearchOpen(true)}>
                            <FontAwesomeIcon icon={faWrench} aria-hidden="true" />
                            <span>Criar serviço a partir de orçamento</span>
                        </button>
                        <button type="button" className="budgets-action-button budgets-action-button--edit" onClick={() => openBudgetSearch("edit")}>
                            <FontAwesomeIcon icon={faPenToSquare} aria-hidden="true" />
                            <span>Editar orçamento</span>
                        </button>
                        <button type="button" className="budgets-action-button budgets-action-button--delete" onClick={() => openBudgetSearch("delete")}>
                            <FontAwesomeIcon icon={faTrashCan} aria-hidden="true" />
                            <span>Excluir orçamento</span>
                        </button>
                        <button type="button" className="budgets-action-button budgets-action-button--pdf" onClick={() => openBudgetSearch("pdf")}>
                            <FontAwesomeIcon icon={faFilePdf} aria-hidden="true" />
                            <span>Salvar orçamento em PDF</span>
                        </button>
                    </div>
                </section>

                <section className="budgets-overview" aria-labelledby="budgets-overview-title">
                    <div className="budgets-section-heading">
                        <div>
                            <span className="budgets-section-eyebrow">Resumo do período</span>
                            <h2 id="budgets-overview-title">Visão geral</h2>
                        </div>
                        <div className="budgets-section-heading__actions">
                            <span className="budgets-period-tag">{periodTitle}</span>
                            <button
                                type="button"
                                className="budgets-collapse-toggle"
                                aria-expanded={isOverviewExpanded}
                                aria-controls="budgets-overview-content"
                                onClick={() => setIsOverviewExpanded(value => !value)}
                            >
                                <FontAwesomeIcon icon={isOverviewExpanded ? faChevronUp : faChevronDown} aria-hidden="true" />
                                {isOverviewExpanded ? "Recolher" : "Expandir"}
                            </button>
                        </div>
                    </div>

                    {isOverviewExpanded && <div id="budgets-overview-content">
                    <div className="budgets-status-grid">
                        <button
                            type="button"
                            className={`budgets-status-card budgets-status-card--total${selectedStatus === null ? " is-active" : ""}`}
                            onClick={() => selectStatus(null)}
                            aria-pressed={selectedStatus === null}
                        >
                            <span className="budgets-status-card__top">
                                <span>Todos</span>
                                <strong>
                                    {dashboardQuery.isPending ? "—" : dashboard?.budgetCount ?? 0}
                                </strong>
                                <span className="budgets-status-card__icon">
                                    <FontAwesomeIcon icon={faFileInvoiceDollar} aria-hidden="true" />
                                </span>
                            </span>
                        </button>

                        {statusCards.map(({ status, icon }) => (
                            <button
                                type="button"
                                key={status}
                                className={`budgets-status-card budgets-status-card--${statusTones[status]}${selectedStatus === status ? " is-active" : ""}`}
                                onClick={() => selectStatus(status)}
                                aria-pressed={selectedStatus === status}
                            >
                                <span className="budgets-status-card__top">
                                    <span>{statusLabels[status]}</span>
                                    <strong>
                                        {dashboardQuery.isPending
                                            ? "—"
                                            : dashboard?.statusCounts[status] ?? 0}
                                    </strong>
                                    <span className="budgets-status-card__icon">
                                        <FontAwesomeIcon icon={icon} aria-hidden="true" />
                                    </span>
                                </span>
                            </button>
                        ))}
                    </div>
                    {dashboard?.financialNote && (
                        <p className="budgets-financial-note">{dashboard.financialNote}</p>
                    )}
                    </div>}
                </section>

                <section className="budgets-list-panel" id="budgets-list" aria-labelledby="budgets-list-title">
                    <header className="budgets-list-panel__header">
                        <div>
                            <h2 id="budgets-list-title">
                                {selectedStatus
                                    ? `Orçamentos ${statusLabels[selectedStatus].toLowerCase()}`
                                    : "Orçamentos do mês"}
                            </h2>
                            <p>
                                {selectedStatus
                                    ? "A lista está filtrada pelo status selecionado."
                                    : "Todos os orçamentos cadastrados no mês selecionado."}
                            </p>
                        </div>
                        {selectedStatus && (
                            <button
                                type="button"
                                className="budgets-clear-filter"
                                onClick={() => selectStatus(null)}
                            >
                                Limpar filtro
                            </button>
                        )}
                    </header>

                    {budgetsQuery.isPending ? (
                        <div className="budgets-state">
                            <span className="budgets-state__spinner" aria-hidden="true" />
                            Carregando orçamentos…
                        </div>
                    ) : budgetsQuery.isError ? (
                        <div className="budgets-state" role="alert">
                            Não foi possível carregar a consulta de orçamentos.
                            <button type="button" onClick={() => void budgetsQuery.refetch()}>
                                Tentar novamente
                            </button>
                        </div>
                    ) : budgetList && budgetList.budgets.length > 0 ? (
                        <>
                            <div className="budgets-list">
                                {budgetList.budgets.map(budget => (
                                    <BudgetListItem key={budget.id} budget={budget} />
                                ))}
                            </div>
                            <BudgetPagination
                                page={budgetList.page}
                                totalPages={budgetList.totalPages}
                                total={budgetList.total}
                                onPageChange={setPage}
                            />
                        </>
                    ) : (
                        <div className="budgets-state budgets-state--empty">
                            <span className="budgets-state__empty-icon" aria-hidden="true">
                                <FontAwesomeIcon icon={faFileInvoiceDollar} />
                            </span>
                            <strong>Nenhum orçamento encontrado</strong>
                            <p>
                                Não há orçamentos para os filtros e o período selecionados.
                                Experimente outro mês ou remova o filtro de status.
                            </p>
                            {selectedStatus && (
                                <button type="button" onClick={() => selectStatus(null)}>
                                    Ver todos os orçamentos
                                </button>
                            )}
                        </div>
                    )}
                </section>

                <section className="budgets-filter-panel" aria-labelledby="budgets-filter-title">
                    <header className="budgets-filter-panel__header">
                        <div>
                            <span className="budgets-section-eyebrow">Busca avançada</span>
                            <h2 id="budgets-filter-title">Consultar orçamentos</h2>
                            <p>Combine os filtros para localizar orçamentos, itens ou registros do histórico.</p>
                        </div>
                        <div className="budgets-filter-panel__header-actions">
                            <span className="budgets-filter-panel__icon" aria-hidden="true">
                                <FontAwesomeIcon icon={faFilter} />
                            </span>
                            <button
                                type="button"
                                className="budgets-collapse-toggle"
                                aria-expanded={isFiltersExpanded}
                                aria-controls="budgets-filter-content"
                                onClick={() => setIsFiltersExpanded(value => !value)}
                            >
                                <FontAwesomeIcon icon={isFiltersExpanded ? faChevronUp : faChevronDown} aria-hidden="true" />
                                {isFiltersExpanded ? "Recolher" : "Expandir"}
                            </button>
                        </div>
                    </header>

                    {isFiltersExpanded && <div id="budgets-filter-content">
                    <BudgetAdvancedFiltersForm
                        values={filterForm}
                        onChange={updateFilter}
                        onSubmit={submitAdvancedFilters}
                        onClear={clearAdvancedFilters}
                        error={filterError}
                    />

                    {submittedFilters && (
                        <div className="budgets-filter-results">
                            <div className="budgets-filter-results__heading">
                                <div>
                                    <strong>Resultados da consulta</strong>
                                    <span>{filteredBudgetsQuery.data?.total ?? 0} orçamento(s) encontrado(s)</span>
                                </div>
                            </div>

                            {filteredBudgetsQuery.isPending ? (
                                <div className="budgets-state">
                                    <span className="budgets-state__spinner" aria-hidden="true" />
                                    Buscando orçamentos…
                                </div>
                            ) : filteredBudgetsQuery.isError ? (
                                <div className="budgets-state" role="alert">
                                    Não foi possível concluir a consulta.
                                    <button type="button" onClick={() => void filteredBudgetsQuery.refetch()}>Tentar novamente</button>
                                </div>
                            ) : filteredBudgetsQuery.data?.budgets.length ? (
                                <>
                                    <div className="budgets-list">
                                        {filteredBudgetsQuery.data.budgets.map(budget => (
                                            <BudgetListItem key={budget.id} budget={budget} />
                                        ))}
                                    </div>
                                    <BudgetPagination
                                        page={filteredBudgetsQuery.data.page}
                                        totalPages={filteredBudgetsQuery.data.totalPages}
                                        total={filteredBudgetsQuery.data.total}
                                        onPageChange={changeFilterPage}
                                    />
                                </>
                            ) : (
                                <div className="budgets-state budgets-state--empty">
                                    <strong>Nenhum orçamento encontrado</strong>
                                    <p>Não encontramos orçamentos com os critérios informados. Ajuste os filtros e tente novamente.</p>
                                </div>
                            )}
                        </div>
                    )}
                    </div>}
                </section>

                <section className="budgets-metrics-access" aria-label="Métricas de orçamento">
                    <div>
                        <span className="budgets-section-eyebrow">Acompanhamento</span>
                        <h2>Métricas de orçamentos</h2>
                        <p>Visualize a evolução e a distribuição dos orçamentos ao longo do ano.</p>
                    </div>
                    <button type="button" className="budgets-metrics-access__button">
                        <FontAwesomeIcon icon={faChartColumn} aria-hidden="true" />
                        Acessar métricas
                    </button>
                </section>

                <section className="budgets-metrics-access" aria-label="Tabela de preços">
                    <div>
                        <span className="budgets-section-eyebrow">Referência comercial</span>
                        <h2>Tabela de preços</h2>
                        <p>Consulte e organize os valores de referência para os itens dos orçamentos.</p>
                    </div>
                    <button type="button" className="budgets-metrics-access__button">
                        <FontAwesomeIcon icon={faTags} aria-hidden="true" />
                        Acessar tabela de preços
                    </button>
                </section>

                <BudgetCategoriesManager />
            </section>

            <BudgetServiceConversionSearchModal
                isOpen={serviceConversionSearchOpen}
                onClose={() => setServiceConversionSearchOpen(false)}
                onSelect={budgetId => {
                    setServiceConversionSearchOpen(false);
                    navigate(`/budgets/${encodeURIComponent(budgetId)}?createService=1`);
                }}
            />

            <BudgetServiceConversionSearchModal
                isOpen={budgetSearchAction !== null}
                title={
                    budgetSearchAction === "edit" ? "Selecionar orçamento para editar"
                        : budgetSearchAction === "delete" ? "Selecionar orçamento para excluir"
                            : "Selecionar orçamento para salvar em PDF"
                }
                onClose={closeBudgetSearch}
                onSelect={budgetId => {
                    const action = budgetSearchAction;
                    closeBudgetSearch();
                    if (action === "edit") {
                        navigate(`/budgets/${encodeURIComponent(budgetId)}`);
                    } else if (action) {
                        navigate(`/budgets/${encodeURIComponent(budgetId)}?action=${action}`);
                    }
                }}
            />

            <ClientSelectModal
                isOpen={budgetCreationStep === "client"}
                title="Selecionar cliente para o orçamento"
                clients={clientsQuery.clients}
                isLoading={clientsQuery.isLoading}
                error={clientsQuery.error}
                onClose={() => {
                    setBudgetCreationStep(null);
                    setBudgetCreationClient(null);
                }}
                onSelect={client => {
                    setBudgetCreationClient({ id: client.id, name: client.name });
                    setBudgetCreationError(null);
                    setBudgetCreationStep("equipament");
                }}
                onCreate={() => {
                    clientsQuery.clearCreateError();
                    setBudgetCreationStep(null);
                    setIsCreateBudgetClientOpen(true);
                }}
            />

            <EquipamentSelectModal
                isOpen={budgetCreationStep === "equipament"}
                title={`Selecionar equipamento · ${budgetCreationClient?.name ?? "Cliente"}`}
                equipaments={equipamentsQuery.equipaments}
                isLoading={equipamentsQuery.isLoading || budgetMutations.create.isPending}
                error={budgetCreationError ?? equipamentsQuery.error}
                onClose={() => {
                    setBudgetCreationStep(null);
                    setBudgetCreationClient(null);
                }}
                onSelect={equipament => void createBudgetForEquipment(equipament.id)}
                onCreate={() => {
                    equipamentsQuery.clearCreateError();
                    setBudgetCreationStep(null);
                    setIsCreateBudgetEquipamentOpen(true);
                }}
                onChangeClient={() => {
                    setBudgetCreationError(null);
                    setBudgetCreationStep("client");
                }}
            />

            <ClientCreateModal
                isOpen={isCreateBudgetClientOpen}
                isSubmitting={clientsQuery.isCreating}
                error={clientsQuery.createError}
                onClose={() => {
                    setIsCreateBudgetClientOpen(false);
                    setBudgetCreationStep("client");
                }}
                onSubmit={createBudgetClient}
            />

            {budgetCreationClient && (
                <EquipamentCreateModal
                    clientId={budgetCreationClient.id}
                    isOpen={isCreateBudgetEquipamentOpen}
                    isSubmitting={equipamentsQuery.isCreating || budgetMutations.create.isPending}
                    error={equipamentsQuery.createError ?? budgetCreationError}
                    onClose={() => {
                        setIsCreateBudgetEquipamentOpen(false);
                        setBudgetCreationStep("equipament");
                    }}
                    onSubmit={createBudgetEquipament}
                />
            )}
        </main>
    );
}
