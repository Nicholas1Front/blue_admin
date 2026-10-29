import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faCalendarDays,
    faClock,
    faClipboardList,
    faCoins,
    faScrewdriverWrench,
    faTriangleExclamation,
    faWallet
} from "@fortawesome/free-solid-svg-icons";

import { AppHeader } from "../../components/AppHeader/AppHeader";
import { BackLink } from "../../components/BackLink/BackLink";
import { useServiceDashboard } from "../../modules/services";
import type { ServiceStatus } from "../../modules/services";
import "./Services.css";

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

export function Services() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const [selectedMonth, setSelectedMonth] = useState(currentMonth);
    const [selectedYear, setSelectedYear] = useState(currentYear);

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
        page: 1,
        limit: 5
    });
    const dashboard = dashboardQuery.data;
    const statusCounts = dashboard?.statusCounts;
    const maxStatusCount = Math.max(
        1,
        ...serviceStatuses.map(status => statusCounts?.[status] ?? 0)
    );

    const periodTitle = new Intl.DateTimeFormat("pt-BR", {
        month: "long",
        year: "numeric"
    }).format(new Date(selectedYear, selectedMonth - 1, 1));

    function handleYearChange(year: number) {
        if (!Number.isInteger(year) || year < 2000 || year > currentYear) {
            return;
        }

        setSelectedYear(year);

        if (year === currentYear && selectedMonth > currentMonth) {
            setSelectedMonth(currentMonth);
        }
    }

    function metricValue(value: number | undefined) {
        if (dashboardQuery.isPending) return "Carregando…";
        if (dashboardQuery.isError) return "—";
        return String(value ?? 0);
    }

    function metricCurrency(value: number | undefined) {
        if (dashboardQuery.isPending) return "Carregando…";
        if (dashboardQuery.isError) return "—";
        return formatCurrency(value);
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
                                    onChange={event => setSelectedMonth(Number(event.target.value))}
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

                <section className="services-metrics" aria-label="Indicadores do período">
                    <article className="services-metric services-metric--blue">
                        <div className="services-metric__top">
                            <span className="services-metric__label">Serviços no período</span>
                            <span className="services-metric__icon" aria-hidden="true">
                                <FontAwesomeIcon icon={faClipboardList} />
                            </span>
                        </div>
                        <strong className="services-metric__value">
                            {metricValue(dashboard?.serviceCount)}
                        </strong>
                        <span className="services-metric__detail">
                            Serviços com entrada em {periodTitle}
                        </span>
                    </article>

                    <article className="services-metric services-metric--violet">
                        <div className="services-metric__top">
                            <span className="services-metric__label">Em execução</span>
                            <span className="services-metric__icon" aria-hidden="true">
                                <FontAwesomeIcon icon={faScrewdriverWrench} />
                            </span>
                        </div>
                        <strong className="services-metric__value">
                            {metricValue(statusCounts?.["em_execução"])}
                        </strong>
                        <span className="services-metric__detail">
                            Serviços em andamento na oficina
                        </span>
                    </article>

                    <article className="services-metric services-metric--amber">
                        <div className="services-metric__top">
                            <span className="services-metric__label">Aguardando pagamento</span>
                            <span className="services-metric__icon" aria-hidden="true">
                                <FontAwesomeIcon icon={faClock} />
                            </span>
                        </div>
                        <strong className="services-metric__value">
                            {metricValue(statusCounts?.aguardando_pagamento)}
                        </strong>
                        <span className="services-metric__detail">
                            Serviços com pagamento pendente
                        </span>
                    </article>

                    <article className="services-metric services-metric--green">
                        <div className="services-metric__top">
                            <span className="services-metric__label">Saldo dos serviços</span>
                            <span className="services-metric__icon" aria-hidden="true">
                                <FontAwesomeIcon icon={faWallet} />
                            </span>
                        </div>
                        <strong className="services-metric__value">
                            {metricCurrency(dashboard?.financial.balanceTotal)}
                        </strong>
                        <span className="services-metric__detail">
                            Entradas menos saídas vinculadas
                        </span>
                    </article>
                </section>

                <section className="services-main-grid">
                    <article className="services-panel">
                        <header className="services-panel__header">
                            <div>
                                <span className="services-panel__eyebrow">Visão operacional</span>
                                <h2>Distribuição por status</h2>
                                <p>Veja como os serviços do período estão distribuídos.</p>
                            </div>
                            <span className="services-panel__period">{periodTitle}</span>
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

                        {dashboard?.financial.includedOrigins.length > 0 && (
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
                            <p>Uma amostra de até cinco serviços do período selecionado.</p>
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
                        <div className="services-list">
                            {dashboard.services.map(service => (
                                <article className="services-list-row" key={service.id}>
                                    <div className="services-list-row__main">
                                        <strong>{service.client.name}</strong>
                                        <span>{formatEquipment(service.equipament)}</span>
                                        <span className="services-list-row__meta">
                                            Entrada em {formatReferenceDate(service.entryDate)}
                                            <i aria-hidden="true" />
                                            {service.activityCount} {service.activityCount === 1 ? "atividade" : "atividades"}
                                        </span>
                                    </div>
                                    <span className={`services-status-pill services-status-pill--${statusTones[service.status]}`}>
                                        {statusLabels[service.status]}
                                    </span>
                                </article>
                            ))}
                        </div>
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
            </section>
        </main>
    );
}
