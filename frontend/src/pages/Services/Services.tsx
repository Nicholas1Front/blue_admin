import { useState, type FormEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faCalendarDays,
    faClipboardList,
    faCoins,
    faMagnifyingGlass,
    faRotateLeft,
    faTriangleExclamation
} from "@fortawesome/free-solid-svg-icons";

import { AppHeader } from "../../components/AppHeader/AppHeader";
import { BackLink } from "../../components/BackLink/BackLink";
import {
    useServiceDashboard,
    useServicesByFilters
} from "../../modules/services";
import type {
    FindServicesByAdvancedFilters,
    ServiceActivityStatus,
    ServiceStatus,
    ServiceSummary,
    ServiceTitheStatus
} from "../../modules/services";
import "./Services.css";

const PAGE_SIZE = 10;

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
});

const serviceStatuses: ServiceStatus[] = [
    "pendente",
    "aguardando_resposta_cliente",
    "aguardando_peças",
    "em_execução",
    "aguardando_pagamento",
    "pagamento_atrasado",
    "pagamento_recebido",
    "finalizado",
    "equipamento_saiu",
    "cancelado"
];

const statusLabels: Record<ServiceStatus, string> = {
    pendente: "Pendente",
    aguardando_resposta_cliente: "Aguardando cliente",
    cancelado: "Cancelado",
    "aguardando_peças": "Aguardando peças",
    "em_execução": "Em execução",
    finalizado: "Finalizado",
    equipamento_saiu: "Equipamento saiu",
    aguardando_pagamento: "Aguardando pagamento",
    pagamento_atrasado: "Pagamento atrasado",
    pagamento_recebido: "Pagamento recebido"
};

const statusTones: Record<ServiceStatus, string> = {
    pendente: "neutral",
    aguardando_resposta_cliente: "info",
    cancelado: "danger",
    "aguardando_peças": "warning",
    "em_execução": "info",
    finalizado: "success",
    equipamento_saiu: "success",
    aguardando_pagamento: "warning",
    pagamento_atrasado: "danger",
    pagamento_recebido: "success"
};

const activityStatusLabels: Record<ServiceActivityStatus, string> = {
    pendente: "Pendente",
    "em_execução": "Em execução",
    concluida: "Concluída",
    cancelada: "Cancelada"
};

const titheStatusLabels: Record<ServiceTitheStatus, string> = {
    aguardando: "Aguardando",
    "não concluído": "Não concluído",
    "concluído": "Concluído"
};

type ServiceSearchForm = Omit<FindServicesByAdvancedFilters, "page" | "limit">;

function formatCurrency(value: number | null | undefined) {
    return currencyFormatter.format(Number(value ?? 0));
}

function formatReferenceDate(value: string) {
    return new Date(`${value.slice(0, 10)}T12:00:00`).toLocaleDateString("pt-BR");
}

function formatEquipment(
    equipment: {
        type: string;
        brand: string;
        model: string | null;
        mainIdentification: string | null;
        additionalIdentification: string | null;
    }
) {
    const name = [equipment.brand, equipment.model].filter(Boolean).join(" ");
    const identification = equipment.mainIdentification
        ?? equipment.additionalIdentification;

    return [equipment.type, name, identification].filter(Boolean).join(" · ");
}

interface PaginationProps {
    page: number;
    totalPages: number;
    total: number;
    onPageChange: (page: number) => void;
}

function ServicesPagination({
    page,
    totalPages,
    total,
    onPageChange
}: PaginationProps) {
    if (total === 0) {
        return null;
    }

    return (
        <nav className="services-pagination" aria-label="Paginação dos serviços">
            <span className="services-pagination__summary">
                Página <strong>{page}</strong> de <strong>{Math.max(totalPages, 1)}</strong>
                <span> · {total} {total === 1 ? "serviço" : "serviços"}</span>
            </span>
            <div className="services-pagination__actions">
                <button
                    type="button"
                    className="services-pagination__button"
                    disabled={page <= 1}
                    onClick={() => onPageChange(page - 1)}
                >
                    Anterior
                </button>
                <button
                    type="button"
                    className="services-pagination__button services-pagination__button--next"
                    disabled={totalPages === 0 || page >= totalPages}
                    onClick={() => onPageChange(page + 1)}
                >
                    Próxima
                </button>
            </div>
        </nav>
    );
}

export function Services() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const [selectedMonth, setSelectedMonth] = useState(currentMonth);
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [monthlyPage, setMonthlyPage] = useState(1);
    const [searchDraft, setSearchDraft] = useState<ServiceSearchForm>({});
    const [appliedSearchFilters, setAppliedSearchFilters] =
        useState<FindServicesByAdvancedFilters | null>(null);

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

    const dashboardQuery = useServiceDashboard({
        year: selectedYear,
        month: selectedMonth,
        page: monthlyPage,
        limit: PAGE_SIZE
    });
    const dashboard = dashboardQuery.data;
    const statusCounts = dashboard?.statusCounts;
    const maxStatusCount = Math.max(
        1,
        ...serviceStatuses.map(status => statusCounts?.[status] ?? 0)
    );

    const searchQuery = useServicesByFilters(
        appliedSearchFilters ?? { page: 1, limit: PAGE_SIZE },
        appliedSearchFilters !== null
    );
    const searchResults = searchQuery.data;

    const periodTitle = new Intl.DateTimeFormat("pt-BR", {
        month: "long",
        year: "numeric"
    }).format(new Date(selectedYear, selectedMonth - 1, 1));

    function handleMonthChange(month: number) {
        setSelectedMonth(month);
        setMonthlyPage(1);
    }

    function handleYearChange(year: number) {
        if (!Number.isInteger(year) || year < 2000 || year > currentYear) {
            return;
        }

        setSelectedYear(year);
        setMonthlyPage(1);

        if (year === currentYear && selectedMonth > currentMonth) {
            setSelectedMonth(currentMonth);
        }
    }

    function updateSearchField(
        key: keyof ServiceSearchForm,
        value: string | number | boolean | undefined
    ) {
        setSearchDraft(current => ({
            ...current,
            [key]: value === "" ? undefined : value
        }) as ServiceSearchForm);
    }

    function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const normalizedFilters = Object.fromEntries(
            Object.entries(searchDraft).filter(([, value]) =>
                value !== undefined && value !== null && value !== ""
            )
        ) as ServiceSearchForm;

        setAppliedSearchFilters({
            ...normalizedFilters,
            page: 1,
            limit: PAGE_SIZE
        });
    }

    function clearSearch() {
        setSearchDraft({});
        setAppliedSearchFilters(null);
    }

    function changeSearchPage(page: number) {
        if (!appliedSearchFilters || page < 1) {
            return;
        }

        setAppliedSearchFilters(current => current
            ? { ...current, page }
            : current
        );
    }

    function renderTextField(
        label: string,
        key: keyof ServiceSearchForm,
        placeholder?: string
    ) {
        return (
            <label className="services-filter-field" key={key}>
                <span>{label}</span>
                <input
                    type="text"
                    value={String(searchDraft[key] ?? "")}
                    placeholder={placeholder ?? label}
                    onChange={event => updateSearchField(key, event.target.value)}
                />
            </label>
        );
    }

    function renderDateField(label: string, key: keyof ServiceSearchForm) {
        return (
            <label className="services-filter-field" key={key}>
                <span>{label}</span>
                <input
                    type="date"
                    value={String(searchDraft[key] ?? "")}
                    onChange={event => updateSearchField(key, event.target.value)}
                />
            </label>
        );
    }

    function renderNumberField(label: string, key: keyof ServiceSearchForm) {
        return (
            <label className="services-filter-field" key={key}>
                <span>{label}</span>
                <input
                    type="number"
                    min="0"
                    step="any"
                    value={String(searchDraft[key] ?? "")}
                    onChange={event => updateSearchField(
                        key,
                        event.target.value === "" ? undefined : Number(event.target.value)
                    )}
                />
            </label>
        );
    }

    function renderSelectField(
        label: string,
        key: keyof ServiceSearchForm,
        options: Array<{ value: string; label: string }>
    ) {
        return (
            <label className="services-filter-field" key={key}>
                <span>{label}</span>
                <select
                    value={String(searchDraft[key] ?? "")}
                    onChange={event => updateSearchField(
                        key,
                        event.target.value === ""
                            ? undefined
                            : key === "exitDateIsNull"
                                ? event.target.value === "true"
                                : event.target.value
                    )}
                >
                    <option value="">Todos</option>
                    {options.map(option => (
                        <option value={option.value} key={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </label>
        );
    }

    function renderServiceCards(services: ServiceSummary[]) {
        return (
            <div className="services-list">
                {services.map(service => (
                    <article className="services-list-row" key={service.id}>
                        <div className="services-list-row__main">
                            <div className="services-list-row__identity">
                                <div className="services-list-row__client">
                                    <strong>{service.client.name}</strong>
                                    {service.client.document && (
                                        <span>Documento: {service.client.document}</span>
                                    )}
                                </div>
                                <span className={`services-status-pill services-status-pill--${statusTones[service.status]}`}>
                                    {statusLabels[service.status]}
                                </span>
                            </div>

                            <div className="services-list-row__equipment">
                                <span className="services-list-row__field-label">Equipamento</span>
                                <strong>{formatEquipment(service.equipament) || "Equipamento não identificado"}</strong>
                            </div>

                            <div className="services-list-row__details">
                                <span>
                                    <span className="services-list-row__field-label">Entrada</span>
                                    <strong>{formatReferenceDate(service.entryDate)}</strong>
                                </span>
                                <span>
                                    <span className="services-list-row__field-label">Saída</span>
                                    <strong>{service.exitDate ? formatReferenceDate(service.exitDate) : "Em andamento"}</strong>
                                </span>
                                <span>
                                    <span className="services-list-row__field-label">Atividades</span>
                                    <strong>{service.activityCount} {service.activityCount === 1 ? "atividade" : "atividades"}</strong>
                                </span>
                                <span>
                                    <span className="services-list-row__field-label">Horas trabalhadas</span>
                                    <strong>{service.hoursWorked == null ? "Não informado" : `${service.hoursWorked} h`}</strong>
                                </span>
                            </div>

                            <span className="services-list-row__id">Serviço #{service.id.slice(0, 8)}</span>
                        </div>
                    </article>
                ))}
            </div>
        );
    }

    return (
        <main className="services-page">
            <title>Serviços | Blue Admin</title>
            <AppHeader />
            <nav className="page-back-row" aria-label="Navegação da página">
                <BackLink />
            </nav>

            <section className="services-content">
                <header className="services-heading">
                    <div className="services-heading__copy">
                        <span className="services-eyebrow">Gestão da oficina</span>
                        <h1>Serviços em perspectiva.</h1>
                        <p>
                            Acompanhe o andamento dos atendimentos e os resultados
                            financeiros vinculados aos serviços da oficina.
                        </p>
                    </div>

                    <div className="services-period-control">
                        <span className="services-period-control__label">
                            <FontAwesomeIcon icon={faCalendarDays} aria-hidden="true" />
                            Período de análise
                        </span>
                        <div className="services-period-control__picker">
                            <label className="services-period-field">
                                <span>Mês</span>
                                <select
                                    aria-label="Selecionar mês dos serviços"
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
                            <label className="services-period-field">
                                <span>Ano</span>
                                <select
                                    aria-label="Selecionar ano dos serviços"
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

                {dashboardQuery.isError && (
                    <div className="services-alert" role="alert">
                        <span>
                            Não foi possível carregar o resumo dos serviços.
                            Confira sua conexão e tente novamente.
                        </span>
                        <button type="button" onClick={() => dashboardQuery.refetch()}>
                            Tentar novamente
                        </button>
                    </div>
                )}

                <section className="services-main-grid">
                    <article className="services-panel">
                        <header className="services-panel__header">
                            <div>
                                <span className="services-panel__eyebrow">Visão operacional</span>
                                <h2>Distribuição por status</h2>
                                <p>Veja como os serviços do período estão distribuídos.</p>
                            </div>
                            <span className="services-panel__period">
                                {dashboard ? `${dashboard.serviceCount} serviços no período` : periodTitle}
                            </span>
                        </header>

                        {dashboardQuery.isPending ? (
                            <div className="services-state">Carregando status dos serviços…</div>
                        ) : dashboardQuery.isError ? (
                            <div className="services-state">Os status não estão disponíveis no momento.</div>
                        ) : dashboard?.serviceCount === 0 ? (
                            <div className="services-state">
                                <span className="services-state__icon" aria-hidden="true">
                                    <FontAwesomeIcon icon={faClipboardList} />
                                </span>
                                <strong>Nenhum serviço neste período</strong>
                                <p>Quando houver serviços com entrada neste mês, eles aparecerão aqui.</p>
                            </div>
                        ) : (
                            <div className="services-status-list">
                                {serviceStatuses.map(status => {
                                    const count = statusCounts?.[status] ?? 0;
                                    const percentage = (count / maxStatusCount) * 100;

                                    return (
                                        <div className="services-status-row" key={status}>
                                            <div className="services-status-row__top">
                                                <span className="services-status-row__label">
                                                    <i className={`services-status-dot services-status-dot--${statusTones[status]}`} />
                                                    {statusLabels[status]}
                                                </span>
                                                <strong>{count}</strong>
                                            </div>
                                            <div className="services-status-bar" aria-hidden="true">
                                                <span
                                                    className={`services-status-bar__fill services-status-bar__fill--${statusTones[status]}`}
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </article>

                    <article className="services-panel services-financial-panel">
                        <header className="services-panel__header">
                            <div>
                                <span className="services-panel__eyebrow">Visão financeira</span>
                                <h2>Movimentação vinculada</h2>
                                <p>Valores dos lançamentos associados aos serviços e dízimos.</p>
                            </div>
                            <span className="services-panel__icon" aria-hidden="true">
                                <FontAwesomeIcon icon={faCoins} />
                            </span>
                        </header>

                        {dashboardQuery.isPending ? (
                            <div className="services-state services-state--compact">
                                Carregando movimentação financeira…
                            </div>
                        ) : dashboardQuery.isError ? (
                            <div className="services-state services-state--compact">
                                Os valores não estão disponíveis no momento.
                            </div>
                        ) : (
                            <div className="services-financial-summary">
                                <div className="services-financial-summary__row">
                                    <span>Entradas</span>
                                    <strong className="services-financial-value services-financial-value--income">
                                        {formatCurrency(dashboard?.financial.incomeTotal)}
                                    </strong>
                                </div>
                                <div className="services-financial-summary__row">
                                    <span>Saídas</span>
                                    <strong className="services-financial-value services-financial-value--expense">
                                        {formatCurrency(dashboard?.financial.expenseTotal)}
                                    </strong>
                                </div>
                                <div className="services-financial-summary__row services-financial-summary__row--total">
                                    <span>Saldo do período</span>
                                    <strong>{formatCurrency(dashboard?.financial.balanceTotal)}</strong>
                                </div>
                                <p className="services-financial-summary__note">
                                    Os serviços são agrupados pela data de entrada; os lançamentos,
                                    pela data de referência financeira.
                                </p>
                            </div>
                        )}

                        {dashboard && dashboard.financial.includedOrigins.length > 0 && (
                            <div className="services-financial-origins">
                                Considera lançamentos vinculados de {dashboard.financial.includedOrigins.map(origin => origin === "services" ? "serviços" : "dízimos").join(" e ")}.
                            </div>
                        )}
                    </article>
                </section>

                <section className="services-panel services-recent-panel">
                    <header className="services-panel__header">
                        <div>
                            <span className="services-panel__eyebrow">Acompanhamento</span>
                            <h2>Serviços do período</h2>
                            <p>Todos os serviços com entrada no mês selecionado, organizados por página.</p>
                        </div>
                        <span className="services-panel__period">
                            {dashboard ? `${dashboard.serviceCount} no total` : periodTitle}
                        </span>
                    </header>

                    {dashboardQuery.isPending ? (
                        <div className="services-state">Carregando serviços…</div>
                    ) : dashboardQuery.isError ? (
                        <div className="services-state">Não foi possível carregar os serviços.</div>
                    ) : dashboard?.services.length ? (
                        <>
                            {renderServiceCards(dashboard.services)}
                            <ServicesPagination
                                page={dashboard.pagination.page}
                                totalPages={dashboard.pagination.totalPages}
                                total={dashboard.pagination.total}
                                onPageChange={setMonthlyPage}
                            />
                        </>
                    ) : (
                        <div className="services-state">
                            <span className="services-state__icon" aria-hidden="true">
                                <FontAwesomeIcon icon={faTriangleExclamation} />
                            </span>
                            <strong>Nenhum serviço encontrado</strong>
                            <p>Não há serviços com data de entrada no período selecionado.</p>
                        </div>
                    )}
                </section>

                <section className="services-panel services-search-panel">
                    <header className="services-panel__header">
                        <div>
                            <span className="services-panel__eyebrow">Consulta avançada</span>
                            <h2>Pesquisar serviços</h2>
                            <p>Comece pelos campos principais ou abra os filtros adicionais para refinar a consulta.</p>
                        </div>
                        <span className="services-search-panel__icon" aria-hidden="true">
                            <FontAwesomeIcon icon={faMagnifyingGlass} />
                        </span>
                    </header>

                    <form className="services-search-form" onSubmit={handleSearchSubmit}>
                        <div className="services-search-primary">
                            <label className="services-filter-field services-filter-field--search">
                                <span>Busca geral</span>
                                <input
                                    type="search"
                                    value={searchDraft.search ?? ""}
                                    placeholder="Cliente, documento, equipamento, atividade ou código…"
                                    onChange={event => updateSearchField("search", event.target.value)}
                                />
                            </label>
                            {renderSelectField(
                                "Status do serviço",
                                "serviceStatus",
                                serviceStatuses.map(status => ({ value: status, label: statusLabels[status] }))
                            )}
                            {renderDateField("Entrada a partir de", "entryDateFrom")}
                            {renderDateField("Entrada até", "entryDateTo")}
                        </div>

                        <details className="services-search-advanced">
                            <summary>
                                <span>Mais filtros</span>
                                <span className="services-search-advanced__hint">Cliente, equipamento, atividades, financeiro e histórico</span>
                            </summary>

                            <div className="services-filter-group">
                                <h3>Cliente e equipamento</h3>
                                <div className="services-filter-grid">
                                    {renderTextField("Nome do cliente", "clientName")}
                                    {renderTextField("Documento do cliente", "clientDocument")}
                                    {renderTextField("ID do cliente", "clientId")}
                                    {renderTextField("ID do equipamento", "equipamentId")}
                                    {renderTextField("Buscar equipamento", "equipamentSearch", "Tipo, marca, modelo ou identificação")}
                                    {renderTextField("ID do serviço", "serviceId")}
                                </div>
                            </div>

                            <div className="services-filter-group">
                                <h3>Datas, horas e dízimo</h3>
                                <div className="services-filter-grid">
                                    {renderDateField("Saída a partir de", "exitDateFrom")}
                                    {renderDateField("Saída até", "exitDateTo")}
                                    {renderSelectField("Situação da saída", "exitDateIsNull", [
                                        { value: "true", label: "Ainda sem saída" },
                                        { value: "false", label: "Já saiu" }
                                    ])}
                                    {renderNumberField("Horas mínimas", "hoursWorkedMin")}
                                    {renderNumberField("Horas máximas", "hoursWorkedMax")}
                                    {renderSelectField("Status do dízimo", "titheStatus", Object.entries(titheStatusLabels).map(([value, label]) => ({ value, label })))}
                                    {renderTextField("ID da transação do dízimo", "titheTransactionId")}
                                </div>
                            </div>

                            <div className="services-filter-group">
                                <h3>Atividades</h3>
                                <div className="services-filter-grid">
                                    {renderTextField("ID da atividade", "activityId")}
                                    {renderTextField("Título da atividade", "activityTitle")}
                                    {renderTextField("Descrição da atividade", "activityDescription")}
                                    {renderSelectField("Status da atividade", "activityStatus", Object.entries(activityStatusLabels).map(([value, label]) => ({ value, label })))}
                                    {renderDateField("Atividade iniciada a partir de", "activityStartFrom")}
                                    {renderDateField("Atividade iniciada até", "activityStartTo")}
                                    {renderDateField("Atividade encerrada a partir de", "activityEndFrom")}
                                    {renderDateField("Atividade encerrada até", "activityEndTo")}
                                </div>
                            </div>

                            <div className="services-filter-group">
                                <h3>Lançamentos financeiros</h3>
                                <div className="services-filter-grid">
                                    {renderSelectField("Tipo de lançamento", "transactionType", [
                                        { value: "income", label: "Entrada" },
                                        { value: "expense", label: "Saída" }
                                    ])}
                                    {renderTextField("ID da categoria", "transactionCategoryId")}
                                    {renderTextField("Nome da categoria", "transactionCategoryName")}
                                    {renderTextField("Descrição do lançamento", "transactionDescription")}
                                    {renderNumberField("Valor mínimo", "transactionValueMin")}
                                    {renderNumberField("Valor máximo", "transactionValueMax")}
                                    {renderDateField("Lançamento a partir de", "transactionReferenceDateFrom")}
                                    {renderDateField("Lançamento até", "transactionReferenceDateTo")}
                                </div>
                            </div>

                            <div className="services-filter-group">
                                <h3>Histórico do serviço</h3>
                                <div className="services-filter-grid">
                                    {renderTextField("ID do evento", "historyId")}
                                    {renderTextField("Tipo do evento", "historyEventType")}
                                    {renderTextField("Descrição do evento", "historyDescription")}
                                    {renderDateField("Evento a partir de", "historyDateFrom")}
                                    {renderDateField("Evento até", "historyDateTo")}
                                </div>
                            </div>
                        </details>

                        <div className="services-search-actions">
                            <button className="services-search-submit" type="submit">
                                <FontAwesomeIcon icon={faMagnifyingGlass} aria-hidden="true" />
                                Pesquisar
                            </button>
                            <button className="services-search-reset" type="button" onClick={clearSearch}>
                                <FontAwesomeIcon icon={faRotateLeft} aria-hidden="true" />
                                Limpar filtros
                            </button>
                        </div>
                    </form>

                    {searchQuery.isError && (
                        <div className="services-alert services-search-alert" role="alert">
                            <span>Não foi possível concluir a pesquisa. Confira os filtros e tente novamente.</span>
                            <button type="button" onClick={() => searchQuery.refetch()}>
                                Tentar novamente
                            </button>
                        </div>
                    )}

                    {appliedSearchFilters !== null && (
                        <div className="services-search-results">
                            <div className="services-search-results__heading">
                                <div>
                                    <h3>Resultados da pesquisa</h3>
                                    <p>
                                        {searchResults
                                            ? `${searchResults.pagination.total} ${searchResults.pagination.total === 1 ? "serviço encontrado" : "serviços encontrados"}`
                                            : "Preparando resultados…"}
                                    </p>
                                </div>
                                {searchQuery.isFetching && <span className="services-search-loading">Atualizando…</span>}
                            </div>

                            {searchQuery.isPending ? (
                                <div className="services-state">Pesquisando serviços…</div>
                            ) : searchResults?.services.length ? (
                                <>
                                    {renderServiceCards(searchResults.services)}
                                    <ServicesPagination
                                        page={searchResults.pagination.page}
                                        totalPages={searchResults.pagination.totalPages}
                                        total={searchResults.pagination.total}
                                        onPageChange={changeSearchPage}
                                    />
                                </>
                            ) : !searchQuery.isError ? (
                                <div className="services-state">
                                    <span className="services-state__icon" aria-hidden="true">
                                        <FontAwesomeIcon icon={faClipboardList} />
                                    </span>
                                    <strong>Nenhum serviço corresponde aos filtros</strong>
                                    <p>Tente remover algum critério ou use a busca geral para ampliar a consulta.</p>
                                </div>
                            ) : null}
                        </div>
                    )}
                </section>
            </section>
        </main>
    );
}
