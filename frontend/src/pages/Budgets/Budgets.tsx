import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faCalendarDays,
    faChevronRight,
    faFilter,
    faMagnifyingGlass,
    faBroom,
    faChartColumn,
    faFileCircleCheck,
    faFileCircleXmark,
    faFileInvoiceDollar,
    faFilePen,
    faFileSignature,
    faFilePdf,
    faPlus,
    faArrowsRotate,
    faPenToSquare,
    faPaperPlane,
    faTrashCan,
    faRotateRight,
    faTags
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

    return [equipment.type, model, identification, equipment.additionalIdentification].filter(Boolean).join(" · ");
}

function formatBudgetName(budget: BudgetSearchSummary) {
    return `Orçamento ${budget.id.slice(0, 8)} - ${budget.client.name} - ${formatEquipment(budget.equipament) || "Equipamento não informado"}`;
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
        setFilterForm(current => {
            const next = { ...current };
            const normalizedValue = value.trim();

            if (!normalizedValue) {
                delete next[key];
            } else if (numeric) {
                const parsedValue = Number(normalizedValue);
                if (Number.isFinite(parsedValue)) {
                    Object.assign(next, { [key]: parsedValue });
                }
            } else {
                Object.assign(next, { [key]: normalizedValue });
            }

            return next;
        });
    }

    function submitAdvancedFilters(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setFilterError(null);

        const activeFilters = Object.entries(filterForm).filter(
            ([key, value]) => !["page", "limit"].includes(key) && value !== undefined && value !== ""
        );

        if (activeFilters.length === 0) {
            setFilterError("Informe ao menos um filtro para realizar a consulta.");
            return;
        }

        const rangePairs: Array<[keyof FindBudgetsByAdvancedFilters, keyof FindBudgetsByAdvancedFilters, string]> = [
            ["createdAtFrom", "createdAtTo", "O período de criação"],
            ["updatedAtFrom", "updatedAtTo", "O período de atualização"],
            ["historyCreatedAtFrom", "historyCreatedAtTo", "O período do histórico"],
            ["totalAmountMin", "totalAmountMax", "A faixa de valor total"],
            ["globalDiscountMin", "globalDiscountMax", "A faixa de desconto global"],
            ["finalAmountMin", "finalAmountMax", "A faixa de valor final"],
            ["itemQuantityMin", "itemQuantityMax", "A faixa de quantidade dos itens"],
            ["itemUnitValueMin", "itemUnitValueMax", "A faixa de valor unitário"],
            ["itemTotalAmountMin", "itemTotalAmountMax", "A faixa de valor dos itens"],
            ["itemDiscountMin", "itemDiscountMax", "A faixa de desconto dos itens"]
        ];

        for (const [minKey, maxKey, label] of rangePairs) {
            const min = filterForm[minKey];
            const max = filterForm[maxKey];
            if (typeof min === "number" && typeof max === "number" && min > max) {
                setFilterError(`${label}: o valor mínimo não pode ser maior que o máximo.`);
                return;
            }
            if (typeof min === "string" && typeof max === "string" && min > max) {
                setFilterError(`${label}: a data inicial não pode ser posterior à data final.`);
                return;
            }
        }

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
                        <button type="button" className="budgets-action-button budgets-action-button--create">
                            <FontAwesomeIcon icon={faPlus} aria-hidden="true" />
                            <span>Criar orçamento</span>
                        </button>
                        <button type="button" className="budgets-action-button budgets-action-button--convert">
                            <FontAwesomeIcon icon={faArrowsRotate} aria-hidden="true" />
                            <span>Criar orçamento a partir de serviço</span>
                        </button>
                        <button type="button" className="budgets-action-button budgets-action-button--edit">
                            <FontAwesomeIcon icon={faPenToSquare} aria-hidden="true" />
                            <span>Editar orçamento</span>
                        </button>
                        <button type="button" className="budgets-action-button budgets-action-button--delete">
                            <FontAwesomeIcon icon={faTrashCan} aria-hidden="true" />
                            <span>Excluir orçamento</span>
                        </button>
                        <button type="button" className="budgets-action-button budgets-action-button--pdf">
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
                        <span className="budgets-filter-panel__icon" aria-hidden="true">
                            <FontAwesomeIcon icon={faFilter} />
                        </span>
                    </header>

                    <form className="budgets-filter-form" onSubmit={submitAdvancedFilters}>
                        <div className="budgets-filter-form__quick">
                            <label className="budgets-filter-field budgets-filter-field--search">
                                <span>Busca geral</span>
                                <input
                                    type="search"
                                    value={filterForm.search ?? ""}
                                    onChange={event => updateFilter("search", event.target.value)}
                                    placeholder="Cliente, documento, equipamento, item ou observação"
                                />
                            </label>
                            <label className="budgets-filter-field">
                                <span>Código do orçamento</span>
                                <input
                                    value={filterForm.budgetId ?? ""}
                                    onChange={event => updateFilter("budgetId", event.target.value)}
                                    placeholder="Identificador"
                                />
                            </label>
                            <label className="budgets-filter-field">
                                <span>Status</span>
                                <select
                                    value={filterForm.status ?? ""}
                                    onChange={event => updateFilter("status", event.target.value)}
                                >
                                    <option value="">Todos</option>
                                    {Object.entries(statusLabels).map(([value, label]) => (
                                        <option key={value} value={value}>{label}</option>
                                    ))}
                                </select>
                            </label>
                        </div>

                        <div className="budgets-filter-groups">
                            <details className="budgets-filter-group" open>
                                <summary>Cliente e equipamento</summary>
                                <div className="budgets-filter-group__fields">
                                    <label className="budgets-filter-field">
                                        <span>Nome do cliente</span>
                                        <input value={filterForm.clientName ?? ""} onChange={event => updateFilter("clientName", event.target.value)} />
                                    </label>
                                    <label className="budgets-filter-field">
                                        <span>Documento do cliente</span>
                                        <input value={filterForm.clientDocument ?? ""} onChange={event => updateFilter("clientDocument", event.target.value)} />
                                    </label>
                                    <label className="budgets-filter-field">
                                        <span>Cliente (ID)</span>
                                        <input value={filterForm.clientId ?? ""} onChange={event => updateFilter("clientId", event.target.value)} />
                                    </label>
                                    <label className="budgets-filter-field">
                                        <span>Equipamento</span>
                                        <input value={filterForm.equipamentSearch ?? ""} onChange={event => updateFilter("equipamentSearch", event.target.value)} placeholder="Tipo, marca, modelo ou identificação" />
                                    </label>
                                    <label className="budgets-filter-field">
                                        <span>Equipamento (ID)</span>
                                        <input value={filterForm.equipamentId ?? ""} onChange={event => updateFilter("equipamentId", event.target.value)} />
                                    </label>
                                </div>
                            </details>

                            <details className="budgets-filter-group">
                                <summary>Condições do orçamento</summary>
                                <div className="budgets-filter-group__fields">
                                    <label className="budgets-filter-field">
                                        <span>Condição de pagamento</span>
                                        <input value={filterForm.paymentCondition ?? ""} onChange={event => updateFilter("paymentCondition", event.target.value)} placeholder="Ex.: à vista" />
                                    </label>
                                    <label className="budgets-filter-field">
                                        <span>Validade</span>
                                        <input value={filterForm.validity ?? ""} onChange={event => updateFilter("validity", event.target.value)} />
                                    </label>
                                    <label className="budgets-filter-field">
                                        <span>Garantia</span>
                                        <input value={filterForm.warranty ?? ""} onChange={event => updateFilter("warranty", event.target.value)} />
                                    </label>
                                    <label className="budgets-filter-field">
                                        <span>Prazo de entrega</span>
                                        <input value={filterForm.deliveryTime ?? ""} onChange={event => updateFilter("deliveryTime", event.target.value)} />
                                    </label>
                                    <label className="budgets-filter-field budgets-filter-field--wide">
                                        <span>Observações</span>
                                        <input value={filterForm.observations ?? ""} onChange={event => updateFilter("observations", event.target.value)} />
                                    </label>
                                </div>
                            </details>

                            <details className="budgets-filter-group">
                                <summary>Datas e valores</summary>
                                <div className="budgets-filter-group__fields">
                                    <label className="budgets-filter-field">
                                        <span>Criado a partir de</span>
                                        <input type="date" value={filterForm.createdAtFrom ?? ""} onChange={event => updateFilter("createdAtFrom", event.target.value)} />
                                    </label>
                                    <label className="budgets-filter-field">
                                        <span>Criado até</span>
                                        <input type="date" value={filterForm.createdAtTo ?? ""} onChange={event => updateFilter("createdAtTo", event.target.value)} />
                                    </label>
                                    <label className="budgets-filter-field">
                                        <span>Atualizado a partir de</span>
                                        <input type="date" value={filterForm.updatedAtFrom ?? ""} onChange={event => updateFilter("updatedAtFrom", event.target.value)} />
                                    </label>
                                    <label className="budgets-filter-field">
                                        <span>Atualizado até</span>
                                        <input type="date" value={filterForm.updatedAtTo ?? ""} onChange={event => updateFilter("updatedAtTo", event.target.value)} />
                                    </label>
                                    {([
                                        ["totalAmountMin", "Valor total mínimo"],
                                        ["totalAmountMax", "Valor total máximo"],
                                        ["globalDiscountMin", "Desconto global mínimo (%)"],
                                        ["globalDiscountMax", "Desconto global máximo (%)"],
                                        ["finalAmountMin", "Valor final mínimo"],
                                        ["finalAmountMax", "Valor final máximo"]
                                    ] as const).map(([key, label]) => (
                                        <label className="budgets-filter-field" key={key}>
                                            <span>{label}</span>
                                            <input
                                                type="number"
                                                min={key.includes("Quantity") ? "0.000001" : "0"}
                                                max={key.includes("Discount") ? 100 : undefined}
                                                step="0.01"
                                                value={filterForm[key] ?? ""}
                                                onChange={event => updateFilter(key, event.target.value, true)}
                                            />
                                        </label>
                                    ))}
                                </div>
                            </details>

                            <details className="budgets-filter-group">
                                <summary>Itens e categorias</summary>
                                <div className="budgets-filter-group__fields">
                                    <label className="budgets-filter-field">
                                        <span>Item (ID)</span>
                                        <input value={filterForm.itemId ?? ""} onChange={event => updateFilter("itemId", event.target.value)} />
                                    </label>
                                    <label className="budgets-filter-field">
                                        <span>Título do item</span>
                                        <input value={filterForm.itemTitle ?? ""} onChange={event => updateFilter("itemTitle", event.target.value)} />
                                    </label>
                                    <label className="budgets-filter-field">
                                        <span>Descrição do item</span>
                                        <input value={filterForm.itemDescription ?? ""} onChange={event => updateFilter("itemDescription", event.target.value)} />
                                    </label>
                                    <label className="budgets-filter-field">
                                        <span>Categoria</span>
                                        <input value={filterForm.itemCategoryName ?? ""} onChange={event => updateFilter("itemCategoryName", event.target.value)} />
                                    </label>
                                    <label className="budgets-filter-field">
                                        <span>Categoria (ID)</span>
                                        <input value={filterForm.itemCategoryId ?? ""} onChange={event => updateFilter("itemCategoryId", event.target.value)} />
                                    </label>
                                    {([
                                        ["itemQuantityMin", "Quantidade mínima"],
                                        ["itemQuantityMax", "Quantidade máxima"],
                                        ["itemUnitValueMin", "Valor unitário mínimo"],
                                        ["itemUnitValueMax", "Valor unitário máximo"],
                                        ["itemTotalAmountMin", "Total dos itens mínimo"],
                                        ["itemTotalAmountMax", "Total dos itens máximo"],
                                        ["itemDiscountMin", "Desconto mínimo (%)"],
                                        ["itemDiscountMax", "Desconto máximo (%)"]
                                    ] as const).map(([key, label]) => (
                                        <label className="budgets-filter-field" key={key}>
                                            <span>{label}</span>
                                            <input
                                                type="number"
                                                min={key.includes("Quantity") ? "0.000001" : "0"}
                                                max={key.includes("Discount") ? 100 : undefined}
                                                step="0.01"
                                                value={filterForm[key] ?? ""}
                                                onChange={event => updateFilter(key, event.target.value, true)}
                                            />
                                        </label>
                                    ))}
                                </div>
                            </details>

                            <details className="budgets-filter-group">
                                <summary>Histórico</summary>
                                <div className="budgets-filter-group__fields">
                                    <label className="budgets-filter-field">
                                        <span>Histórico (ID)</span>
                                        <input value={filterForm.historyId ?? ""} onChange={event => updateFilter("historyId", event.target.value)} />
                                    </label>
                                    <label className="budgets-filter-field">
                                        <span>Tipo de evento</span>
                                        <input value={filterForm.historyEventType ?? ""} onChange={event => updateFilter("historyEventType", event.target.value)} />
                                    </label>
                                    <label className="budgets-filter-field budgets-filter-field--wide">
                                        <span>Descrição do evento</span>
                                        <input value={filterForm.historyDescription ?? ""} onChange={event => updateFilter("historyDescription", event.target.value)} />
                                    </label>
                                    <label className="budgets-filter-field">
                                        <span>Evento a partir de</span>
                                        <input type="date" value={filterForm.historyCreatedAtFrom ?? ""} onChange={event => updateFilter("historyCreatedAtFrom", event.target.value)} />
                                    </label>
                                    <label className="budgets-filter-field">
                                        <span>Evento até</span>
                                        <input type="date" value={filterForm.historyCreatedAtTo ?? ""} onChange={event => updateFilter("historyCreatedAtTo", event.target.value)} />
                                    </label>
                                </div>
                            </details>
                        </div>

                        {filterError && <p className="budgets-filter-error" role="alert">{filterError}</p>}

                        <div className="budgets-filter-form__actions">
                            <button type="button" className="budgets-filter-reset" onClick={clearAdvancedFilters}>
                                <FontAwesomeIcon icon={faBroom} aria-hidden="true" />
                                Limpar filtros
                            </button>
                            <button type="submit" className="budgets-filter-submit">
                                <FontAwesomeIcon icon={faMagnifyingGlass} aria-hidden="true" />
                                Buscar orçamentos
                            </button>
                        </div>
                    </form>

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
            </section>
        </main>
    );
}
