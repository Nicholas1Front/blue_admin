import { useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faCalendarDays,
    faChevronRight,
    faFileCircleCheck,
    faFileCircleXmark,
    faFileInvoiceDollar,
    faFilePen,
    faFileSignature,
    faMagnifyingGlass,
    faPaperPlane,
    faRotateRight
} from "@fortawesome/free-solid-svg-icons";

import { AppHeader } from "../../components/AppHeader/AppHeader";
import { BackLink } from "../../components/BackLink/BackLink";
import {
    useBudgetDashboard,
    useBudgetsByAdvancedFilters
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
    const model = [equipment.brand, equipment.model].filter(Boolean).join(" ");
    const identification = equipment.mainIdentification;

    return [equipment.type, model, identification].filter(Boolean).join(" · ");
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
            aria-label={`Consultar orçamento de ${budget.client.name}`}
        >
            <div className="budgets-list-item__main">
                <div className="budgets-list-item__identity">
                    <div>
                        <strong>{budget.client.name}</strong>
                        <span className="budgets-list-item__id">
                            Orçamento #{budget.id.slice(0, 8)}
                        </span>
                    </div>
                    <span className={`budgets-status budgets-status--${statusTones[budget.status]}`}>
                        {statusLabels[budget.status]}
                    </span>
                </div>

                <div className="budgets-list-item__equipment">
                    <span>Equipamento</span>
                    <strong>{formatEquipment(budget.equipament) || "Não informado"}</strong>
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
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const [selectedMonth, setSelectedMonth] = useState(currentMonth);
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [page, setPage] = useState(1);
    const [selectedStatus, setSelectedStatus] = useState<BudgetStatus | null>(null);

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

    const dashboard = dashboardQuery.data;
    const budgetList = budgetsQuery.data;
    const periodTitle = new Intl.DateTimeFormat("pt-BR", {
        month: "long",
        year: "numeric"
    }).format(new Date(selectedYear, selectedMonth - 1, 1));

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
                    <div>
                        <span className="budgets-quick-actions__eyebrow">Acesso rápido</span>
                        <strong>O que você deseja consultar?</strong>
                    </div>
                    <a href="#budgets-list" className="budgets-quick-actions__link">
                        <FontAwesomeIcon icon={faMagnifyingGlass} aria-hidden="true" />
                        Consultar orçamentos
                    </a>
                </section>

                <section className="budgets-overview" aria-labelledby="budgets-overview-title">
                    <div className="budgets-section-heading">
                        <div>
                            <span className="budgets-section-eyebrow">Resumo do período</span>
                            <h2 id="budgets-overview-title">Visão geral</h2>
                        </div>
                        <span className="budgets-period-tag">{periodTitle}</span>
                    </div>

                    <div className="budgets-status-grid">
                        <button
                            type="button"
                            className={`budgets-status-card budgets-status-card--total${selectedStatus === null ? " is-active" : ""}`}
                            onClick={() => selectStatus(null)}
                            aria-pressed={selectedStatus === null}
                        >
                            <span className="budgets-status-card__top">
                                <span>Todos os orçamentos</span>
                                <span className="budgets-status-card__icon">
                                    <FontAwesomeIcon icon={faFileInvoiceDollar} aria-hidden="true" />
                                </span>
                            </span>
                            <strong>
                                {dashboardQuery.isPending ? "—" : dashboard?.budgetCount ?? 0}
                            </strong>
                            <small>Registrados no período</small>
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
                                    <span className="budgets-status-card__icon">
                                        <FontAwesomeIcon icon={icon} aria-hidden="true" />
                                    </span>
                                </span>
                                <strong>
                                    {dashboardQuery.isPending
                                        ? "—"
                                        : dashboard?.statusCounts[status] ?? 0}
                                </strong>
                                <small>
                                    {dashboardQuery.isPending
                                        ? "Carregando"
                                        : (dashboard?.statusCounts[status] ?? 0) === 1
                                            ? "orçamento"
                                            : "orçamentos"}
                                </small>
                            </button>
                        ))}
                    </div>
                    {dashboard?.financialNote && (
                        <p className="budgets-financial-note">{dashboard.financialNote}</p>
                    )}
                </section>

                <section className="budgets-list-panel" id="budgets-list" aria-labelledby="budgets-list-title">
                    <header className="budgets-list-panel__header">
                        <div>
                            <span className="budgets-section-eyebrow">Consulta</span>
                            <h2 id="budgets-list-title">
                                {selectedStatus
                                    ? `Orçamentos: ${statusLabels[selectedStatus].toLowerCase()}`
                                    : "Orçamentos do período"}
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
            </section>
        </main>
    );
}
