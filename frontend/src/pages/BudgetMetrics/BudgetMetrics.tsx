import { useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle, faClock, faFileInvoiceDollar, faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppHeader } from "../../components/AppHeader/AppHeader";
import { BackLink } from "../../components/BackLink/BackLink";
import { useBudgetMetrics } from "../../modules/budgets";
import type { BudgetStatus } from "../../modules/budgets";
import "./BudgetMetrics.css";

const statuses: BudgetStatus[] = ["rascunho", "enviado", "aprovado", "rejeitado", "expirado", "cancelado"];
const statusConfig: Record<BudgetStatus, { label: string; color: string; tone: string }> = {
    rascunho: { label: "Rascunho", color: "#8b9aab", tone: "draft" },
    enviado: { label: "Aguardando cliente", color: "#e5a642", tone: "waiting" },
    aprovado: { label: "Aprovado", color: "#31b982", tone: "approved" },
    rejeitado: { label: "Rejeitado", color: "#e16b70", tone: "rejected" },
    expirado: { label: "Expirado", color: "#a78bfa", tone: "expired" },
    cancelado: { label: "Cancelado", color: "#64748b", tone: "cancelled" }
};
const monthNames = Array.from({ length: 12 }, (_, index) =>
    new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(new Date(2020, index, 1))
);
const availableYears = (year: number) => Array.from({ length: Math.max(1, year - 1999) }, (_, index) => year - index);
const emptyStatusCounts: Record<BudgetStatus, number> = {
    rascunho: 0, enviado: 0, aprovado: 0, rejeitado: 0, expirado: 0, cancelado: 0
};
const getStatusCounts = (counts?: Partial<Record<BudgetStatus, number>>) => ({
    ...emptyStatusCounts,
    ...(counts ?? {})
});
const percent = (value: number, total: number) => total > 0 ? value / total * 100 : 0;
const formatPercent = (value: number) => `${value.toFixed(1).replace(".", ",")}%`;

function MetricCard({ label, value, detail, tone, icon }: {
    label: string; value: string; detail: string;
    tone: "blue" | "amber" | "green" | "violet";
    icon: typeof faFileInvoiceDollar;
}) {
    return (
        <article className={`budget-metrics-kpi budget-metrics-kpi--${tone}`}>
            <span className="budget-metrics-kpi__icon"><FontAwesomeIcon icon={icon} aria-hidden="true" /></span>
            <span className="budget-metrics-kpi__label">{label}</span>
            <strong className="budget-metrics-kpi__value">{value}</strong>
            <span className="budget-metrics-kpi__detail">{detail}</span>
        </article>
    );
}

export function BudgetMetrics() {
    document.title = "Métricas de orçamentos | Blue Admin";
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [selectedMonth, setSelectedMonth] = useState(currentMonth);
    const [visibleStatuses, setVisibleStatuses] = useState<BudgetStatus[]>(statuses);
    const query = useBudgetMetrics({ year: selectedYear });
    const data = query.data;
    const annualStatusCounts = getStatusCounts(data?.annual?.statusCounts);
    const monthData = data?.monthly?.find(item => item.month === selectedMonth);
    const monthStatusCounts = getStatusCounts(monthData?.statusCounts);
    const monthCount = monthData?.budgetCount ?? 0;

    const chartData = useMemo(() => (data?.monthly ?? []).map(item => ({
        month: item.month,
        label: new Intl.DateTimeFormat("pt-BR", { month: "short" })
            .format(new Date(selectedYear, item.month - 1, 1)).replace(".", ""),
        ...getStatusCounts(item.statusCounts)
    })), [data, selectedYear]);

    const annualOpenRate = percent(data?.annual?.openCount ?? 0, data?.annual?.budgetCount ?? 0);
    const annualWaitingRate = percent(data?.annual?.awaitingResponseCount ?? 0, data?.annual?.budgetCount ?? 0);
    const annualApproval = percent(annualStatusCounts.aprovado, data?.annual?.budgetCount ?? 0);
    const monthlyApproval = percent(monthStatusCounts.aprovado, monthCount);
    const monthlyWaiting = percent(monthStatusCounts.enviado, monthCount);

    function toggleStatus(status: BudgetStatus) {
        setVisibleStatuses(current => current.includes(status)
            ? current.filter(item => item !== status)
            : [...current, status]);
    }

    function changeYear(year: number) {
        if (!Number.isInteger(year) || year < 2000 || year > currentYear) return;
        setSelectedYear(year);
        if (year === currentYear && selectedMonth > currentMonth) setSelectedMonth(currentMonth);
    }

    function selectChartMonth(state: { activeLabel?: string | number } | null) {
        if (!state?.activeLabel) return;
        const month = Number(state.activeLabel);
        if (Number.isInteger(month) && month >= 1 && month <= 12) setSelectedMonth(month);
    }

    return (
        <main className="budget-metrics-page">
            <AppHeader />
            <nav className="page-back-row" aria-label="Navegação da página">
                <BackLink to="/budgets" label="Voltar ao dashboard de orçamentos" />
            </nav>

            <section className="budget-metrics-content">
                <header className="budget-metrics-heading">
                    <div className="budget-metrics-heading__copy">
                        <span className="budget-metrics-eyebrow">Gestão comercial · Indicadores</span>
                        <h1>Métricas de orçamentos</h1>
                        <p>Acompanhe as propostas criadas, identifique o que continua em aberto e entenda a evolução dos status ao longo do ano.</p>
                    </div>
                    <div className="budget-metrics-period">
                        <span className="budget-metrics-period__label"><FontAwesomeIcon icon={faClock} aria-hidden="true" /> Período de análise</span>
                        <div className="budget-metrics-period__fields">
                            <label><span>Mês em destaque</span>
                                <select value={selectedMonth} onChange={event => setSelectedMonth(Number(event.target.value))} aria-label="Selecionar mês">
                                    {monthNames.map((month, index) => (
                                        <option key={month} value={index + 1} disabled={selectedYear === currentYear && index + 1 > currentMonth}>{month}</option>
                                    ))}
                                </select>
                            </label>
                            <label><span>Ano</span>
                                <select value={selectedYear} onChange={event => changeYear(Number(event.target.value))} aria-label="Selecionar ano">
                                    {availableYears(currentYear).map(year => <option key={year} value={year}>{year}</option>)}
                                </select>
                            </label>
                        </div>
                    </div>
                </header>

                {query.isError ? (
                    <div className="budget-metrics-state" role="alert">
                        <strong>Não foi possível carregar as métricas.</strong>
                        <span>Confira sua conexão e tente novamente.</span>
                        <button type="button" onClick={() => void query.refetch()}>Tentar novamente</button>
                    </div>
                ) : query.isPending || !data ? (
                    <div className="budget-metrics-state" aria-live="polite">Carregando indicadores…</div>
                ) : (
                    <>
                        <section className="budget-metrics-section" aria-labelledby="budget-metrics-year-title">
                            <div className="budget-metrics-section-heading">
                                <div>
                                    <span className="budget-metrics-section-eyebrow">Panorama anual</span>
                                    <h2 id="budget-metrics-year-title">Situação dos orçamentos em {selectedYear}</h2>
                                    <p>Propostas criadas neste ano, agrupadas pelo status atual de cada orçamento.</p>
                                </div>
                                <span className="budget-metrics-year-tag">{selectedYear}</span>
                            </div>
                            <div className="budget-metrics-kpis">
                                <MetricCard label="Orçamentos criados" value={String(data.annual.budgetCount)}
                                    detail="Total de propostas cadastradas no ano" tone="blue" icon={faFileInvoiceDollar} />
                                <MetricCard label="Em aberto" value={String(data.annual.openCount)}
                                    detail={`${formatPercent(annualOpenRate)} do total anual · rascunhos e enviados`} tone="amber" icon={faClock} />
                                <MetricCard label="Aguardando resposta" value={String(data.annual.awaitingResponseCount)}
                                    detail={`${formatPercent(annualWaitingRate)} do total anual · propostas enviadas`} tone="violet" icon={faPaperPlane} />
                                <MetricCard label="Taxa de aprovação" value={formatPercent(annualApproval)}
                                    detail={`${annualStatusCounts.aprovado} aprovados sobre ${data.annual.budgetCount} criados`}
                                    tone="green" icon={faCheckCircle} />
                            </div>
                        </section>

                        <section className="budget-metrics-panel" aria-labelledby="budget-metrics-chart-title">
                            <header className="budget-metrics-panel__header">
                                <div>
                                    <span className="budget-metrics-section-eyebrow">Distribuição mensal</span>
                                    <h2 id="budget-metrics-chart-title">Todos os status por mês</h2>
                                    <p>Selecione um mês no gráfico ou no filtro para consultar sua distribuição.</p>
                                </div>
                                <span className="budget-metrics-panel__total">{data.annual.budgetCount} no ano</span>
                            </header>
                            <div className="budget-metrics-legend" aria-label="Filtrar status exibidos no gráfico">
                                {statuses.map(status => (
                                    <button type="button" key={status}
                                        className={visibleStatuses.includes(status) ? "is-active" : ""}
                                        aria-pressed={visibleStatuses.includes(status)} onClick={() => toggleStatus(status)}>
                                        <i style={{ background: statusConfig[status].color }} />{statusConfig[status].label}
                                    </button>
                                ))}
                                <button type="button" className="budget-metrics-legend__reset" onClick={() => setVisibleStatuses(statuses)}>Todos</button>
                            </div>
                            <div className="budget-metrics-chart">
                                {data.annual.budgetCount > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData} margin={{ top: 12, right: 8, left: -18, bottom: 4 }}
                                            barCategoryGap="22%" onClick={selectChartMonth}>
                                            <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="month" tickLine={false} axisLine={false}
                                                tickFormatter={value => monthNames[Number(value) - 1]?.slice(0, 3) ?? String(value)}
                                                tick={{ fill: "var(--color-text-muted)", fontSize: 12 }} />
                                            <YAxis allowDecimals={false} tickLine={false} axisLine={false}
                                                tick={{ fill: "var(--color-text-muted)", fontSize: 11 }} />
                                            <Tooltip cursor={{ fill: "var(--color-surface-hover)", opacity: .45 }}
                                                contentStyle={{ background: "var(--color-surface-raised)", border: "1px solid var(--color-border)", borderRadius: 10, color: "var(--color-text)" }}
                                                labelFormatter={(_, payload) => payload?.[0]?.payload?.label ?? ""}
                                                formatter={(value, name) => [Number(value ?? 0), statusConfig[name as BudgetStatus]?.label ?? String(name)]} />
                                            <ReferenceLine x={selectedMonth} stroke="var(--color-primary-400)" strokeDasharray="4 4" />
                                            {statuses.filter(status => visibleStatuses.includes(status)).map(status => (
                                                <Bar key={status} dataKey={status} name={status} stackId="budgets"
                                                    fill={statusConfig[status].color} maxBarSize={42} />
                                            ))}
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="budget-metrics-chart-empty">Nenhum orçamento foi criado em {selectedYear}.</div>
                                )}
                            </div>
                            <p className="budget-metrics-chart-note">Cada coluna representa os orçamentos criados naquele mês, agrupados pelo status atual. Clique em uma coluna para destacá-la abaixo.</p>
                        </section>

                        <section className="budget-metrics-panel budget-metrics-month-panel" aria-labelledby="budget-metrics-month-title">
                            <header className="budget-metrics-panel__header">
                                <div>
                                    <span className="budget-metrics-section-eyebrow">Detalhamento do período</span>
                                    <h2 id="budget-metrics-month-title">{new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(new Date(selectedYear, selectedMonth - 1, 1))}</h2>
                                    <p>{monthCount} orçamento(s) criado(s) no mês selecionado.</p>
                                </div>
                                <span className="budget-metrics-month-total">{monthCount} propostas</span>
                            </header>
                            <div className="budget-metrics-month-kpis">
                                <article>
                                    <span>Taxa de aprovação</span><strong>{formatPercent(monthlyApproval)}</strong>
                                    <small>{monthStatusCounts.aprovado} de {monthCount} propostas</small>
                                    <div className="budget-metrics-progress"><i className="is-approved" style={{ width: `${monthlyApproval}%` }} /></div>
                                </article>
                                <article>
                                    <span>Aguardando resposta do cliente</span><strong>{formatPercent(monthlyWaiting)}</strong>
                                    <small>{monthStatusCounts.enviado} de {monthCount} propostas</small>
                                    <div className="budget-metrics-progress"><i className="is-waiting" style={{ width: `${monthlyWaiting}%` }} /></div>
                                </article>
                            </div>
                            <div className="budget-metrics-status-grid">
                                {statuses.map(status => {
                                    const count = monthStatusCounts[status];
                                    const share = percent(count, monthCount);
                                    return (
                                        <button type="button" key={status}
                                            className={`budget-metrics-status-card budget-metrics-status-card--${statusConfig[status].tone}`}
                                            onClick={() => toggleStatus(status)} aria-pressed={visibleStatuses.includes(status)}
                                            title="Mostrar ou ocultar este status no gráfico anual">
                                            <span>{statusConfig[status].label}</span><strong>{count}</strong>
                                            <small>{formatPercent(share)} do mês</small>
                                            <i><b style={{ width: `${share}%` }} /></i>
                                        </button>
                                    );
                                })}
                            </div>
                            <p className="budget-metrics-definition">
                                Os percentuais são calculados sobre todos os orçamentos criados no mês. “Em aberto” reúne rascunhos e enviados;
                                “aguardando resposta” considera somente os enviados. A aprovação é a participação dos aprovados no total de propostas do período.
                            </p>
                        </section>
                    </>
                )}
                <p className="budget-metrics-footnote">{data?.interpretation ?? "Os indicadores representam atividade comercial, não valores financeiros ou receita realizada."}</p>
            </section>
        </main>
    );
}
