import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faBriefcase,
    faCalendarDays,
    faClockRotateLeft,
    faFileInvoiceDollar,
    faUser,
    faWallet
} from "@fortawesome/free-solid-svg-icons";

import { AppHeader } from "../../components/AppHeader/AppHeader";
import { BackLink } from "../../components/BackLink/BackLink";
import {
    useEmployeeById,
    useEngagementsByEmployee,
    useEngagementFinancialSummary,
    useObligationsByEngagement,
    useMovementsByEngagement,
    useEmployeeHistory
} from "../../modules/employees";
import type {
    EmployeeEngagement,
    EmployeeHistoryEvent,
    EmployeeMovement,
    EmployeeObligation,
    EngagementStatus,
    ObligationStatus,
    ObligationType,
    EmployeeMovementType
} from "../../modules/employees";
import "./EmployeeDetails.css";

const modalityLabels = { CLT: "CLT", PJ: "PJ", Informal: "Informal", outros: "Outros" } as const;
const engagementStatusLabels: Record<EngagementStatus, string> = {
    trabalhando: "Trabalhando",
    afastado: "Afastado",
    "demitiu-se": "Pediu desligamento",
    demitido: "Desligado"
};
const obligationTypeLabels: Record<ObligationType, string> = {
    salario: "Salário",
    ferias: "Férias",
    decimo_terceiro: "13º salário",
    bonificacao: "Bonificação",
    rescisao: "Rescisão",
    ajuste: "Ajuste",
    outros: "Outros"
};
const obligationStatusLabels: Record<ObligationStatus, string> = {
    em_revisao: "Em revisão",
    pendente: "Pendente",
    parcial: "Parcial",
    pago: "Pago",
    cancelado: "Cancelado"
};
const movementTypesRequiringObligation = new Set<EmployeeMovementType>([
    "bonificacao", "decimo_terceiro", "ferias", "rescisao", "ajuste", "pagamento"
]);
const movementTypeLabels: Record<EmployeeMovementType, string> = {
    falta: "Falta",
    atraso: "Atraso",
    saida_antecipada: "Saída antecipada",
    bonificacao: "Bonificação",
    decimo_terceiro: "13º salário",
    ferias: "Férias",
    rescisao: "Rescisão",
    ajuste: "Ajuste",
    anotacao: "Anotação",
    pagamento: "Pagamento"
};

function currency(value: number | string | null | undefined) {
    const amount = Number(value ?? 0);
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number.isFinite(amount) ? amount : 0);
}

function dateOnly(value?: string | null) {
    if (!value) return "Não informado";
    const [year, month, day] = value.slice(0, 10).split("-");
    return year && month && day ? `${day}/${month}/${year}` : "Não informado";
}

function dateTime(value?: string | null) {
    if (!value) return "Data não informada";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? dateOnly(value) : date.toLocaleString("pt-BR");
}

function monthKey(value?: string | null) {
    if (!value) return null;
    const match = value.slice(0, 10).match(/^(\d{4})-(\d{2})/);
    return match ? `${match[1]}-${match[2]}` : null;
}

function monthLabel(key: string) {
    const [year, month] = key.split("-").map(Number);
    return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(new Date(year, month - 1, 1));
}

function formatCompetency(obligation?: Pick<EmployeeObligation, "referenceStart" | "referenceEnd"> | null) {
    if (!obligation) return "Sem competência vinculada";
    const format = (value?: string | null) => {
        const key = monthKey(value);
        if (!key) return null;
        const [year, month] = key.split("-").map(Number);
        return new Intl.DateTimeFormat("pt-BR", { month: "short", year: "numeric" }).format(new Date(year, month - 1, 1));
    };
    const start = format(obligation.referenceStart);
    const end = format(obligation.referenceEnd);
    if (start && end && start !== end) return `${start} – ${end}`;
    return start ?? end ?? "Competência não informada";
}

function FinancialBreakdown({ title, total, count, obligations, description }: { title: string; total: number; count: number; obligations: Array<{ referenceStart?: string | null; dueDate?: string | null; outstandingValue: number }>; description: string }) {
    const monthly = new Map<string, { value: number; count: number }>();
    for (const obligation of obligations) {
        const key = monthKey(obligation.referenceStart) ?? monthKey(obligation.dueDate) ?? "unknown";
        const current = monthly.get(key) ?? { value: 0, count: 0 };
        current.value += Number(obligation.outstandingValue ?? 0);
        current.count += 1;
        monthly.set(key, current);
    }
    const rows = [...monthly.entries()].sort(([a], [b]) => a.localeCompare(b));
    return (
        <article className="employee-detail-financial-breakdown">
            <div className="employee-detail-financial-breakdown__top"><span>{title}</span><strong>{currency(total)}</strong><small>{count} {count === 1 ? "obrigação" : "obrigações"}</small></div>
            <p>{description}</p>
            {rows.length ? <ul>{rows.map(([key, item]) => <li key={key}><span>{key === "unknown" ? "Competência não informada" : monthLabel(key)}<small>{item.count} {item.count === 1 ? "obrigação" : "obrigações"}</small></span><strong>{currency(item.value)}</strong></li>)}</ul> : <div className="employee-detail-financial-breakdown__empty">Nenhuma obrigação neste grupo.</div>}
        </article>
    );
}

function InfoField({ label, value }: { label: string; value?: string | null }) {
    return <div className="employee-detail-info"><span>{label}</span><strong>{value?.trim() || "Não informado"}</strong></div>;
}

function engagementPeriod(engagement: EmployeeEngagement) {
    return `${dateOnly(engagement.entryDate)} — ${engagement.exitDate ? dateOnly(engagement.exitDate) : "Atual"}`;
}

type MonthGroup = {
    key: string;
    obligations: EmployeeObligation[];
    movements: EmployeeMovement[];
};

export function EmployeeDetails() {
    const { employeeId } = useParams<{ employeeId: string }>();
    const employeeQuery = useEmployeeById(employeeId);
    const engagementsQuery = useEngagementsByEmployee(employeeId);
    const employee = employeeQuery.data;
    const engagements = engagementsQuery.data ?? [];

    const [selectedEngagementId, setSelectedEngagementId] = useState<string>();
    const [historyOpen, setHistoryOpen] = useState(false);
    const [historyCursor, setHistoryCursor] = useState<string>();
    const [historyCursorStack, setHistoryCursorStack] = useState<string[]>([]);

    useEffect(() => {
        if (!engagements.length) {
            setSelectedEngagementId(undefined);
            return;
        }
        if (!selectedEngagementId || !engagements.some(item => item.id === selectedEngagementId)) {
            const current = engagements.find(item => item.status === "trabalhando") ?? engagements[0];
            setSelectedEngagementId(current.id);
        }
    }, [engagements, selectedEngagementId]);

    const selectedEngagement = engagements.find(item => item.id === selectedEngagementId);
    const financialQuery = useEngagementFinancialSummary(selectedEngagementId);
    const obligationsQuery = useObligationsByEngagement(selectedEngagementId);
    const movementsQuery = useMovementsByEngagement(selectedEngagementId, { order: "asc" });
    const historyQuery = useEmployeeHistory(employeeId, { limit: 100, ...(historyCursor ? { cursor: historyCursor } : {}) }, historyOpen);

    const obligations = obligationsQuery.data ?? [];
    const movements = movementsQuery.data ?? [];
    const paymentsByObligation = useMemo(() => {
        const totals = new Map<string, number>();
        for (const movement of movements) {
            if (movement.type !== "pagamento" || !movement.obligationId) continue;
            totals.set(movement.obligationId, (totals.get(movement.obligationId) ?? 0) + Number(movement.value ?? 0));
        }
        return totals;
    }, [movements]);

    const timeline = useMemo(() => {
        const groups = new Map<string, MonthGroup>();
        const ensure = (key: string) => {
            const existing = groups.get(key);
            if (existing) return existing;
            const created: MonthGroup = { key, obligations: [], movements: [] };
            groups.set(key, created);
            return created;
        };

        for (const obligation of obligations) {
            const key = monthKey(obligation.createdAt) ?? monthKey(obligation.referenceStart) ?? monthKey(obligation.dueDate);
            if (key) ensure(key).obligations.push(obligation);
        }
        for (const movement of movements) {
            const key = monthKey(movement.eventDate) ?? monthKey(movement.createdAt);
            if (key) ensure(key).movements.push(movement);
        }

        return [...groups.values()].sort((a, b) => b.key.localeCompare(a.key));
    }, [obligations, movements]);

    const historyEvents = (historyQuery.data?.data ?? []).filter(event =>
        event.engagementId === null || event.engagementId === selectedEngagementId
    );

    if (employeeQuery.isPending || engagementsQuery.isPending) {
        return <main className="employee-detail-page"><AppHeader /><div className="employee-detail-state"><span className="employee-detail-spinner" />Carregando funcionário…</div></main>;
    }

    if (employeeQuery.isError || !employee) {
        return (
            <main className="employee-detail-page">
                <AppHeader />
                <section className="employee-detail-content">
                    <BackLink to="/employees" label="Voltar aos funcionários" />
                    <div className="employee-detail-state employee-detail-state--error">
                        <strong>Não foi possível carregar este funcionário.</strong>
                        <p>O cadastro pode não existir ou os dados estão temporariamente indisponíveis.</p>
                        <button type="button" onClick={() => void employeeQuery.refetch()}>Tentar novamente</button>
                    </div>
                </section>
            </main>
        );
    }

    return (
        <main className="employee-detail-page">
            <title>{employee.name} | Ficha do funcionário | Blue Admin</title>
            <AppHeader />
            <nav className="page-back-row"><BackLink to="/employees" label="Voltar aos funcionários" /></nav>
            <section className="employee-detail-content">
                <header className="employee-detail-heading">
                    <div>
                        <span className="employee-detail-eyebrow">Ficha do funcionário</span>
                        <h1>{employee.name}</h1>
                        <div className="employee-detail-identity">
                            <span><FontAwesomeIcon icon={faUser} /> {employee.document || "Documento não informado"}</span>
                            <small>ID: {employee.id}</small>
                        </div>
                    </div>
                </header>

                <section className="employee-detail-profile">
                    <header className="employee-detail-section-heading">
                        <div><span className="employee-detail-eyebrow">Cadastro</span><h2>Dados pessoais</h2></div>
                    </header>
                    <div className="employee-detail-profile-grid">
                        <InfoField label="Nome completo" value={employee.name} />
                        <InfoField label="CPF / CNPJ" value={employee.document} />
                        <InfoField label="Data de nascimento" value={dateOnly(employee.birthDate)} />
                        <InfoField label="Endereço" value={employee.address} />
                        <InfoField label="Cadastrado em" value={dateOnly(employee.createdAt)} />
                        <InfoField label="Última atualização" value={dateOnly(employee.updatedAt)} />
                        {employee.observations && <div className="employee-detail-observations"><span>Observações cadastrais</span><p>{employee.observations}</p></div>}
                    </div>
                </section>

                <section className="employee-detail-engagement-section">
                    <header className="employee-detail-section-heading">
                        <div><span className="employee-detail-eyebrow">Histórico profissional</span><h2><FontAwesomeIcon icon={faBriefcase} /> Vínculos</h2><p>Selecione um vínculo para consultar suas competências, obrigações e movimentações.</p></div>
                        <span className="employee-detail-count">{engagements.length} {engagements.length === 1 ? "vínculo" : "vínculos"}</span>
                    </header>
                    {engagementsQuery.isError ? (
                        <div className="employee-detail-state employee-detail-state--error"><strong>Não foi possível carregar os vínculos.</strong><button type="button" onClick={() => void engagementsQuery.refetch()}>Tentar novamente</button></div>
                    ) : engagements.length === 0 ? (
                        <div className="employee-detail-empty"><strong>Nenhum vínculo cadastrado</strong><p>Este cadastro ainda não possui um vínculo de trabalho.</p></div>
                    ) : (
                        <div className="employee-detail-engagements">
                            {engagements.map(engagement => (
                                <button type="button" key={engagement.id} className={`employee-detail-engagement ${engagement.id === selectedEngagementId ? "employee-detail-engagement--selected" : ""}`} onClick={() => { setSelectedEngagementId(engagement.id); setHistoryCursor(undefined); setHistoryCursorStack([]); }}>
                                    <span className={`employee-detail-status employee-detail-status--${engagement.status === "trabalhando" ? "active" : "inactive"}`}>{engagementStatusLabels[engagement.status]}</span>
                                    <strong>{modalityLabels[engagement.modality]}</strong>
                                    <small>{engagementPeriod(engagement)}</small>
                                    <span className="employee-detail-engagement__salary">{engagement.currentSalary == null ? "Remuneração não informada" : currency(engagement.currentSalary)}{engagement.hourlyRate != null ? ` · ${currency(engagement.hourlyRate)}/h` : ""}</span>
                                    {engagement.id === selectedEngagementId && <span className="employee-detail-engagement__selected">Vínculo selecionado</span>}
                                </button>
                            ))}
                        </div>
                    )}
                </section>

                {selectedEngagement && (
                    <>
                        <section className="employee-detail-financial">
                            <header className="employee-detail-section-heading">
                                <div><span className="employee-detail-eyebrow">Visão do vínculo</span><h2><FontAwesomeIcon icon={faWallet} /> Resumo financeiro</h2></div>
                                <small>{engagementPeriod(selectedEngagement)}</small>
                            </header>
                            {financialQuery.isPending ? <div className="employee-detail-loading">Carregando resumo financeiro…</div> : financialQuery.isError ? (
                                <div className="employee-detail-state employee-detail-state--error"><strong>Não foi possível carregar o resumo financeiro.</strong><button type="button" onClick={() => void financialQuery.refetch()}>Tentar novamente</button></div>
                            ) : financialQuery.data && (
                                <div className="employee-detail-financial-grid">
                                    <FinancialBreakdown title="Saldo em aberto" total={financialQuery.data.totalOutstanding} count={financialQuery.data.openObligationsCount} obligations={obligations.filter(item => item.status !== "pago" && item.status !== "cancelado").map(item => ({ referenceStart: item.referenceStart, dueDate: item.dueDate, outstandingValue: Math.max(0, Number((Number(item.finalValue) - (paymentsByObligation.get(item.id) ?? 0)).toFixed(2))) }))} description="Valores que ainda precisam ser pagos, agrupados pela competência." />
                                    <FinancialBreakdown title="Saldo vencido" total={financialQuery.data.overdueObligations.reduce((total, item) => total + item.outstandingValue, 0)} count={financialQuery.data.overdueObligations.length} obligations={financialQuery.data.overdueObligations} description="Obrigações cujo vencimento já passou e ainda têm saldo." />
                                    <FinancialBreakdown title="Próximos vencimentos" total={financialQuery.data.upcomingObligations.reduce((total, item) => total + item.outstandingValue, 0)} count={financialQuery.data.upcomingObligations.length} obligations={financialQuery.data.upcomingObligations} description="Valores previstos para os próximos 30 dias." />
                                </div>
                            )}
                            {financialQuery.data?.obligationsByType.length ? <div className="employee-detail-type-breakdown">{financialQuery.data.obligationsByType.map(item => <span key={item.type}><small>{obligationTypeLabels[item.type]}</small><strong>{currency(item.totalOutstanding)}</strong><em>{item.count} {item.count === 1 ? "obrigação" : "obrigações"}</em></span>)}</div> : null}
                        </section>

                        <section className="employee-detail-timeline-section">
                            <header className="employee-detail-section-heading">
                                <div><span className="employee-detail-eyebrow">Competências e registros</span><h2><FontAwesomeIcon icon={faCalendarDays} /> Linha do tempo do vínculo</h2><p>As obrigações aparecem no mês em que foram cadastradas, com a competência e o vencimento visíveis dentro do registro. Os movimentos aparecem no mês em que ocorreram, e os pagamentos continuam ligados à obrigação quitada.</p></div>
                            <span className="employee-detail-count">{obligations.length} obrigações · {movements.length} movimentos</span>
                        </header>

                        {obligationsQuery.isPending || movementsQuery.isPending ? <div className="employee-detail-loading">Carregando competências e movimentações…</div> : obligationsQuery.isError || movementsQuery.isError ? (
                            <div className="employee-detail-state employee-detail-state--error"><strong>Não foi possível carregar os registros deste vínculo.</strong><button type="button" onClick={() => { void obligationsQuery.refetch(); void movementsQuery.refetch(); }}>Tentar novamente</button></div>
                        ) : timeline.length === 0 ? (
                            <div className="employee-detail-empty"><strong>Nenhuma competência ou movimentação registrada</strong><p>Quando houver obrigações ou lançamentos neste vínculo, eles serão organizados aqui por mês.</p></div>
                        ) : (
                            <div className="employee-detail-months">
                                {timeline.map(group => (
                                    <article className="employee-detail-month" key={group.key}>
                                        <header className="employee-detail-month__heading"><h3>{monthLabel(group.key)}</h3><span>{group.obligations.length} obrigações cadastradas · {group.movements.length} movimentos realizados</span></header>
                                        {group.obligations.length > 0 && (
                                            <section className="employee-detail-month__section">
                                                <h4><FontAwesomeIcon icon={faFileInvoiceDollar} /> Obrigações cadastradas neste mês <small>Competência, vencimento e saldo a pagar</small></h4>
                                                <div className="employee-detail-obligations">
                                                    {group.obligations.map(obligation => {
                                                        const finalValue = Number(obligation.finalValue);
                                                        const paidValue = paymentsByObligation.get(obligation.id) ?? 0;
                                                        const balance = Math.max(0, Number((finalValue - paidValue).toFixed(2)));
                                                        return (
                                                            <article className="employee-detail-obligation" key={obligation.id}>
                                                                <header><div><span className={`employee-detail-obligation-type employee-detail-obligation-type--${obligation.type}`}>{obligationTypeLabels[obligation.type]}</span><strong>{obligation.title}</strong></div><span className={`employee-detail-obligation-status employee-detail-obligation-status--${obligation.status}`}>{obligationStatusLabels[obligation.status]}</span></header>
                                                                <p>Competência: {formatCompetency(obligation)}{obligation.dueDate ? ` · Vence em ${dateOnly(obligation.dueDate)}` : ""}{obligation.createdAt ? ` · Registrada em ${dateOnly(obligation.createdAt)}` : ""}</p>
                                                                <div className="employee-detail-obligation-values"><span><small>Valor previsto</small><strong>{currency(finalValue)}</strong></span><span><small>Já pago / alocado</small><strong>{currency(paidValue)}</strong></span><span><small>Falta pagar</small><strong>{currency(balance)}</strong></span></div>
                                                                {obligation.description && <p className="employee-detail-obligation-description">{obligation.description}</p>}
                                                                {obligation.observations && <small className="employee-detail-obligation-note">Observação: {obligation.observations}</small>}
                                                            </article>
                                                        );
                                                    })}
                                                </div>
                                            </section>
                                        )}
                                        {group.movements.length > 0 && (
                                            <section className="employee-detail-month__section">
                                                <h4><FontAwesomeIcon icon={faClockRotateLeft} /> Movimentos realizados neste mês <small>Pagamentos e outros registros pela data do evento</small></h4>
                                                <ol className="employee-detail-movements">
                                                    {group.movements.map(movement => (
                                                        <li key={movement.id} className={`employee-detail-movement employee-detail-movement--${movement.type}`}>
                                                            <div className="employee-detail-movement__date">{dateOnly(movement.eventDate ?? movement.createdAt)}</div>
                                                            <div className="employee-detail-movement__body"><strong>{movement.type === "pagamento" ? "Pagamento realizado" : movementTypeLabels[movement.type]}</strong><p>{movement.description}</p>{movement.type === "pagamento" && movement.obligation ? <small className="employee-detail-payment-link">Alocado em: <strong>{movement.obligation.title}</strong> · Competência {formatCompetency(movement.obligation)}</small> : movement.obligation ? <small className="employee-detail-payment-link">Relacionado à obrigação: <strong>{movement.obligation.title}</strong> · {formatCompetency(movement.obligation)}</small> : movementTypesRequiringObligation.has(movement.type) ? <small className="employee-detail-unlinked">Obrigação não vinculada</small> : null}{movement.financialTransaction && <small className="employee-detail-transaction">Transação financeira: {movement.financialTransaction.description} · referência {dateOnly(movement.financialTransaction.referenceDate)}</small>}{movement.observations && <small className="employee-detail-movement-note">Observação: {movement.observations}</small>}</div>
                                                            <strong className="employee-detail-movement__value">{movement.value == null ? "—" : movement.type === "pagamento" ? "Pago " + currency(movement.value) : currency(movement.value)}</strong>
                                                        </li>
                                                    ))}
                                                </ol>
                                            </section>
                                        )}
                                    </article>
                                ))}
                            </div>
                        )}
                        </section>
                        <section className="employee-detail-history">
                            <button className="employee-detail-history-toggle" type="button" aria-expanded={historyOpen} onClick={() => setHistoryOpen(value => !value)}><span><FontAwesomeIcon icon={faClockRotateLeft} /> Histórico de alterações</span><small>{historyOpen ? "Ocultar" : "Carregar quando necessário"}</small></button>
                            {historyOpen && (
                                <div className="employee-detail-history-content">
                                    <p>Eventos do funcionário e do vínculo selecionado. Registros de outros vínculos ficam ocultos nesta visualização.</p>
                                    {historyQuery.isPending ? <div className="employee-detail-loading">Carregando histórico…</div> : historyQuery.isError ? <div className="employee-detail-state employee-detail-state--error"><strong>Não foi possível carregar o histórico.</strong><button type="button" onClick={() => void historyQuery.refetch()}>Tentar novamente</button></div> : historyEvents.length === 0 ? <div className="employee-detail-empty"><strong>Nenhum evento para este vínculo nesta página</strong></div> : (
                                        <ol className="employee-detail-history-list">{historyEvents.map(event => <HistoryItem event={event} key={event.id} />)}</ol>
                                    )}
                                    {historyQuery.data?.pagination.hasMore && <button className="employee-detail-history-next" type="button" onClick={() => { const next = historyQuery.data?.pagination.nextCursor; if (next) { setHistoryCursorStack(stack => [...stack, historyCursor ?? ""]); setHistoryCursor(next); } }}>Carregar eventos anteriores</button>}
                                    {historyCursor && <button className="employee-detail-history-next" type="button" onClick={() => { const stack = [...historyCursorStack]; const previous = stack.pop() || undefined; setHistoryCursorStack(stack); setHistoryCursor(previous); }}>Voltar à página anterior</button>}
                                </div>
                            )}
                        </section>
                    </>
                )}
            </section>
        </main>
    );
}

function HistoryItem({ event }: { event: EmployeeHistoryEvent }) {
    const label = event.eventType.replace(/_/g, " ");
    return (
        <li className="employee-detail-history-item">
            <span className="employee-detail-history-marker" />
            <article><header><strong>{label.charAt(0).toUpperCase() + label.slice(1)}</strong><time>{dateTime(event.eventDate ?? event.createdAt)}</time></header><p>{event.description}</p><small>{event.engagementId ? "Vínculo selecionado" : "Registro geral do funcionário"}</small></article>
        </li>
    );
}
