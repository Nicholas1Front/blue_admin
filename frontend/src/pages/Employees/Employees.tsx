import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faCalendarDays,
    faClock,
    faMagnifyingGlass,
    faRotate,
    faUsers,
    faWallet
} from "@fortawesome/free-solid-svg-icons";

import { AppHeader } from "../../components/AppHeader/AppHeader";
import { BackLink } from "../../components/BackLink/BackLink";
import {
    useEmployeeDashboard,
    useEmployeeEngagementSummaries,
    useMovementsByFilters
} from "../../modules/employees";
import type {
    EmployeeSummaryFilters,
    EmployeeMovementType,
    EngagementModality,
    EngagementStatus,
    FindMovementsFilters,
    ObligationType
} from "../../modules/employees";
import "./Employees.css";

const PAGE_SIZE = 10;

const modalityLabels: Record<EngagementModality, string> = {
    CLT: "CLT",
    PJ: "PJ",
    Informal: "Informal",
    outros: "Outros"
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

const statusLabels: Record<EngagementStatus, string> = {
    trabalhando: "Trabalhando",
    afastado: "Afastado",
    "demitiu-se": "Pediu desligamento",
    demitido: "Desligado"
};

const movementLabels: Record<EmployeeMovementType, string> = {
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

const movementStyles: Record<EmployeeMovementType, string> = {
    falta: "absence",
    atraso: "delay",
    saida_antecipada: "early-exit",
    bonificacao: "bonus",
    decimo_terceiro: "thirteenth",
    ferias: "vacation",
    rescisao: "termination",
    ajuste: "adjustment",
    anotacao: "note",
    pagamento: "payment"
};

function formatCurrency(value: number | string | null | undefined) {
    const amount = Number(value ?? 0);
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL"
    }).format(Number.isFinite(amount) ? amount : 0);
}

function formatDate(value?: string | null) {
    if (!value) return "Data não informada";
    const [year, month, day] = value.slice(0, 10).split("-");
    return year && month && day ? `${day}/${month}/${year}` : "Data não informada";
}

function formatPeriod(month: number, year: number) {
    return new Intl.DateTimeFormat("pt-BR", {
        month: "long",
        year: "numeric"
    }).format(new Date(year, month - 1, 1));
}

function formatCompetency(obligation?: {
    title?: string;
    referenceStart?: string | null;
    referenceEnd?: string | null;
} | null) {
    if (!obligation) return "Sem competência vinculada";
    const toMonth = (value?: string | null) => {
        if (!value) return null;
        const [year, month] = value.slice(0, 10).split("-");
        if (!year || !month) return null;
        return new Intl.DateTimeFormat("pt-BR", { month: "short", year: "numeric" })
            .format(new Date(Number(year), Number(month) - 1, 1));
    };
    const start = toMonth(obligation.referenceStart);
    const end = toMonth(obligation.referenceEnd);
    if (start && end && start !== end) return `${start} – ${end}`;
    if (start || end) return start ?? end ?? obligation.title ?? "Competência";
    return obligation.title ?? "Competência";
}

function getMonthlyGuidance(month: number, year: number) {
    const previousMonthDate = new Date(year, month - 2, 1);
    const previousPeriod = formatPeriod(previousMonthDate.getMonth() + 1, previousMonthDate.getFullYear());
    let message = `Este mês, confira o pagamento referente ao trabalho realizado em ${previousPeriod}.`;

    if (month === 1) {
        message += " Como estamos iniciando um novo ano, revise também as competências que ficaram no fechamento do ano anterior.";
    }
    if (month === 6) {
        message += " Aproveite para verificar a situação e o planejamento das férias da equipe.";
    }
    if (month === 11) {
        message += " Confira também as obrigações e a parcela do 13º salário prevista para este período.";
    }
    if (month === 12) {
        message += " Revise o fechamento anual, as obrigações de fim de ano e o que ficará pendente para janeiro.";
    }

    return { previousPeriod, message };
}

function getMonthDateRange(month: number, year: number) {
    return {
        eventDateFrom: new Date(Date.UTC(year, month - 1, 1)).toISOString(),
        eventDateTo: new Date(Date.UTC(year, month, 0, 23, 59, 59, 999)).toISOString()
    };
}

export function Employees() {
    useEffect(() => {
        document.title = "Funcionários | Blue Admin";
        return () => { document.title = "Blue Admin"; };
    }, []);

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const [draft, setDraft] = useState({
        name: "",
        document: "",
        status: "",
        modality: ""
    });
    const [filters, setFilters] = useState<EmployeeSummaryFilters>({
        month: currentMonth,
        year: currentYear,
        limit: PAGE_SIZE
    });
    const [movementName, setMovementName] = useState("");
    const [movementType, setMovementType] = useState<EmployeeMovementType | "">("");
    const [movementMonth, setMovementMonth] = useState(currentMonth);
    const [movementYear, setMovementYear] = useState(currentYear);
    const [movementCursor, setMovementCursor] = useState<string | undefined>();
    const [movementCursorHistory, setMovementCursorHistory] = useState<string[]>([]);

    const dashboard = useEmployeeDashboard({ movementsLimit: 1 });
    const summaries = useEmployeeEngagementSummaries(filters);
    const movementDateRange = getMonthDateRange(movementMonth, movementYear);
    const movementFilters: FindMovementsFilters = {
        ...movementDateRange,
        limit: PAGE_SIZE,
        order: "desc",
        ...(movementName.trim() ? { employeeName: movementName.trim() } : {}),
        ...(movementType ? { type: movementType } : {}),
        ...(movementCursor ? { cursor: movementCursor } : {})
    };
    const movementsQuery = useMovementsByFilters(movementFilters);
    const employees = summaries.data?.data ?? [];
    const movements = movementsQuery.data?.data ?? [];
    const totals = dashboard.data?.totals;
    const years = Array.from({ length: 6 }, (_, index) => currentYear - 4 + index);
    const monthlyGuidance = getMonthlyGuidance(currentMonth, currentYear);

    function submitFilters(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setFilters({
            month: currentMonth,
            year: currentYear,
            limit: PAGE_SIZE,
            ...(draft.name.trim() ? { name: draft.name.trim() } : {}),
            ...(draft.document.trim() ? { document: draft.document.trim() } : {}),
            ...(draft.status ? { status: draft.status as EngagementStatus } : {}),
            ...(draft.modality ? { modality: draft.modality as EngagementModality } : {})
        });
    }

    function clearEmployeeFilters() {
        setDraft({ name: "", document: "", status: "", modality: "" });
        setFilters({ month: currentMonth, year: currentYear, limit: PAGE_SIZE });
    }

    function changeMovementFilter(change: () => void) {
        change();
        setMovementCursor(undefined);
        setMovementCursorHistory([]);
    }

    function nextMovementPage() {
        const next = movementsQuery.data?.pagination.nextCursor;
        if (!next) return;
        setMovementCursorHistory(current => [...current, movementCursor ?? ""]);
        setMovementCursor(next);
    }

    function previousMovementPage() {
        if (!movementCursorHistory.length) return;
        const previous = movementCursorHistory[movementCursorHistory.length - 1];
        setMovementCursorHistory(current => current.slice(0, -1));
        setMovementCursor(previous || undefined);
    }

    return (
        <main className="employees-page">
            <title>Funcionários | Blue Admin</title>
            <AppHeader />
            <nav className="page-back-row">
                <BackLink />
            </nav>

            <section className="employees-content">
                <header className="employees-heading">
                    <div className="employees-heading__copy">
                        <span className="employees-eyebrow">Gestão de pessoas</span>
                        <h1>Funcionários.</h1>
                        <p>Acompanhe vínculos, obrigações e movimentações da equipe em um só lugar.</p>
                    </div>
                    <div className="employees-current-period">
                        <FontAwesomeIcon icon={faCalendarDays} />
                        <span>Visão atual</span>
                        <strong>{formatPeriod(currentMonth, currentYear)}</strong>
                    </div>
                </header>

                <p className="employees-period-caption">
                    Indicadores e resumo sempre acompanham o mês atual.
                </p>

                <aside className="employees-monthly-guidance" aria-label="Orientação mensal">
                    <span className="employees-monthly-guidance__icon"><FontAwesomeIcon icon={faCalendarDays} /></span>
                    <div>
                        <span className="employees-eyebrow">Atenção neste mês</span>
                        <strong>Rotina de {formatPeriod(currentMonth, currentYear)}</strong>
                        <p>{monthlyGuidance.message}</p>
                    </div>
                </aside>

                {dashboard.isError && (
                    <div className="employees-alert" role="alert">
                        <span>Não foi possível carregar os indicadores do período.</span>
                        <button type="button" onClick={() => void dashboard.refetch()}>
                            <FontAwesomeIcon icon={faRotate} /> Tentar novamente
                        </button>
                    </div>
                )}

                <section className="employees-metrics" aria-label="Indicadores de funcionários">
                    <article className="employees-metric employees-metric--blue">
                        <div className="employees-metric__top">
                            <span>Funcionários</span>
                            <span className="employees-metric__icon"><FontAwesomeIcon icon={faUsers} /></span>
                        </div>
                        <strong>{dashboard.isPending ? "—" : totals?.employees ?? 0}</strong>
                        <small>Funcionários cadastrados</small>
                    </article>
                    <article className="employees-metric employees-metric--amber">
                        <div className="employees-metric__top">
                            <span>Saldo em aberto</span>
                            <span className="employees-metric__icon"><FontAwesomeIcon icon={faWallet} /></span>
                        </div>
                        <strong>{dashboard.isPending ? "—" : formatCurrency(totals?.totalOpenValue)}</strong>
                        <small>Valor reconhecido e não liquidado</small>
                    </article>
                    <article className="employees-metric employees-metric--red">
                        <div className="employees-metric__top">
                            <span>Vencido</span>
                            <span className="employees-metric__icon"><FontAwesomeIcon icon={faClock} /></span>
                        </div>
                        <strong>{dashboard.isPending ? "—" : formatCurrency(totals?.overdueValue)}</strong>
                        <small>Obrigações com vencimento anterior</small>
                    </article>
                </section>

                <section className="employees-panel">
                    <header className="employees-panel__header">
                        <div>
                            <span className="employees-eyebrow">Equipe</span>
                            <h2>Resumo por funcionário</h2>
                            <p>Veja as obrigações pendentes por nome e competência, além dos saldos e ocorrências.</p>
                        </div>
                    </header>

                    <form className="employees-filters employees-filters--employees" onSubmit={submitFilters}>
                        <label className="employees-search">
                            <span>Nome</span>
                            <span className="employees-search__field">
                                <FontAwesomeIcon icon={faMagnifyingGlass} />
                                <input value={draft.name} onChange={event => setDraft(current => ({ ...current, name: event.target.value }))} placeholder="Buscar funcionário" />
                            </span>
                        </label>
                        <label>
                            <span>Documento</span>
                            <input value={draft.document} onChange={event => setDraft(current => ({ ...current, document: event.target.value }))} placeholder="CPF ou CNPJ" />
                        </label>
        <label>
                            <span>Status do vínculo</span>
                            <select value={draft.status} onChange={event => setDraft(current => ({ ...current, status: event.target.value }))}>
                                <option value="">Todos</option>
                                {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                            </select>
                        </label>
                        <label>
                            <span>Modalidade</span>
                            <select value={draft.modality} onChange={event => setDraft(current => ({ ...current, modality: event.target.value }))}>
                                <option value="">Todas</option>
                                {Object.entries(modalityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                            </select>
                        </label>
                        <div className="employees-filter-actions">
                            <button className="employees-button employees-button--primary" type="submit">Pesquisar</button>
                            <button className="employees-button" type="button" onClick={clearEmployeeFilters}>Limpar</button>
                        </div>
                    </form>

                    {summaries.isPending ? (
                        <div className="employees-state"><span className="employees-spinner" /> Carregando funcionários…</div>
                    ) : summaries.isError ? (
                        <div className="employees-state" role="alert">
                            <strong>Não foi possível carregar os funcionários.</strong>
                            <button type="button" onClick={() => void summaries.refetch()}>Tentar novamente</button>
                        </div>
                    ) : employees.length === 0 ? (
                        <div className="employees-state">
                            <span className="employees-state__icon"><FontAwesomeIcon icon={faUsers} /></span>
                            <strong>Nenhum funcionário encontrado</strong>
                            <p>Revise os filtros ou cadastre um funcionário para começar.</p>
                        </div>
                    ) : (
                        <div className="employees-list">
                            {employees.map(employee => {
                                const obligations = employee.engagements.flatMap(engagement => engagement.obligations);
                                const visibleObligations = obligations.slice(0, 3);
                                const otherObligations = Math.max(0, obligations.length - visibleObligations.length);
                                return (
                                    <Link className="employees-row" key={employee.id} to={`/employees/${encodeURIComponent(employee.id)}`} aria-label={`Abrir ficha de ${employee.name}`}>
                                        <div className="employees-row__top">
                                            <div className="employees-row__identity">
                                                <span className="employees-row__avatar"><FontAwesomeIcon icon={faUsers} /></span>
                                                <div>
                                                    <strong>{employee.name}</strong>
                                                    <small>{employee.document || "Documento não informado"}</small>
                                                </div>
                                            </div>
                                            <div className="employees-row__numbers">
                                                <span className="employees-row__balance">
                                                    <small>Saldo total em aberto</small>
                                                    <strong>{formatCurrency(employee.totalOutstanding)}</strong>
                                                </span>
                                                <span>
                                                    <small>Faltas no mês</small>
                                                    <strong>{employee.absencesThisMonth}</strong>
                                                </span>
                                                <span>
                                                    <small>Atrasos no mês</small>
                                                    <strong>{employee.tardinessThisMonth}</strong>
                                                </span>
                                            </div>
                                        </div>

                                        <div className="employees-row__engagements" aria-label="Vínculos">
                                            {employee.engagements.map(engagement => (
                                                <div className="employees-engagement" key={engagement.id}>
                                                    <span className={`employees-status employees-status--${engagement.status === "trabalhando" ? "active" : "inactive"}`}>{statusLabels[engagement.status]}</span>
                                                    <span className="employees-engagement__modality">{modalityLabels[engagement.modality]}</span>
                                                    <span className="employees-engagement__salary">
                                                        {engagement.currentSalary == null ? "Salário não informado" : `Salário: ${formatCurrency(engagement.currentSalary)}`}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="employees-row__obligations">
                                            <div className="employees-row__section-heading">
                                                <small className="employees-row__section-label">Obrigações pendentes</small>
                                                {obligations.length > 0 && <span>{obligations.length} {obligations.length === 1 ? "item" : "itens"}</span>}
                                            </div>
                                            {visibleObligations.length ? (
                                                <div className="employees-obligation-list">
                                                    {visibleObligations.map(obligation => (
                                                        <div className="employees-obligation-card" key={obligation.id}>
                                                            <div className="employees-obligation-card__heading">
                                                                <span className={`employees-obligation-card__type employees-obligation-card__type--${obligation.type}`}>
                                                                    {obligationTypeLabels[obligation.type]}
                                                                </span>
                                                                <strong title={obligation.title}>{obligation.title}</strong>
                                                            </div>
                                                            <small className="employees-obligation-card__reference">
                                                                <FontAwesomeIcon icon={faCalendarDays} />
                                                                {formatCompetency(obligation)}
                                                            </small>
                                                            <div className="employees-obligation-card__amounts">
                                                                <span>
                                                                    <small>Valor da obrigação</small>
                                                                    <strong>{formatCurrency(obligation.finalValue)}</strong>
                                                                </span>
                                                                <span className="employees-obligation-card__balance">
                                                                    <small>Saldo a pagar</small>
                                                                    <strong>{formatCurrency(obligation.outstandingValue)}</strong>
                                                                </span>
                                                            </div>
                                                            {obligation.paidValue > 0 && (
                                                                <small className="employees-obligation-card__paid">
                                                                    Já alocado: {formatCurrency(obligation.paidValue)}
                                                                </small>
                                                            )}
                                                        </div>
                                                    ))}
                                                    {otherObligations > 0 && (
                                                        <span className="employees-obligation-more">+ {otherObligations} outras obrigações</span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="employees-no-obligations">Nenhuma obrigação pendente</span>
                                            )}
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}

                    {summaries.data && summaries.data.data.length > 0 && (
                        <nav className="employees-pagination" aria-label="Paginação dos funcionários">
                            <span>{summaries.data.pagination.limit} por página</span>
                            <div>
                                <button type="button" disabled={!filters.cursor} onClick={() => setFilters(current => ({ ...current, cursor: undefined }))}>Voltar ao início</button>
                                <button type="button" disabled={!summaries.data.pagination.hasMore} onClick={() => setFilters(current => ({ ...current, cursor: summaries.data?.pagination.nextCursor ?? undefined }))}>Próxima</button>
                            </div>
                        </nav>
                    )}
                </section>

                <section className="employees-panel">
                    <header className="employees-panel__header">
                        <div>
                            <span className="employees-eyebrow">Histórico</span>
                            <h2>Movimentações</h2>
                            <p>Consulte lançamentos de qualquer mês e ano. Cada registro identifica seu tipo e a competência relacionada.</p>
                        </div>
                    </header>

                    <div className="employees-movement-filters" role="search" aria-label="Filtros de movimentações">
                        <label className="employees-movement-search">
                            <span>Funcionário</span>
                            <span className="employees-search__field">
                                <FontAwesomeIcon icon={faMagnifyingGlass} />
                                <input value={movementName} onChange={event => changeMovementFilter(() => setMovementName(event.target.value))} placeholder="Buscar pelo nome" />
                            </span>
                        </label>
                        <label>
                            <span>Tipo de lançamento</span>
                            <select value={movementType} onChange={event => changeMovementFilter(() => setMovementType(event.target.value as EmployeeMovementType | ""))}>
                                <option value="">Todos os tipos</option>
                                {Object.entries(movementLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                            </select>
                        </label>
                        <label>
                            <span>Mês</span>
                            <select value={movementMonth} onChange={event => changeMovementFilter(() => setMovementMonth(Number(event.target.value)))}>
                                {Array.from({ length: 12 }, (_, index) => index + 1).map(value => <option key={value} value={value}>{new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(new Date(2000, value - 1, 1))}</option>)}
                            </select>
                        </label>
                        <label>
                            <span>Ano</span>
                            <select value={movementYear} onChange={event => changeMovementFilter(() => setMovementYear(Number(event.target.value)))}>
                                {years.map(value => <option key={value} value={value}>{value}</option>)}
                            </select>
                        </label>
                    </div>

                    {movementsQuery.isPending ? (
                        <div className="employees-state"><span className="employees-spinner" /> Carregando movimentações…</div>
                    ) : movementsQuery.isError ? (
                        <div className="employees-state" role="alert">
                            <strong>Não foi possível carregar as movimentações.</strong>
                            <button type="button" onClick={() => void movementsQuery.refetch()}>Tentar novamente</button>
                        </div>
                    ) : movements.length === 0 ? (
                        <div className="employees-state">
                            <span className="employees-state__icon"><FontAwesomeIcon icon={faCalendarDays} /></span>
                            <strong>Nenhuma movimentação encontrada</strong>
                            <p>Não há lançamentos para os filtros selecionados.</p>
                        </div>
                    ) : (
                        <div className="employees-movements">
                            {movements.map(movement => (
                                <article className={`employees-movement employees-movement--${movementStyles[movement.type]}`} key={movement.id}>
                                    <span className="employees-movement__date">{formatDate(movement.eventDate)}</span>
                                    <div className="employees-movement__copy">
                                        <div className="employees-movement__title-row">
                                            <strong>{movement.engagement.employee.name}</strong>
                                            <span className={`employees-movement__type employees-movement__type--${movementStyles[movement.type]}`}>{movementLabels[movement.type]}</span>
                                        </div>
                                        <span>{movement.description}</span>
                                        <small className="employees-movement__competency">
                                            <FontAwesomeIcon icon={faCalendarDays} /> Competência: {formatCompetency(movement.obligation)}
                                        </small>
                                    </div>
                                    <strong className="employees-movement__value">{movement.value == null ? "—" : formatCurrency(movement.value)}</strong>
                                </article>
                            ))}
                        </div>
                    )}

                    {movementsQuery.data && movementsQuery.data.data.length > 0 && (
                        <nav className="employees-pagination" aria-label="Paginação das movimentações">
                            <span>{movementCursorHistory.length + 1}ª página</span>
                            <div>
                                <button type="button" disabled={!movementCursorHistory.length} onClick={previousMovementPage}>Anterior</button>
                                <button type="button" disabled={!movementsQuery.data.pagination.hasMore} onClick={nextMovementPage}>Próxima</button>
                            </div>
                        </nav>
                    )}
                </section>
            </section>
        </main>
    );
}
