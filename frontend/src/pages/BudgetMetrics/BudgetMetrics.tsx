import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faFileInvoiceDollar, faArrowTrendUp, faCheckCircle, faGaugeHigh } from "@fortawesome/free-solid-svg-icons";
import { AppHeader } from "../../components/AppHeader/AppHeader";
import { BackLink } from "../../components/BackLink/BackLink";
import { useBudgetMetrics } from "../../modules/budgets";
import type { BudgetStatus } from "../../modules/budgets";
import "./BudgetMetrics.css";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const months = Array.from({ length: 12 }, (_, i) => new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(new Date(2020, i, 1)).replace(".", ""));
const statuses: BudgetStatus[] = ["rascunho", "enviado", "aprovado", "rejeitado", "expirado", "cancelado"];
const labels: Record<BudgetStatus, string> = { rascunho: "Rascunho", enviado: "Enviado", aprovado: "Aprovado", rejeitado: "Rejeitado", expirado: "Expirado", cancelado: "Cancelado" };

export function BudgetMetrics() {
    const navigate = useNavigate();
    const currentYear = new Date().getFullYear();
    const [year, setYear] = useState(currentYear);
    const query = useBudgetMetrics({ year });
    const data = query.data;
    const approved = data?.statusTotals.aprovado;
    const rejected = data?.statusTotals.rejeitado;
    const decided = (approved?.count ?? 0) + (rejected?.count ?? 0);
    const approvalRate = decided ? (approved?.count ?? 0) / decided * 100 : 0;
    const pipelineCount = (data?.statusTotals.rascunho.count ?? 0) + (data?.statusTotals.enviado.count ?? 0);
    const pipelineValue = (data?.statusTotals.rascunho.finalAmount ?? 0) + (data?.statusTotals.enviado.finalAmount ?? 0);
    const averageApproved = approved?.count ? approved.finalAmount / approved.count : 0;
    const maxValue = Math.max(1, ...(data?.monthly.map(item => item.finalAmount) ?? [1]));
    const maxCount = Math.max(1, ...(data?.monthly.map(item => item.budgetCount) ?? [1]));
    const maxStatus = Math.max(1, ...statuses.map(status => data?.statusTotals[status].count ?? 0));

    return <main className="budget-metrics-page">
        <title>Métricas de orçamentos | Blue Admin</title><AppHeader />
        <nav className="page-back-row" aria-label="Navegação da página"><BackLink /></nav>
        <section className="budget-metrics-content">
            <header className="budget-metrics-heading"><div><span>INTELIGÊNCIA COMERCIAL</span><h1>Métricas de orçamentos</h1><p>Volume de propostas, valores apresentados e desempenho de aprovação.</p></div><label>Ano de referência<select value={year} onChange={e => setYear(Number(e.target.value))}>{Array.from({ length: currentYear - 1999 }, (_, i) => currentYear - i).map(item => <option key={item}>{item}</option>)}</select></label></header>
            {query.isError ? <div className="budget-metrics-state" role="alert">Não foi possível carregar as métricas. <button onClick={() => void query.refetch()}>Tentar novamente</button></div>
            : query.isPending || !data ? <div className="budget-metrics-state">Carregando indicadores…</div>
            : <>
                <div className="budget-metrics-kpis">
                    <article><span><FontAwesomeIcon icon={faFileInvoiceDollar} /></span><small>Orçamentos criados</small><strong>{data.annual.budgetCount}</strong><p>Propostas registradas em {year}</p></article>
                    <article><span><FontAwesomeIcon icon={faArrowTrendUp} /></span><small>Valor total proposto</small><strong>{money.format(data.annual.finalAmount)}</strong><p>Valor final acumulado das propostas</p></article>
                    <article><span><FontAwesomeIcon icon={faCheckCircle} /></span><small>Taxa de aprovação</small><strong>{approvalRate.toFixed(1).replace(".", ",")}%</strong><p>Sobre propostas aprovadas ou rejeitadas</p></article>
                    <article><span><FontAwesomeIcon icon={faGaugeHigh} /></span><small>Ticket médio aprovado</small><strong>{money.format(averageApproved)}</strong><p>{approved?.count ?? 0} orçamento(s) aprovado(s)</p></article>
                </div>
                <section className="budget-metrics-panel"><header><div><h2>Evolução mensal</h2><p>Valor final dos orçamentos criados em cada mês</p></div><span>{year}</span></header><div className="budget-metrics-chart" role="img" aria-label={`Evolução mensal dos valores orçados em ${year}`}>{data.monthly.map(item => <div key={item.month}><small>{item.finalAmount ? money.format(item.finalAmount) : "—"}</small><div><i style={{ height: `${item.finalAmount ? Math.max(3, item.finalAmount / maxValue * 100) : 0}%` }} /></div><span>{months[item.month - 1]}</span></div>)}</div><p className="budget-metrics-note">Período definido pela data de criação. Valores orçados não representam receita recebida.</p></section>
                <div className="budget-metrics-columns">
                    <section className="budget-metrics-panel"><header><div><h2>Volume por mês</h2><p>Quantidade de propostas cadastradas</p></div></header><div className="budget-metrics-bars">{data.monthly.map(item => <div key={item.month}><span>{months[item.month - 1]}</span><div><i style={{ width: `${item.budgetCount / maxCount * 100}%` }} /></div><strong>{item.budgetCount}</strong></div>)}</div></section>
                    <section className="budget-metrics-panel"><header><div><h2>Distribuição por status</h2><p>Resultado das propostas no ano</p></div></header><div className="budget-metrics-bars">{statuses.map(status => <div key={status}><span>{labels[status]}</span><div><i className={`status-${status}`} style={{ width: `${data.statusTotals[status].count / maxStatus * 100}%` }} /></div><strong>{data.statusTotals[status].count}</strong></div>)}</div></section>
                </div>
                <section className="budget-metrics-panel"><header><div><h2>Indicadores complementares</h2><p>Leitura rápida do pipeline comercial</p></div></header><div className="budget-metrics-insights"><article><small>Pipeline em aberto</small><strong>{money.format(pipelineValue)}</strong><span>{pipelineCount} orçamento(s) em rascunho ou enviado</span></article><article><small>Valor aprovado</small><strong>{money.format(approved?.finalAmount ?? 0)}</strong><span>{approved?.count ?? 0} proposta(s) aprovadas</span></article><article><small>Propostas decididas</small><strong>{decided}</strong><span>Taxa de aprovação calculada sobre aprovadas e rejeitadas</span></article></div></section>
            </>}
            <p className="budget-metrics-note">{data?.interpretation ?? "Métricas comerciais: não representam faturamento ou recebimentos."}</p>
            <button type="button" className="budget-metrics-back" onClick={() => navigate("/budgets")}><FontAwesomeIcon icon={faArrowLeft} /> Voltar aos orçamentos</button>
        </section>
    </main>;
}
