import { useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faArrowRightFromBracket,
    faArrowRightToBracket,
    faCalendarDays,
    faChartLine,
    faChevronLeft,
    faChevronRight,
    faClock,
    faCoins,
    faGaugeHigh,
    faListCheck,
    faUsers
} from "@fortawesome/free-solid-svg-icons";
import {
    Bar,
    CartesianGrid,
    ComposedChart,
    Line,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from "recharts";

import { AppHeader } from "../../components/AppHeader/AppHeader";
import { BackLink } from "../../components/BackLink/BackLink";
import {
    useServiceCalendar,
    useServiceMetrics
} from "../../modules/services";
import type {
    ServiceCalendarEvent,
    ServiceStatus,
    ServiceSummary
} from "../../modules/services";
import "./ServiceMetricsCalendar.css";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
});

const numberFormatter = new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 1
});

const monthNames = Array.from({ length: 12 }, (_, index) =>
    new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(new Date(2000, index, 1))
);

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

const statusLabels: Record<string, string> = {
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

const statusTones: Record<string, string> = {
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

const activityLabels: Record<string, string> = {
    pendente: "Pendentes",
    "em_execução": "Em execução",
    concluida: "Concluídas",
    cancelada: "Canceladas"
};

const eventLabels: Record<ServiceCalendarEvent["eventType"], string> = {
    entry: "Entrada",
    exit: "Saída",
    ongoing: "Em andamento"
};

function formatCurrency(value: number | null | undefined) {
    return currencyFormatter.format(Number(value ?? 0));
}

function formatDate(value: string) {
    return new Date(value.slice(0, 10) + "T12:00:00").toLocaleDateString("pt-BR");
}

function toDateKey(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return String(year) + "-" + month + "-" + day;
}

function toMonthKey(date: Date) {
    return toDateKey(date).slice(0, 7);
}

function getMonthRange(monthKey: string) {
    const [year, month] = monthKey.split("-").map(Number);
    const lastDay = new Date(year, month, 0).getDate();

    return {
        startDate: monthKey + "-01",
        endDate: monthKey + "-" + String(lastDay).padStart(2, "0")
    };
}

function shiftMonth(monthKey: string, amount: number) {
    const [year, month] = monthKey.split("-").map(Number);
    return toMonthKey(new Date(year, month - 1 + amount, 1));
}

function formatEquipment(service: ServiceSummary) {
    const equipment = service.equipament;
    const model = [equipment.brand, equipment.model].filter(Boolean).join(" ");
    const identification = equipment.mainIdentification ?? equipment.additionalIdentification;

    return [equipment.type, model, identification].filter(Boolean).join(" · ");
}

function MetricCard({
    label,
    value,
    detail,
    tone,
    icon
}: {
    label: string;
    value: string;
    detail: string;
    tone: "blue" | "green" | "red" | "violet";
    icon: typeof faChartLine;
}) {
    return (
        <article className={"service-insight-metric service-insight-metric--" + tone}>
            <span className="service-insight-metric__icon" aria-hidden="true">
                <FontAwesomeIcon icon={icon} />
            </span>
            <span className="service-insight-metric__label">{label}</span>
            <strong className="service-insight-metric__value">{value}</strong>
            <span className="service-insight-metric__detail">{detail}</span>
        </article>
    );
}

function QueryState({
    loading,
    error,
    empty,
    onRetry,
    children
}: {
    loading: boolean;
    error: boolean;
    empty?: boolean;
    onRetry: () => void;
    children: ReactNode;
}) {
    if (loading) {
        return <div className="service-insight-state">Carregando informações…</div>;
    }

    if (error) {
        return (
            <div className="service-insight-state" role="alert">
                <span>Não foi possível carregar esta consulta.</span>
                <button type="button" onClick={onRetry}>Tentar novamente</button>
            </div>
        );
    }

    if (empty) {
        return <div className="service-insight-state">Ainda não há dados para o período selecionado.</div>;
    }

    return <>{children}</>;
}

function MetricsView({
    year,
    month
}: {
    year: number;
    month: number | undefined;
}) {
    const metricsQuery = useServiceMetrics({
        year,
        ...(month === undefined ? {} : { month })
    });
    const metrics = metricsQuery.data;
    const summary = metrics?.summary;

    const chartData = useMemo(() => (metrics?.monthlyEvolution ?? []).map(item => ({
        month: monthNames[item.month - 1].slice(0, 3),
        services: item.serviceCount,
        income: item.incomeTotal,
        expenses: item.directExpenseTotal,
        result: item.operationalResult,
        operationalCost: item.operationalCost
    })), [metrics?.monthlyEvolution]);

    const maxStatusCount = Math.max(
        1,
        ...serviceStatuses.map(status => summary?.statusCounts[status] ?? 0)
    );

    const periodLabel = month === undefined
        ? "Ano completo"
        : monthNames[month - 1] + " de " + year;

    return (
        <div className="service-insight-view">
            <section className="service-insight-section">
                <div className="service-insight-section__heading">
                    <div>
                        <span className="service-insight-eyebrow">Resumo do período</span>
                        <h2>Indicadores dos serviços</h2>
                        <p>Os valores consideram os serviços pela data de entrada e seus lançamentos vinculados.</p>
                    </div>
                    <span className="service-insight-period">{periodLabel}</span>
                </div>

                <QueryState
                    loading={metricsQuery.isPending}
                    error={metricsQuery.isError}
                    onRetry={() => void metricsQuery.refetch()}
                    empty={summary?.serviceCount === 0}
                >
                    <div className="service-insight-metrics">
                        <MetricCard
                            label="Serviços"
                            value={String(summary?.serviceCount ?? 0)}
                            detail="Atendimentos no período"
                            tone="blue"
                            icon={faGaugeHigh}
                        />
                        <MetricCard
                            label="Entradas vinculadas"
                            value={formatCurrency(summary?.incomeTotal)}
                            detail="Recebimentos dos serviços"
                            tone="green"
                            icon={faArrowRightToBracket as typeof faChartLine}
                        />
                        <MetricCard
                            label="Despesas diretas"
                            value={formatCurrency(summary?.directExpenseTotal)}
                            detail="Lançamentos vinculados"
                            tone="red"
                            icon={faArrowRightFromBracket as typeof faChartLine}
                        />
                        <MetricCard
                            label="Resultado operacional"
                            value={formatCurrency(summary?.operationalResult)}
                            detail="Após despesas e custo operacional"
                            tone="violet"
                            icon={faCoins}
                        />
                        <MetricCard
                            label="Horas trabalhadas"
                            value={numberFormatter.format(summary?.hoursWorkedTotal ?? 0) + " h"}
                            detail="Soma das horas informadas"
                            tone="blue"
                            icon={faClock as typeof faChartLine}
                        />
                        <MetricCard
                            label="Custo operacional"
                            value={formatCurrency(summary?.operationalCostTotal)}
                            detail="Horas × custo por hora"
                            tone="red"
                            icon={faCoins}
                        />
                        <MetricCard
                            label="Duração média"
                            value={summary?.averageDurationDays == null
                                ? "—"
                                : numberFormatter.format(summary.averageDurationDays) + " dias"}
                            detail="Serviços com data de saída"
                            tone="blue"
                            icon={faCalendarDays as typeof faChartLine}
                        />
                        <MetricCard
                            label="Atividades concluídas"
                            value={String(summary?.activityStatusCounts.concluida ?? 0)}
                            detail="Atividades registradas"
                            tone="green"
                            icon={faListCheck as typeof faChartLine}
                        />
                    </div>
                </QueryState>
            </section>

            <section className="service-insight-section service-insight-section--grid">
                <article className="service-insight-panel service-insight-panel--wide">
                    <header className="service-insight-panel__header">
                        <div>
                            <span className="service-insight-eyebrow">Evolução anual</span>
                            <h3>Movimentação dos serviços por mês</h3>
                            <p>Entradas, despesas diretas e resultado operacional agrupados pela data de entrada do serviço.</p>
                        </div>
                        <span className="service-insight-panel__tag">{year}</span>
                    </header>

                    <QueryState
                        loading={metricsQuery.isPending}
                        error={metricsQuery.isError}
                        onRetry={() => void metricsQuery.refetch()}
                        empty={chartData.every(item => item.services === 0)}
                    >
                        <div className="service-insight-chart">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={chartData} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                                    <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 5" vertical={false} />
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "var(--color-text-muted)", fontSize: 12 }} />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        width={76}
                                        tick={{ fill: "var(--color-text-muted)", fontSize: 11 }}
                                        tickFormatter={(value: number) => value === 0 ? "R$ 0" : "R$ " + Math.round(value / 1000) + " mil"}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            background: "var(--color-surface-raised)",
                                            border: "1px solid var(--color-border)",
                                            borderRadius: 10,
                                            color: "var(--color-text)"
                                        }}
                                        formatter={(value) => formatCurrency(Number(value ?? 0))}
                                    />
                                    <Bar dataKey="income" name="Entradas" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={18} />
                                    <Bar dataKey="expenses" name="Despesas diretas" fill="#ef6464" radius={[4, 4, 0, 0]} maxBarSize={18} />
                                    <Line dataKey="result" name="Resultado operacional" type="monotone" stroke="#4d9bff" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="service-insight-chart-legend">
                            <span><i className="service-insight-legend-dot service-insight-legend-dot--income" /> Entradas</span>
                            <span><i className="service-insight-legend-dot service-insight-legend-dot--expense" /> Despesas diretas</span>
                            <span><i className="service-insight-legend-line" /> Resultado operacional</span>
                        </div>
                    </QueryState>
                </article>

                <article className="service-insight-panel">
                    <header className="service-insight-panel__header">
                        <div>
                            <span className="service-insight-eyebrow">Situação operacional</span>
                            <h3>Serviços por status</h3>
                            <p>Distribuição dos atendimentos no período.</p>
                        </div>
                    </header>
                    <QueryState
                        loading={metricsQuery.isPending}
                        error={metricsQuery.isError}
                        onRetry={() => void metricsQuery.refetch()}
                        empty={summary?.serviceCount === 0}
                    >
                        <div className="service-insight-status-list">
                            {serviceStatuses.map(status => {
                                const count = summary?.statusCounts[status] ?? 0;
                                const percentage = (count / maxStatusCount) * 100;

                                return (
                                    <div className="service-insight-status-row" key={status}>
                                        <div className="service-insight-status-row__top">
                                            <span>
                                                <i className={"service-insight-status-dot service-insight-status-dot--" + (statusTones[status] ?? "neutral")} />
                                                {statusLabels[status] ?? status}
                                            </span>
                                            <strong>{count}</strong>
                                        </div>
                                        <div className="service-insight-progress">
                                            <span
                                                className={"service-insight-progress__fill service-insight-progress__fill--" + (statusTones[status] ?? "neutral")}
                                                style={{ width: percentage + "%" }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </QueryState>
                </article>
            </section>

            <section className="service-insight-section service-insight-section--grid">
                <article className="service-insight-panel">
                    <header className="service-insight-panel__header">
                        <div>
                            <span className="service-insight-eyebrow">Dízimo</span>
                            <h3>Acompanhamento dos valores</h3>
                            <p>Estimativa calculada sobre o resultado operacional positivo.</p>
                        </div>
                    </header>
                    <QueryState
                        loading={metricsQuery.isPending}
                        error={metricsQuery.isError}
                        onRetry={() => void metricsQuery.refetch()}
                        empty={summary?.serviceCount === 0}
                    >
                        <div className="service-insight-tithe">
                            <div><span>Previsto</span><strong>{formatCurrency(summary?.tithe.expectedTotal)}</strong></div>
                            <div><span>Vinculado como pago</span><strong className="service-insight-positive">{formatCurrency(summary?.tithe.paidTotal)}</strong></div>
                            <div><span>Pendente</span><strong>{formatCurrency(summary?.tithe.pendingTotal)}</strong></div>
                        </div>
                        <div className="service-insight-tithe-status">
                            {Object.entries(summary?.tithe.statusCounts ?? {}).map(([status, count]) => (
                                <span key={status}>{status}: <strong>{count}</strong></span>
                            ))}
                        </div>
                    </QueryState>
                </article>

                <article className="service-insight-panel">
                    <header className="service-insight-panel__header">
                        <div>
                            <span className="service-insight-eyebrow">Produtividade</span>
                            <h3>Clientes com mais serviços</h3>
                            <p>Os cinco clientes com maior número de atendimentos.</p>
                        </div>
                        <span className="service-insight-panel__icon"><FontAwesomeIcon icon={faUsers} /></span>
                    </header>
                    <QueryState
                        loading={metricsQuery.isPending}
                        error={metricsQuery.isError}
                        onRetry={() => void metricsQuery.refetch()}
                        empty={(metrics?.topClients.length ?? 0) === 0}
                    >
                        <div className="service-insight-clients">
                            {metrics?.topClients.map((client, index) => (
                                <div className="service-insight-client-row" key={client.clientId}>
                                    <span className="service-insight-client-row__rank">{index + 1}</span>
                                    <strong>{client.name}</strong>
                                    <span>{client.serviceCount} {client.serviceCount === 1 ? "serviço" : "serviços"}</span>
                                </div>
                            ))}
                        </div>
                    </QueryState>
                </article>
            </section>

            <p className="service-insight-footnote">
                Os indicadores financeiros são atribuídos ao serviço pelo vínculo de origem, não pela data de referência do lançamento.
                A evolução mensal considera o mês de entrada do serviço. Serviços sem horas ou custo por hora informado têm custo operacional igual a zero.
            </p>
        </div>
    );
}

function CalendarView({ monthKey, onMonthChange }: {
    monthKey: string;
    onMonthChange: (month: string) => void;
}) {
    const range = getMonthRange(monthKey);
    const calendarQuery = useServiceCalendar(range);
    const calendar = calendarQuery.data;
    const [selectedDate, setSelectedDate] = useState(range.startDate);

    const firstDate = useMemo(() => {
        const [year, month] = monthKey.split("-").map(Number);
        const first = new Date(year, month - 1, 1);
        first.setDate(first.getDate() - first.getDay());
        return first;
    }, [monthKey]);

    const days = useMemo(() => Array.from({ length: 42 }, (_, index) => {
        const date = new Date(firstDate);
        date.setDate(firstDate.getDate() + index);
        return date;
    }), [firstDate]);

    const eventsByDate = useMemo(() => {
        const grouped = new Map<string, ServiceCalendarEvent[]>();
        (calendar?.events ?? []).forEach(event => {
            const current = grouped.get(event.date) ?? [];
            current.push(event);
            grouped.set(event.date, current);
        });
        return grouped;
    }, [calendar?.events]);

    const servicesById = useMemo(() => new Map(
        (calendar?.services ?? []).map(service => [service.id, service])
    ), [calendar?.services]);

    const selectedEvents = eventsByDate.get(selectedDate) ?? [];
    const selectedServices = selectedEvents
        .map(event => ({ event, service: servicesById.get(event.serviceId) }))
        .filter((item): item is { event: ServiceCalendarEvent; service: ServiceSummary } => Boolean(item.service));

    function changeMonth(amount: number) {
        const nextMonth = shiftMonth(monthKey, amount);
        onMonthChange(nextMonth);
        setSelectedDate(nextMonth + "-01");
    }

    function handleMonthInput(value: string) {
        if (!value) return;
        onMonthChange(value);
        setSelectedDate(value + "-01");
    }

    const monthLabel = new Intl.DateTimeFormat("pt-BR", {
        month: "long",
        year: "numeric"
    }).format(new Date(Number(monthKey.slice(0, 4)), Number(monthKey.slice(5, 7)) - 1, 1));

    return (
        <div className="service-insight-view">
            <section className="service-insight-calendar-panel">
                <header className="service-insight-calendar-heading">
                    <div>
                        <span className="service-insight-eyebrow">Planejamento da oficina</span>
                        <h2>{monthLabel}</h2>
                        <p>Visualize as entradas, saídas e serviços que já estavam em andamento no início do período.</p>
                    </div>
                    <div className="service-insight-calendar-controls">
                        <button type="button" aria-label="Mês anterior" onClick={() => changeMonth(-1)}>
                            <FontAwesomeIcon icon={faChevronLeft} />
                        </button>
                        <label>
                            <span className="service-insight-sr-only">Selecionar mês</span>
                            <input type="month" value={monthKey} onChange={event => handleMonthInput(event.target.value)} />
                        </label>
                        <button type="button" aria-label="Próximo mês" onClick={() => changeMonth(1)}>
                            <FontAwesomeIcon icon={faChevronRight} />
                        </button>
                    </div>
                </header>

                <div className="service-insight-calendar-legend">
                    <span><i className="service-insight-event-dot service-insight-event-dot--entry" /> Entrada</span>
                    <span><i className="service-insight-event-dot service-insight-event-dot--exit" /> Saída</span>
                    <span><i className="service-insight-event-dot service-insight-event-dot--ongoing" /> Em andamento</span>
                </div>

                <QueryState
                    loading={calendarQuery.isPending}
                    error={calendarQuery.isError}
                    onRetry={() => void calendarQuery.refetch()}
                >
                    <div className="service-insight-calendar">
                        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(day => (
                            <div className="service-insight-calendar__weekday" key={day}>{day}</div>
                        ))}
                        {days.map(date => {
                            const dateKey = toDateKey(date);
                            const isCurrentMonth = dateKey.slice(0, 7) === monthKey;
                            const events = eventsByDate.get(dateKey) ?? [];
                            const isSelected = selectedDate === dateKey;

                            return (
                                <button
                                    type="button"
                                    key={dateKey}
                                    className={[
                                        "service-insight-calendar__day",
                                        isCurrentMonth ? "" : "is-outside",
                                        isSelected ? "is-selected" : ""
                                    ].filter(Boolean).join(" ")}
                                    disabled={!isCurrentMonth}
                                    aria-pressed={isSelected}
                                    onClick={() => setSelectedDate(dateKey)}
                                >
                                    <span className="service-insight-calendar__date">{date.getDate()}</span>
                                    <span className="service-insight-calendar__events">
                                        {events.slice(0, 3).map((event, index) => (
                                            <i
                                                key={event.serviceId + event.eventType + index}
                                                className={"service-insight-event-dot service-insight-event-dot--" + event.eventType}
                                                title={eventLabels[event.eventType]}
                                            />
                                        ))}
                                        {events.length > 3 && <small>+{events.length - 3}</small>}
                                    </span>
                                    {events.length > 0 && <span className="service-insight-calendar__count">{events.length}</span>}
                                </button>
                            );
                        })}
                    </div>
                    <div className="service-insight-calendar-footer">
                        <span>{calendar?.total ?? 0} serviços que cruzam o período</span>
                        <span>{calendar?.events.length ?? 0} eventos no mês</span>
                    </div>
                </QueryState>
            </section>

            <section className="service-insight-panel service-insight-day-panel">
                <header className="service-insight-panel__header">
                    <div>
                        <span className="service-insight-eyebrow">Agenda do dia</span>
                        <h3>{formatDate(selectedDate)}</h3>
                        <p>Selecione um dia no calendário para consultar os serviços relacionados.</p>
                    </div>
                    <span className="service-insight-panel__tag">{selectedEvents.length} eventos</span>
                </header>

                {calendarQuery.isPending ? (
                    <div className="service-insight-state">Carregando eventos…</div>
                ) : calendarQuery.isError ? (
                    <div className="service-insight-state">Os eventos não estão disponíveis.</div>
                ) : selectedServices.length === 0 ? (
                    <div className="service-insight-state">Nenhum evento registrado para este dia.</div>
                ) : (
                    <div className="service-insight-day-list">
                        {selectedServices.map(({ event, service }) => (
                            <Link
                                className="service-insight-day-row"
                                key={event.serviceId + event.eventType}
                                to={"/services/" + encodeURIComponent(service.id)}
                            >
                                <span className={"service-insight-day-row__icon service-insight-day-row__icon--" + event.eventType}>
                                    <FontAwesomeIcon icon={
                                        event.eventType === "entry"
                                            ? faArrowRightToBracket
                                            : event.eventType === "exit"
                                                ? faArrowRightFromBracket
                                                : faClock
                                    } />
                                </span>
                                <span className="service-insight-day-row__content">
                                    <strong>{service.client.name}</strong>
                                    <span>{formatEquipment(service) || "Equipamento não identificado"}</span>
                                    <small>{eventLabels[event.eventType]} · {statusLabels[service.status] ?? service.status}</small>
                                </span>
                                <span className="service-insight-day-row__arrow">Ver serviço →</span>
                            </Link>
                        ))}
                    </div>
                )}
            </section>

            <p className="service-insight-footnote">
                Um serviço com data de entrada futura aparece naturalmente no dia previsto. “Em andamento” representa serviços que já haviam começado antes do primeiro dia do mês e ainda não tinham saída registrada.
            </p>
        </div>
    );
}

export function ServiceMetricsCalendar() {
    document.title = "Métricas e calendário | Blue Admin";

    const now = new Date();
    const currentYear = now.getFullYear();
    const [activeView, setActiveView] = useState<"metrics" | "calendar">("metrics");
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [selectedMonth, setSelectedMonth] = useState<number | undefined>(undefined);
    const [calendarMonth, setCalendarMonth] = useState(toMonthKey(now));

    const availableYears = Array.from({ length: 31 }, (_, index) => currentYear + 5 - index);

    return (
        <main className="service-insight-page">
            <AppHeader />
            <nav className="page-back-row" aria-label="Navegação da página">
                <BackLink />
            </nav>

            <div className="service-insight-content">
                <header className="service-insight-heading">
                    <div>
                        <span className="service-insight-eyebrow">Gestão da oficina</span>
                        <h1>Métricas e calendário</h1>
                        <p>Entenda os resultados dos serviços e acompanhe a programação da oficina em um só lugar.</p>
                    </div>
                    {activeView === "metrics" && (
                        <div className="service-insight-filters">
                            <label>
                                <span>Ano</span>
                                <select value={selectedYear} onChange={event => setSelectedYear(Number(event.target.value))}>
                                    {availableYears.map(year => <option value={year} key={year}>{year}</option>)}
                                </select>
                            </label>
                            <label>
                                <span>Período</span>
                                <select
                                    value={selectedMonth ?? ""}
                                    onChange={event => setSelectedMonth(event.target.value ? Number(event.target.value) : undefined)}
                                >
                                    <option value="">Ano inteiro</option>
                                    {monthNames.map((name, index) => (
                                        <option value={index + 1} key={name}>{name}</option>
                                    ))}
                                </select>
                            </label>
                        </div>
                    )}
                </header>

                <nav className="service-insight-tabs" aria-label="Visões dos serviços">
                    <button
                        type="button"
                        className={activeView === "metrics" ? "is-active" : ""}
                        aria-pressed={activeView === "metrics"}
                        onClick={() => setActiveView("metrics")}
                    >
                        <FontAwesomeIcon icon={faChartLine} aria-hidden="true" />
                        Métricas
                    </button>
                    <button
                        type="button"
                        className={activeView === "calendar" ? "is-active" : ""}
                        aria-pressed={activeView === "calendar"}
                        onClick={() => setActiveView("calendar")}
                    >
                        <FontAwesomeIcon icon={faCalendarDays} aria-hidden="true" />
                        Calendário
                    </button>
                </nav>

                {activeView === "metrics" ? (
                    <MetricsView year={selectedYear} month={selectedMonth} />
                ) : (
                    <CalendarView monthKey={calendarMonth} onMonthChange={setCalendarMonth} />
                )}
            </div>
        </main>
    );
}
