import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faBriefcase,
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
    useObligationsByFilters,
    useMovementsByFilters,
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
    EmployeeMovementType,
    FinancialSummaryObligation,
    FindObligationsFilters,
    FindMovementsFilters
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

function formatCompetency(obligation?: { referenceStart?: string | null | undefined; referenceEnd?: string | null | undefined } | null) {
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

type ModalObligation = {
    id: string;
    type: ObligationType;
    title: string;
    referenceStart: string | null;
    referenceEnd: string | null;
    dueDate: string | null;
    createdAt?: string;
    status: ObligationStatus;
    finalValue: number | string;
    paidValue?: number;
    outstandingValue?: number;
    description?: string | null;
    observations?: string | null;
};

function FinancialBreakdown({ title, total, count, obligations, description, emptyLabel, onClick }: {
    title: string;
    total: number;
    count: number;
    obligations: FinancialSummaryObligation[];
    description: string;
    emptyLabel: string;
    onClick: () => void;
}) {
    const sortedObligations = [...obligations].sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""));
    return (
        <button type="button" className={`employee-detail-financial-breakdown ${title === "A pagar agora" ? "employee-detail-financial-breakdown--urgent" : title === "Próximos vencimentos" ? "employee-detail-financial-breakdown--upcoming" : ""}`} onClick={onClick} aria-haspopup="dialog">
            <span className="employee-detail-financial-breakdown__top"><span>{title}</span><strong>{currency(total)}</strong><small>{count} {count === 1 ? "obrigação" : "obrigações"}</small></span>
            <span className="employee-detail-financial-breakdown__description">{description}</span>
            {sortedObligations.length ? <span className="employee-detail-financial-breakdown__items">{sortedObligations.slice(0, 3).map(obligation => <span key={obligation.id}><strong>{obligation.title}</strong><small>{obligation.dueDate ? "Vencimento: " + dateOnly(obligation.dueDate) : obligation.referenceStart || obligation.referenceEnd ? "Data de referência: " + dateOnly(obligation.referenceStart ?? obligation.referenceEnd) : "Data de cadastro: " + dateOnly(obligation.createdAt)}{(obligation.referenceStart || obligation.referenceEnd) ? " · Competência: " + formatCompetency(obligation) : ""}</small></span>)}</span> : <span className="employee-detail-financial-breakdown__empty">{emptyLabel}</span>}
            <span className="employee-detail-financial-breakdown__action">Clique para detalhar as obrigações <span aria-hidden="true">→</span></span>
        </button>
    );
}

function ObligationDetailsModal({ title, obligations, onClose }: { title: string; obligations: ModalObligation[]; onClose: () => void }) {
    return (
        <div className="employee-detail-modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
            <section className="employee-detail-modal" role="dialog" aria-modal="true" aria-label={title}>
                <header className="employee-detail-modal__header"><div><span className="employee-detail-eyebrow">Detalhamento financeiro</span><h2>{title}</h2><p>{obligations.length} {obligations.length === 1 ? "obrigação encontrada" : "obrigações encontradas"}</p></div><button type="button" onClick={onClose} aria-label="Fechar detalhamento">×</button></header>
                {obligations.length ? <div className="employee-detail-modal__list">{obligations.map(obligation => {
                    const finalValue = Number(obligation.finalValue);
                    const paidValue = Number(obligation.paidValue ?? 0);
                    const outstandingValue = Number(obligation.outstandingValue ?? Math.max(0, finalValue - paidValue));
                    return <article className={`employee-detail-modal-obligation employee-detail-obligation--${obligation.type}`} key={obligation.id}>
                        <header><span className={`employee-detail-obligation-type employee-detail-obligation-type--${obligation.type}`}>{obligationTypeLabels[obligation.type]}</span><span className={`employee-detail-obligation-status employee-detail-obligation-status--${obligation.status}`}>{obligationStatusLabels[obligation.status]}</span></header>
                        <h3>{obligation.title}</h3>
                        <div className="employee-detail-obligation-meta">
                            <span><small>Competência / referência</small><strong>{formatCompetency(obligation)}</strong></span>
                            <span><small>{obligation.dueDate ? "Data de vencimento" : obligation.referenceStart || obligation.referenceEnd ? "Data de referência" : "Sem vencimento ou referência"}</small><strong>{dateOnly(obligation.dueDate ?? obligation.referenceStart ?? obligation.referenceEnd)}</strong></span>
                            <span><small>Data de cadastro</small><strong>{dateOnly(obligation.createdAt)}</strong></span>
                        </div>
                        <div className="employee-detail-obligation-values"><span><small>Valor previsto</small><strong>{currency(finalValue)}</strong></span><span><small>Já pago / alocado</small><strong>{currency(paidValue)}</strong></span><span><small>Saldo restante</small><strong>{currency(outstandingValue)}</strong></span></div>
                        {obligation.description && <p className="employee-detail-obligation-description">{obligation.description}</p>}
                        {obligation.observations && <small className="employee-detail-obligation-note">Observação: {obligation.observations}</small>}
                    </article>;
                })}</div> : <div className="employee-detail-empty">Não há obrigações nesta categoria.</div>}
            </section>
        </div>
    );
}

function InfoField({ label, value }: { label: string; value?: string | null }) {
    return <div className="employee-detail-info"><span>{label}</span><strong>{value?.trim() || "Não informado"}</strong></div>;
}

function engagementPeriod(engagement: EmployeeEngagement) {
    return `${dateOnly(engagement.entryDate)} — ${engagement.exitDate ? dateOnly(engagement.exitDate) : "Atual"}`;
}

type ObligationGroup = {
    key: string;
    obligations: EmployeeObligation[];
    sortDate: string;
};

function obligationGroupKey(obligation: EmployeeObligation) {
    return monthKey(obligation.dueDate ?? obligation.referenceStart ?? obligation.referenceEnd ?? obligation.createdAt) ?? "sem-vencimento";
}

function obligationGroupAnchor(key: string) {
    return `employee-obligation-group-${key}`;
}

function obligationSortDate(obligation: EmployeeObligation) {
    return obligation.dueDate ?? obligation.referenceStart ?? obligation.referenceEnd ?? obligation.createdAt ?? "";
}

function movementSortDate(movement: EmployeeMovement) {
    return movement.eventDate ?? movement.createdAt ?? "";
}

export function EmployeeDetails() {
    const { employeeId } = useParams<{ employeeId: string }>();
    const employeeQuery = useEmployeeById(employeeId);
    const engagementsQuery = useEngagementsByEmployee(employeeId);
    const employee = employeeQuery.data;
    const engagements = engagementsQuery.data ?? [];

    useEffect(() => {
        document.title = employee ? `${employee.name} | Ficha do funcionário | Blue Admin` : "Ficha do funcionário | Blue Admin";
        return () => { document.title = "Blue Admin"; };
    }, [employee?.name]);

    const [selectedEngagementId, setSelectedEngagementId] = useState<string>();
    const [historyOpen, setHistoryOpen] = useState(false);
    const [historyCursor, setHistoryCursor] = useState<string>();
    const [historyCursorStack, setHistoryCursorStack] = useState<string[]>([]);
    const [obligationSearch, setObligationSearch] = useState("");
    const [obligationSearchApplied, setObligationSearchApplied] = useState("");
    const [obligationCursor, setObligationCursor] = useState<string>();
    const [obligationCursorStack, setObligationCursorStack] = useState<string[]>([]);
    const [obligationStatusFilter, setObligationStatusFilter] = useState<ObligationStatus | "todas">("todas");
    const [obligationTypeFilter, setObligationTypeFilter] = useState<ObligationType | "todos">("todos");
    const [obligationDueFrom, setObligationDueFrom] = useState("");
    const [obligationDueTo, setObligationDueTo] = useState("");
    const [movementSearch, setMovementSearch] = useState("");
    const [movementSearchApplied, setMovementSearchApplied] = useState("");
    const [movementTypeFilter, setMovementTypeFilter] = useState<EmployeeMovementType | "todos">("todos");
    const [movementDateFrom, setMovementDateFrom] = useState("");
    const [movementDateTo, setMovementDateTo] = useState("");
    const [movementCursor, setMovementCursor] = useState<string>();
    const [movementCursorStack, setMovementCursorStack] = useState<string[]>([]);
    const [financialModal, setFinancialModal] = useState<{ title: string; obligations: FinancialSummaryObligation[] } | null>(null);
    const [selectedObligation, setSelectedObligation] = useState<EmployeeObligation | null>(null);
    const [expandedObligationMovements, setExpandedObligationMovements] = useState<Set<string>>(() => new Set());

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
    const obligationFilters: FindObligationsFilters = {
        ...(selectedEngagementId ? { engagementId: selectedEngagementId } : {}),
        limit: 10,
        ...(obligationSearchApplied.trim() ? { title: obligationSearchApplied.trim() } : {}),
        ...(obligationStatusFilter !== "todas" ? { status: obligationStatusFilter } : {}),
        ...(obligationTypeFilter !== "todos" ? { type: obligationTypeFilter } : {}),
        ...(obligationDueFrom ? { dueDateFrom: obligationDueFrom } : {}),
        ...(obligationDueTo ? { dueDateTo: obligationDueTo } : {}),
        ...(obligationCursor ? { cursor: obligationCursor } : {})
    };
    const movementFilters: FindMovementsFilters = {
        ...(selectedEngagementId ? { engagementId: selectedEngagementId } : {}),
        limit: 10,
        order: "desc",
        ...(movementSearchApplied.trim() ? { description: movementSearchApplied.trim() } : {}),
        ...(movementTypeFilter !== "todos" ? { type: movementTypeFilter } : {}),
        ...(movementDateFrom ? { eventDateFrom: movementDateFrom } : {}),
        ...(movementDateTo ? { eventDateTo: movementDateTo } : {}),
        ...(movementCursor ? { cursor: movementCursor } : {})
    };
    const obligationsQuery = useObligationsByFilters(obligationFilters, Boolean(selectedEngagementId));
    const movementsQuery = useMovementsByFilters(movementFilters, Boolean(selectedEngagementId));
    const historyQuery = useEmployeeHistory(employeeId, { limit: 100, ...(historyCursor ? { cursor: historyCursor } : {}) }, historyOpen);

    const obligations = obligationsQuery.data?.data ?? [];
    const movements = movementsQuery.data?.data ?? [];
    const filteredObligations = obligations;

    const obligationGroups = useMemo(() => {
        const groups = new Map<string, EmployeeObligation[]>();
        for (const obligation of filteredObligations) {
            const key = obligationGroupKey(obligation);
            const group = groups.get(key) ?? [];
            group.push(obligation);
            groups.set(key, group);
        }

        return [...groups.entries()].map(([key, items]): ObligationGroup => ({
            key,
            obligations: items.sort((a, b) => obligationSortDate(a).localeCompare(obligationSortDate(b))),
            sortDate: items.reduce((latest, item) => {
                const date = obligationSortDate(item);
                return date > latest ? date : latest;
            }, "")
        })).sort((a, b) => b.sortDate.localeCompare(a.sortDate));
    }, [filteredObligations]);

    const visibleObligationGroups = obligationGroups;
    const obligationGroupById = useMemo(() => {
        const groups = new Map<string, string>();
        for (const obligation of obligations) groups.set(obligation.id, obligationGroupKey(obligation));
        return groups;
    }, [obligations]);

    const sortedMovements = useMemo(
        () => [...movements].sort((a, b) => movementSortDate(b).localeCompare(movementSortDate(a))),
        [movements]
    );

    const visibleMovements = sortedMovements;
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
                        <div className="employee-detail-profile-group">
                            <span className="employee-detail-profile-group__title">Identificação</span>
                            <InfoField label="Nome completo" value={employee.name} />
                            <InfoField label="CPF / CNPJ" value={employee.document} />
                            <InfoField label="Data de nascimento" value={dateOnly(employee.birthDate)} />
                        </div>
                        <div className="employee-detail-profile-group">
                            <span className="employee-detail-profile-group__title">Endereço</span>
                            <InfoField label="Endereço cadastrado" value={employee.address} />
                        </div>
                        <div className="employee-detail-profile-group">
                            <span className="employee-detail-profile-group__title">Dados do cadastro</span>
                            <InfoField label="Cadastrado em" value={dateOnly(employee.createdAt)} />
                            <InfoField label="Última atualização" value={dateOnly(employee.updatedAt)} />
                        </div>
                        {employee.observations && <div className="employee-detail-profile-group employee-detail-profile-group--full"><span className="employee-detail-profile-group__title">Observações</span><div className="employee-detail-observations"><p>{employee.observations}</p></div></div>}
                    </div>
                </section>

                <section className="employee-detail-engagement-section">
                    <header className="employee-detail-section-heading">
                        <div><span className="employee-detail-eyebrow">Histórico profissional</span><h2><FontAwesomeIcon icon={faBriefcase} /> Vínculos</h2><p>Selecione um vínculo para consultar o que precisa ser pago, os próximos vencimentos e os registros.</p></div>
                        <span className="employee-detail-count">{engagements.length} {engagements.length === 1 ? "vínculo" : "vínculos"}</span>
                    </header>
                    {engagementsQuery.isError ? (
                        <div className="employee-detail-state employee-detail-state--error"><strong>Não foi possível carregar os vínculos.</strong><button type="button" onClick={() => void engagementsQuery.refetch()}>Tentar novamente</button></div>
                    ) : engagements.length === 0 ? (
                        <div className="employee-detail-empty"><strong>Nenhum vínculo cadastrado</strong><p>Este cadastro ainda não possui um vínculo de trabalho.</p></div>
                    ) : (
                        <div className="employee-detail-engagements">
                            {engagements.map(engagement => (
                                <button type="button" key={engagement.id} className={`employee-detail-engagement ${engagement.id === selectedEngagementId ? "employee-detail-engagement--selected" : ""}`} onClick={() => { setSelectedEngagementId(engagement.id); setHistoryCursor(undefined); setHistoryCursorStack([]); setObligationCursor(undefined); setObligationCursorStack([]); setMovementCursor(undefined); setMovementCursorStack([]); }}>
                                    <span className={`employee-detail-status employee-detail-status--${engagement.status === "trabalhando" ? "active" : "inactive"}`}>{engagementStatusLabels[engagement.status]}</span>
                                    <strong>{modalityLabels[engagement.modality]}</strong>
                                    <small>{engagementPeriod(engagement)}</small>
                                    <span className="employee-detail-engagement__salary">{engagement.currentSalary == null ? "Remuneração não informada" : currency(engagement.currentSalary)}{engagement.hourlyRate != null ? ` · ${currency(engagement.hourlyRate)}/h` : ""}</span>
                                    <span className="employee-detail-engagement__dates"><small>Admissão</small><strong>{dateOnly(engagement.entryDate)}</strong><small>Desligamento</small><strong>{engagement.exitDate ? dateOnly(engagement.exitDate) : "Vínculo atual"}</strong><small>Cadastrado</small><strong>{dateOnly(engagement.createdAt)}</strong></span>
                                    {engagement.observations && <span className="employee-detail-engagement__observations">{engagement.observations}</span>}
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
                                    <FinancialBreakdown title="A pagar agora" total={financialQuery.data.totalOutstanding} count={financialQuery.data.openObligationsCount} obligations={financialQuery.data.dueNowObligations} description="Obrigações vencidas ou com vencimento hoje. Este é o valor que exige atenção imediata." emptyLabel="Nenhuma obrigação vencida ou com vencimento hoje." onClick={() => setFinancialModal({ title: "A pagar agora", obligations: financialQuery.data.dueNowObligations })} />
                                    <FinancialBreakdown title="Próximos vencimentos" total={financialQuery.data.upcomingObligations.reduce((total, item) => total + item.outstandingValue, 0)} count={financialQuery.data.upcomingObligations.length} obligations={financialQuery.data.upcomingObligations} description="Obrigações com vencimento nos próximos 30 dias, organizadas pela data de pagamento." emptyLabel="Nenhum vencimento nos próximos 30 dias." onClick={() => setFinancialModal({ title: "Próximos vencimentos", obligations: financialQuery.data.upcomingObligations })} />
                                    <FinancialBreakdown title="Sem vencimento definido" total={financialQuery.data.undatedObligations.reduce((total, item) => total + item.outstandingValue, 0)} count={financialQuery.data.undatedObligations.length} obligations={financialQuery.data.undatedObligations} description="Obrigações em aberto que precisam de uma data de vencimento definida." emptyLabel="Todas as obrigações em aberto têm vencimento definido." onClick={() => setFinancialModal({ title: "Sem vencimento definido", obligations: financialQuery.data.undatedObligations })} />
                                </div>
                            )}
                            
                        </section>

                        <section className="employee-detail-records-section">
                            <section className="employee-detail-records-block">
                                <header className="employee-detail-section-heading">
                                    <div><span className="employee-detail-eyebrow">Valores definidos para o vínculo</span><h2><FontAwesomeIcon icon={faFileInvoiceDollar} /> Obrigações</h2><p>Agrupadas pelo mês de vencimento, do mais recente para o mais antigo. Dentro de cada mês, as obrigações seguem a data de vencimento, da mais próxima para a mais distante.</p></div>
                                    <span className="employee-detail-count">{obligations.length} obrigações nesta página</span>
                                </header>
                                {obligationsQuery.isPending ? <div className="employee-detail-loading">Carregando obrigações…</div> : obligationsQuery.isError ? (
                                    <div className="employee-detail-state employee-detail-state--error"><strong>Não foi possível carregar as obrigações.</strong><button type="button" onClick={() => void obligationsQuery.refetch()}>Tentar novamente</button></div>
                                ) : (
                                    <form className="employee-detail-obligation-filters" onSubmit={event => { event.preventDefault(); setObligationSearchApplied(obligationSearch.trim()); setObligationCursor(undefined); setObligationCursorStack([]); }}>
                                        <label className="employee-detail-filter-search"><span>Pesquisar obrigações</span><input type="search" value={obligationSearch} onChange={event => setObligationSearch(event.target.value)} placeholder="Buscar pelo título da obrigação…" /></label>
                                        <label className="employee-detail-filter-status"><span>Status</span><select value={obligationStatusFilter} onChange={event => { setObligationStatusFilter(event.target.value as ObligationStatus | "todas"); setObligationCursor(undefined); setObligationCursorStack([]); }}><option value="todas">Todos os status</option>{Object.entries(obligationStatusLabels).map(([status, label]) => <option value={status} key={status}>{label}</option>)}</select></label>
                                        <label className="employee-detail-filter-status"><span>Tipo</span><select value={obligationTypeFilter} onChange={event => { setObligationTypeFilter(event.target.value as ObligationType | "todos"); setObligationCursor(undefined); setObligationCursorStack([]); }}><option value="todos">Todos os tipos</option>{Object.entries(obligationTypeLabels).map(([type, label]) => <option value={type} key={type}>{label}</option>)}</select></label>
                                        <label className="employee-detail-filter-status"><span>Vencimento de</span><input type="date" value={obligationDueFrom} onChange={event => { setObligationDueFrom(event.target.value); setObligationCursor(undefined); setObligationCursorStack([]); }} /></label>
                                        <label className="employee-detail-filter-status"><span>Vencimento até</span><input type="date" value={obligationDueTo} onChange={event => { setObligationDueTo(event.target.value); setObligationCursor(undefined); setObligationCursorStack([]); }} /></label>
                                        <div className="employee-detail-filter-actions"><button type="submit">Pesquisar</button><button type="button" onClick={() => { setObligationSearch(""); setObligationSearchApplied(""); setObligationStatusFilter("todas"); setObligationTypeFilter("todos"); setObligationDueFrom(""); setObligationDueTo(""); setObligationCursor(undefined); setObligationCursorStack([]); }}>Limpar</button></div>
                                    </form>
                                )}
                                {!obligationsQuery.isPending && !obligationsQuery.isError && (obligationGroups.length === 0 ? (
                                    <div className="employee-detail-empty"><strong>{obligations.length ? "Nenhuma obrigação encontrada" : "Nenhuma obrigação cadastrada"}</strong><p>{obligations.length ? "Tente alterar a pesquisa ou o filtro de status." : "As obrigações deste vínculo aparecerão aqui, agrupadas pelo mês de vencimento."}</p></div>
                                ) : (
                                    <div className="employee-detail-obligation-groups">
                                        {visibleObligationGroups.map(group => (
                                            <article className="employee-detail-obligation-group" id={obligationGroupAnchor(group.key)} key={group.key}>
                                                <header className="employee-detail-obligation-group__heading"><h3>{group.key === "sem-vencimento" ? "Sem vencimento definido" : monthLabel(group.key)}</h3><span>{group.obligations.length} {group.obligations.length === 1 ? "obrigação" : "obrigações"}</span></header>
                                                <div className="employee-detail-obligations">
                                                    {group.obligations.map(obligation => {
                                                        const finalValue = Number(obligation.finalValue);
                                                        const paidValue = Number(obligation.paidValue ?? 0);
                                                        const balance = Number(obligation.outstandingValue ?? Math.max(0, finalValue - paidValue));
                                                        return (
                                                            <article className={`employee-detail-obligation employee-detail-obligation--${obligation.type}`} id={`employee-obligation-${obligation.id}`} key={obligation.id}>
                                                                <header><div><span className={`employee-detail-obligation-type employee-detail-obligation-type--${obligation.type}`}>{obligationTypeLabels[obligation.type]}</span><strong>{obligation.title}</strong></div><span className={`employee-detail-obligation-status employee-detail-obligation-status--${obligation.status}`}>{obligationStatusLabels[obligation.status]}</span></header>
                                                                <div className="employee-detail-obligation-meta">
                                                                    <span><small>Período de referência</small><strong>{formatCompetency(obligation)}</strong></span>
                                                                    <span><small>{obligation.dueDate ? "Vencimento" : obligation.referenceStart || obligation.referenceEnd ? "Data de referência" : "Registrada em"}</small><strong>{dateOnly(obligation.dueDate ?? obligation.referenceStart ?? obligation.referenceEnd ?? obligation.createdAt)}</strong></span>
                                                                    <span><small>Registrada em</small><strong>{dateOnly(obligation.createdAt)}</strong></span>
                                                                </div>
                                                                <div className="employee-detail-obligation-values"><span><small>Valor previsto</small><strong>{currency(finalValue)}</strong></span><span><small>Já pago / alocado</small><strong>{currency(paidValue)}</strong></span><span><small>Saldo restante</small><strong>{currency(balance)}</strong></span></div>
                                                                {obligation.description && <p className="employee-detail-obligation-description">{obligation.description}</p>}
                                                                {obligation.observations && <small className="employee-detail-obligation-note">Observação: {obligation.observations}</small>}
                                                                <button type="button" className="employee-detail-obligation-details-button" onClick={() => setSelectedObligation(obligation as ModalObligation)}>Ver detalhes completos</button>
                                                                <button type="button" className="employee-detail-obligation-movements-toggle" aria-expanded={expandedObligationMovements.has(obligation.id)} onClick={() => setExpandedObligationMovements(current => { const next = new Set(current); if (next.has(obligation.id)) next.delete(obligation.id); else next.add(obligation.id); return next; })}>{expandedObligationMovements.has(obligation.id) ? "Ocultar movimentações" : "Ver movimentações desta obrigação"}</button>
                                                                {expandedObligationMovements.has(obligation.id) && <ObligationMovementsList obligationId={obligation.id} />}
                                                            </article>
                                                        );
                                                    })}
                                                </div>
                                            </article>
                                        ))}
                                    </div>
                                ))}
                                <div className="employee-detail-pagination"><span>Página {obligationCursorStack.length + 1}</span><button type="button" disabled={!obligationCursorStack.length} onClick={() => { const stack = [...obligationCursorStack]; const previous = stack.pop() || undefined; setObligationCursorStack(stack); setObligationCursor(previous); }}>Anterior</button><button type="button" disabled={!obligationsQuery.data?.pagination.hasMore} onClick={() => { const next = obligationsQuery.data?.pagination.nextCursor; if (next) { setObligationCursorStack(stack => [...stack, obligationCursor ?? ""]); setObligationCursor(next); } }}>Próxima</button></div>
                            </section>

                            <section className="employee-detail-records-block">
                                <header className="employee-detail-section-heading">
                                    <div><span className="employee-detail-eyebrow">Registros financeiros e administrativos</span><h2><FontAwesomeIcon icon={faClockRotateLeft} /> Lançamentos</h2><p>Ordenados pela data em que aconteceram. Quando um lançamento estiver ligado a uma obrigação, você poderá ir diretamente à competência correspondente.</p></div>
                                    <span className="employee-detail-count">{movements.length} lançamentos nesta página</span>
                                </header>
                                <form className="employee-detail-obligation-filters employee-detail-movement-filters" onSubmit={event => { event.preventDefault(); setMovementSearchApplied(movementSearch.trim()); setMovementCursor(undefined); setMovementCursorStack([]); }}>
                                    <label className="employee-detail-filter-search"><span>Pesquisar lançamentos</span><input type="search" value={movementSearch} onChange={event => setMovementSearch(event.target.value)} placeholder="Descrição do lançamento…" /></label>
                                    <label className="employee-detail-filter-status"><span>Tipo</span><select value={movementTypeFilter} onChange={event => { setMovementTypeFilter(event.target.value as EmployeeMovementType | "todos"); setMovementCursor(undefined); setMovementCursorStack([]); }}><option value="todos">Todos os tipos</option>{Object.entries(movementTypeLabels).map(([type, label]) => <option value={type} key={type}>{label}</option>)}</select></label>
                                    <label className="employee-detail-filter-status"><span>Data de</span><input type="date" value={movementDateFrom} onChange={event => { setMovementDateFrom(event.target.value); setMovementCursor(undefined); setMovementCursorStack([]); }} /></label>
                                    <label className="employee-detail-filter-status"><span>Data até</span><input type="date" value={movementDateTo} onChange={event => { setMovementDateTo(event.target.value); setMovementCursor(undefined); setMovementCursorStack([]); }} /></label>
                                    <div className="employee-detail-filter-actions"><button type="submit">Pesquisar</button><button type="button" onClick={() => { setMovementSearch(""); setMovementSearchApplied(""); setMovementTypeFilter("todos"); setMovementDateFrom(""); setMovementDateTo(""); setMovementCursor(undefined); setMovementCursorStack([]); }}>Limpar</button></div>
                                </form>
                                {movementsQuery.isPending ? <div className="employee-detail-loading">Carregando lançamentos…</div> : movementsQuery.isError ? (
                                    <div className="employee-detail-state employee-detail-state--error"><strong>Não foi possível carregar os lançamentos.</strong><button type="button" onClick={() => void movementsQuery.refetch()}>Tentar novamente</button></div>
                                ) : sortedMovements.length === 0 ? (
                                    <div className="employee-detail-empty"><strong>Nenhum lançamento registrado</strong><p>Pagamentos e outros registros do vínculo aparecerão aqui, do mais recente para o mais antigo.</p></div>
                                ) : (
                                    <><ol className="employee-detail-movements">
                                        {visibleMovements.map(movement => {
                                            const linkedGroupKey = movement.obligationId ? obligationGroupById.get(movement.obligationId) : undefined;
                                            const linkedObligation = movement.obligation ?? obligations.find(item => item.id === movement.obligationId);
                                            return (
                                                <li key={movement.id} className={`employee-detail-movement employee-detail-movement--${movement.type}`}>
                                                    <div className="employee-detail-movement__date">{dateOnly(movement.eventDate ?? movement.createdAt)}</div>
                                                    <div className="employee-detail-movement__body"><strong>{movement.type === "pagamento" ? "Pagamento realizado" : movementTypeLabels[movement.type]}</strong><p>{movement.description}</p>{linkedObligation ? <small className="employee-detail-payment-link">Obrigação relacionada: <strong>{linkedObligation.title}</strong> · Período: {formatCompetency(linkedObligation)} · Vencimento: {dateOnly(linkedObligation.dueDate)}</small> : movement.obligationId ? <small className="employee-detail-payment-link">Obrigação relacionada: ID {movement.obligationId}</small> : movementTypesRequiringObligation.has(movement.type) ? <small className="employee-detail-unlinked">Sem obrigação vinculada</small> : <small className="employee-detail-movement-context">Lançamento do vínculo, sem obrigação específica</small>}{linkedGroupKey && <a className="employee-detail-movement-competency-link" href={`#${obligationGroupAnchor(linkedGroupKey)}`}>Ver competência</a>}{movement.financialTransaction && <small className="employee-detail-transaction">Transação financeira: {movement.financialTransaction.description} · referência {dateOnly(movement.financialTransaction.referenceDate)}</small>}{movement.observations && <small className="employee-detail-movement-note">Observação: {movement.observations}</small>}</div>
                                                    <strong className="employee-detail-movement__value">{movement.value == null ? "—" : movement.type === "pagamento" ? "Pago " + currency(movement.value) : currency(movement.value)}</strong>
                                                </li>
                                            );
                                        })}
                                    </ol>
                                    <div className="employee-detail-pagination"><span>Página {movementCursorStack.length + 1}</span><button type="button" disabled={!movementCursorStack.length} onClick={() => { const stack = [...movementCursorStack]; const previous = stack.pop() || undefined; setMovementCursorStack(stack); setMovementCursor(previous); }}>Anterior</button><button type="button" disabled={!movementsQuery.data?.pagination.hasMore} onClick={() => { const next = movementsQuery.data?.pagination.nextCursor; if (next) { setMovementCursorStack(stack => [...stack, movementCursor ?? ""]); setMovementCursor(next); } }}>Próxima</button></div></>
                                )}
                            </section>
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
            {financialModal && <ObligationDetailsModal title={financialModal.title} obligations={financialModal.obligations} onClose={() => setFinancialModal(null)} />}
            {selectedObligation && <ObligationDetailsModal title={selectedObligation.title} obligations={[selectedObligation as ModalObligation]} onClose={() => setSelectedObligation(null)} />}
        </main>
    );
}

function ObligationMovementsList({ obligationId }: { obligationId: string }) {
    const [cursor, setCursor] = useState<string>();
    const [cursorStack, setCursorStack] = useState<string[]>([]);
    const query = useMovementsByFilters({
        obligationId,
        limit: 10,
        order: "desc",
        ...(cursor ? { cursor } : {})
    });
    const items = query.data?.data ?? [];

    return (
        <div className="employee-detail-obligation-movements">
            {query.isPending ? <p className="employee-detail-obligation-movements__empty">Carregando movimentações vinculadas…</p> : query.isError ? <p className="employee-detail-obligation-movements__empty">Não foi possível carregar as movimentações desta obrigação.</p> : items.length ? items.map(item => (
                <div className="employee-detail-obligation-movement" key={item.id}>
                    <span><strong>{item.type === "pagamento" ? "Pagamento realizado" : movementTypeLabels[item.type]}</strong><small>{dateOnly(item.eventDate ?? item.createdAt)} · {item.description}</small></span>
                    <strong>{item.value == null ? "—" : currency(item.value)}</strong>
                </div>
            )) : <p className="employee-detail-obligation-movements__empty">Ainda não há movimentações vinculadas a esta obrigação.</p>}
            {query.data && (cursorStack.length > 0 || query.data.pagination.hasMore) && <div className="employee-detail-pagination"><span>Página {cursorStack.length + 1} · {items.length} registros</span><button type="button" disabled={!cursorStack.length} onClick={() => { const stack=[...cursorStack]; const previous=stack.pop() || undefined; setCursorStack(stack); setCursor(previous); }}>Anterior</button><button type="button" disabled={!query.data.pagination.hasMore} onClick={() => { const next=query.data?.pagination.nextCursor; if(next){setCursorStack(stack=>[...stack,cursor ?? ""]);setCursor(next);} }}>Próxima</button></div>}
        </div>
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
