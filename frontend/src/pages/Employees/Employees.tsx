import { useState, type FormEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faCalendarDays,
    faCircleExclamation,
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
    useEmployeeEngagementSummaries
} from "../../modules/employees";
import type {
    EngagementModality,
    EngagementStatus,
    EmployeeSummaryFilters
} from "../../modules/employees";
import "./Employees.css";

const PAGE_SIZE = 10;

const modalityLabels: Record<EngagementModality, string> = {
    CLT: "CLT",
    PJ: "PJ",
    Informal: "Informal",
    outros: "Outros"
};

const statusLabels: Record<EngagementStatus, string> = {
    trabalhando: "Trabalhando",
    afastado: "Afastado",
    "demitiu-se": "Pediu desligamento",
    demitido: "Desligado"
};

const movementLabels: Record<string, string> = {
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

function formatCurrency(value: number | string | null | undefined) {
    const amount = Number(value ?? 0);
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL"
    }).format(Number.isFinite(amount) ? amount : 0);
}

function formatDate(value?: string | null) {
    if (!value) return "Data não informada";
    const calendarDate = value.slice(0, 10);
    const [year, month, day] = calendarDate.split("-");
    if (year && month && day) return `${day}/${month}/${year}`;
    return "Data não informada";
}

function formatPeriod(month: number, year: number) {
    return new Intl.DateTimeFormat("pt-BR", {
        month: "long",
        year: "numeric"
    }).format(new Date(year, month - 1, 1));
}

export function Employees() {
    const now = new Date();
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear] = useState(now.getFullYear());
    const [draft, setDraft] = useState({
        name: "",
        document: "",
        status: "",
        modality: ""
    });
    const [filters, setFilters] = useState<EmployeeSummaryFilters>({
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        limit: PAGE_SIZE
    });
    const [summaryCursor, setSummaryCursor] = useState<string | undefined>();
    const [summaryCursorHistory, setSummaryCursorHistory] = useState<string[]>([]);
    const [movementCursor, setMovementCursor] = useState<string | undefined>();
    const [movementCursorHistory, setMovementCursorHistory] = useState<string[]>([]);

    const dashboard = useEmployeeDashboard({
        month,
        year,
        movementsLimit: 8,
        ...(movementCursor ? { movementsCursor: movementCursor } : {})
    });
    const summaries = useEmployeeEngagementSummaries({
        ...filters,
        ...(summaryCursor ? { cursor: summaryCursor } : {})
    });

    function submitFilters(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const nextFilters: EmployeeSummaryFilters = {
            month,
            year,
            limit: PAGE_SIZE,
            ...(draft.name.trim() ? { name: draft.name.trim() } : {}),
            ...(draft.document.trim() ? { document: draft.document.trim() } : {}),
            ...(draft.status ? { status: draft.status as EngagementStatus } : {}),
            ...(draft.modality ? { modality: draft.modality as EngagementModality } : {})
        };
        setFilters(nextFilters);
        setSummaryCursor(undefined);
        setSummaryCursorHistory([]);
    }

    function changePeriod(nextMonth: number, nextYear: number) {
        setMonth(nextMonth);
        setYear(nextYear);
        setFilters(current => ({ ...current, month: nextMonth, year: nextYear }));
        setSummaryCursor(undefined);
        setSummaryCursorHistory([]);
        setMovementCursor(undefined);
        setMovementCursorHistory([]);
    }

    function clearFilters() {
        setDraft({ name: "", document: "", status: "", modality: "" });
        setFilters({ month, year, limit: PAGE_SIZE });
        setSummaryCursor(undefined);
        setSummaryCursorHistory([]);
    }

    function nextSummaryPage() {
        const next = summaries.data?.pagination.nextCursor;
        if (!next) return;
        setSummaryCursorHistory(current => [...current, summaryCursor ?? ""]);
        setSummaryCursor(next);
    }

    function previousSummaryPage() {
        if (summaryCursorHistory.length === 0) return;
        const previous = summaryCursorHistory[summaryCursorHistory.length - 1];
        setSummaryCursorHistory(current => current.slice(0, -1));
        setSummaryCursor(previous || undefined);
    }

    function nextMovementPage() {
        const next = dashboard.data?.recentMovements.pagination.nextCursor;
        if (!next) return;
        setMovementCursorHistory(current => [...current, movementCursor ?? ""]);
        setMovementCursor(next);
    }

    function previousMovementPage() {
        if (movementCursorHistory.length === 0) return;
        const previous = movementCursorHistory[movementCursorHistory.length - 1];
        setMovementCursorHistory(current => current.slice(0, -1));
        setMovementCursor(previous || undefined);
    }

    const totals = dashboard.data?.totals;
    const employees = summaries.data?.data ?? [];
    const movements = dashboard.data?.recentMovements.data ?? [];
    const years = Array.from({ length: 5 }, (_, index) => now.getFullYear() - 2 + index);

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
                        <p>
                            Acompanhe vínculos, obrigações e movimentações da equipe
                            em um só lugar.
                        </p>
                    </div>

                    <div className="employees-period">
                        <label>
                            <span>Mês</span>
                            <select
                                value={month}
                                onChange={event => changePeriod(Number(event.target.value), year)}
                            >
                                {Array.from({ length: 12 }, (_, index) => index + 1).map(value => (
                                    <option value={value} key={value}>
                                        {new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(new Date(2000, value - 1, 1))}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label>
                            <span>Ano</span>
                            <select
                                value={year}
                                onChange={event => changePeriod(month, Number(event.target.value))}
                            >
                                {years.map(value => <option key={value} value={value}>{value}</option>)}
                            </select>
                        </label>
                    </div>
                </header>

                <p className="employees-period-caption">
                    Indicadores e registros de {formatPeriod(month, year)}.
                </p>

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
                    <article className="employees-metric employees-metric--violet">
                        <div className="employees-metric__top">
                            <span>Obrigações abertas</span>
                            <span className="employees-metric__icon"><FontAwesomeIcon icon={faWallet} /></span>
                        </div>
                        <strong>{dashboard.isPending ? "—" : totals?.openObligations ?? 0}</strong>
                        <small>Competências ainda em aberto</small>
                    </article>
                    <article className="employees-metric employees-metric--amber">
                        <div className="employees-metric__top">
                            <span>Saldo em aberto</span>
                            <span className="employees-metric__icon"><FontAwesomeIcon icon={faCircleExclamation} /></span>
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
                    <article className="employees-metric employees-metric--green">
                        <div className="employees-metric__top">
                            <span>Pagamentos registrados</span>
                            <span className="employees-metric__icon"><FontAwesomeIcon icon={faCalendarDays} /></span>
                        </div>
                        <strong>{dashboard.isPending ? "—" : formatCurrency(totals?.paymentsRecordedThisMonth)}</strong>
                        <small>Registros no período selecionado</small>
                    </article>
                </section>

                <section className="employees-panel">
                    <header className="employees-panel__header">
                        <div>
                            <span className="employees-eyebrow">Equipe</span>
                            <h2>Resumo por funcionário</h2>
                            <p>Consulte os saldos e ocorrências do período por vínculo.</p>
                        </div>
                    </header>

                    <form className="employees-filters" onSubmit={submitFilters}>
                        <label className="employees-search">
                            <span>Nome</span>
                            <span className="employees-search__field">
                                <FontAwesomeIcon icon={faMagnifyingGlass} />
                                <input
                                    value={draft.name}
                                    onChange={event => setDraft(current => ({ ...current, name: event.target.value }))}
                                    placeholder="Buscar funcionário"
                                />
                            </span>
                        </label>
                        <label>
                            <span>Documento</span>
                            <input
                                value={draft.document}
                                onChange={event => setDraft(current => ({ ...current, document: event.target.value }))}
                                placeholder="CPF ou CNPJ"
                            />
                        </label>
                        <label>
                            <span>Status do vínculo</span>
                            <select
                                value={draft.status}
                                onChange={event => setDraft(current => ({ ...current, status: event.target.value }))}
                            >
                                <option value="">Todos</option>
                                {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                            </select>
                        </label>
                        <label>
                            <span>Modalidade</span>
                            <select
                                value={draft.modality}
                                onChange={event => setDraft(current => ({ ...current, modality: event.target.value }))}
                            >
                                <option value="">Todas</option>
                                {Object.entries(modalityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                            </select>
                        </label>
                        <div className="employees-filter-actions">
                            <button className="employees-button employees-button--primary" type="submit">Pesquisar</button>
                            <button className="employees-button" type="button" onClick={clearFilters}>Limpar</button>
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
                            {employees.map(employee => (
                                <article className="employees-row" key={employee.id}>
                                    <div className="employees-row__identity">
                                        <span className="employees-row__avatar"><FontAwesomeIcon icon={faUsers} /></span>
                                        <div>
                                            <strong>{employee.name}</strong>
                                            <small>{employee.document || "Documento não informado"}</small>
                                        </div>
                                    </div>
                                    <div className="employees-row__numbers">
                                        <span><small>Saldo em aberto</small><strong>{formatCurrency(employee.totalOutstanding)}</strong></span>
                                        <span><small>Obrigações</small><strong>{employee.openObligations}</strong></span>
                                        <span><small>Faltas</small><strong>{employee.absencesThisMonth}</strong></span>
                                        <span><small>Atrasos</small><strong>{employee.tardinessThisMonth}</strong></span>
                                    </div>
                                    <div className="employees-row__engagements">
                                        {employee.engagements.map(engagement => (
                                            <div className="employees-engagement" key={engagement.id}>
                                                <span className={`employees-status employees-status--${engagement.status === "trabalhando" ? "active" : "inactive"}`}>
                                                    {statusLabels[engagement.status]}
                                                </span>
                                                <span>{modalityLabels[engagement.modality]}</span>
                                                <span>{engagement.currentSalary == null ? "Salário não informado" : formatCurrency(engagement.currentSalary)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}

                    {summaries.data && summaries.data.data.length > 0 && (
                        <nav className="employees-pagination" aria-label="Paginação dos funcionários">
                            <span>{summaryCursorHistory.length + 1}ª página</span>
                            <div>
                                <button type="button" disabled={summaryCursorHistory.length === 0} onClick={previousSummaryPage}>Anterior</button>
                                <button type="button" disabled={!summaries.data.pagination.hasMore} onClick={nextSummaryPage}>Próxima</button>
                            </div>
                        </nav>
                    )}
                </section>

                <section className="employees-panel">
                    <header className="employees-panel__header">
                        <div>
                            <span className="employees-eyebrow">Registros recentes</span>
                            <h2>Movimentações do mês</h2>
                            <p>Eventos registrados em {formatPeriod(month, year)}, do mais recente ao mais antigo.</p>
                        </div>
                    </header>

                    {dashboard.isPending ? (
                        <div className="employees-state"><span className="employees-spinner" /> Carregando movimentações…</div>
                    ) : dashboard.isError ? (
                        <div className="employees-state" role="alert">
                            <strong>Não foi possível carregar as movimentações.</strong>
                            <button type="button" onClick={() => void dashboard.refetch()}>Tentar novamente</button>
                        </div>
                    ) : movements.length === 0 ? (
                        <div className="employees-state">
                            <span className="employees-state__icon"><FontAwesomeIcon icon={faCalendarDays} /></span>
                            <strong>Nenhuma movimentação no período</strong>
                            <p>Os registros feitos no mês selecionado aparecerão aqui.</p>
                        </div>
                    ) : (
                        <div className="employees-movements">
                            {movements.map(movement => (
                                <article className="employees-movement" key={movement.id}>
                                    <span className="employees-movement__date">{formatDate(movement.eventDate)}</span>
                                    <div className="employees-movement__copy">
                                        <strong>{movement.engagement.employee.name}</strong>
                                        <span>{movementLabels[movement.type] ?? movement.type} · {movement.description}</span>
                                        {movement.obligation && <small>{movement.obligation.title}</small>}
                                    </div>
                                    <strong className="employees-movement__value">
                                        {movement.value == null ? "—" : formatCurrency(movement.value)}
                                    </strong>
                                </article>
                            ))}
                        </div>
                    )}

                    {dashboard.data && dashboard.data.recentMovements.data.length > 0 && (
                        <nav className="employees-pagination" aria-label="Paginação das movimentações">
                            <span>{movementCursorHistory.length + 1}ª página</span>
                            <div>
                                <button type="button" disabled={movementCursorHistory.length === 0} onClick={previousMovementPage}>Anterior</button>
                                <button type="button" disabled={!dashboard.data.recentMovements.pagination.hasMore} onClick={nextMovementPage}>Próxima</button>
                            </div>
                        </nav>
                    )}
                </section>
            </section>
        </main>
    );
}
