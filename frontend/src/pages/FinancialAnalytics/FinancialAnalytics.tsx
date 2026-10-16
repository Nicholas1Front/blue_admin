import { useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faArrowTrendDown,
    faArrowTrendUp,
    faCalendarDays,
    faChartLine,
    faWallet
} from "@fortawesome/free-solid-svg-icons";
import {
    Bar,
    CartesianGrid,
    Cell,
    ComposedChart,
    Line,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from "recharts";

import { AppHeader } from "../../components/AppHeader/AppHeader";
import { BackLink } from "../../components/BackLink/BackLink";
import {
    useMonthlyFinancialSummary,
    usePeriodFinancialSummary,
    useYearlyFinancialSummary
} from "../../modules/financial";
import type {
    FinancialCategorySummary,
    FinancialType
} from "../../modules/financial";
import "./FinancialAnalytics.css";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
});

const chartColors = ["#4d9bff", "#22c55e", "#f59e0b", "#a78bfa", "#38bdf8", "#f97316"];

type CategoryOption = {
    key: string;
    name: string;
};

function formatCurrency(value: number | string | null | undefined) {
    return currencyFormatter.format(Number(value ?? 0));
}

function formatDate(value: string) {
    return new Date(`${value.slice(0, 10)}T12:00:00`).toLocaleDateString("pt-BR");
}

function toLocalDateInput(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function getCategoryKey(category: Pick<FinancialCategorySummary, "name" | "type">) {
    return `${category.type}:${category.name}`;
}

function aggregateCategories(categories: FinancialCategorySummary[]) {
    const aggregated = new Map<string, FinancialCategorySummary>();

    categories.forEach((category) => {
        const key = getCategoryKey(category);
        const existing = aggregated.get(key);

        if (existing) {
            existing.value += category.value;
            return;
        }

        aggregated.set(key, { ...category });
    });

    return [...aggregated.values()];
}

function getCategoryOptions(categories: FinancialCategorySummary[], type: FinancialType): CategoryOption[] {
    return aggregateCategories(categories)
        .filter((category) => category.type === type && category.value > 0)
        .map((category) => ({
            key: getCategoryKey(category),
            name: category.name
        }))
        .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

function MetricCard({
    label,
    value,
    detail,
    tone
}: {
    label: string;
    value: string;
    detail: string;
    tone: "blue" | "green" | "red" | "violet";
}) {
    return (
        <article className={`analytics-metric analytics-metric--${tone}`}>
            <span className="analytics-metric__label">{label}</span>
            <strong className="analytics-metric__value">{value}</strong>
            <span className="analytics-metric__detail">{detail}</span>
        </article>
    );
}

function TypeToggle({
    value,
    onChange,
    label
}: {
    value: FinancialType;
    onChange: (type: FinancialType) => void;
    label: string;
}) {
    return (
        <div className="analytics-type-toggle" role="group" aria-label={label}>
            <button
                type="button"
                className={value === "income" ? "is-active" : ""}
                aria-pressed={value === "income"}
                onClick={() => onChange("income")}
            >
                Entrada
            </button>
            <button
                type="button"
                className={value === "expense" ? "is-active" : ""}
                aria-pressed={value === "expense"}
                onClick={() => onChange("expense")}
            >
                Saída
            </button>
        </div>
    );
}

function CategoryDistribution({
    categories,
    isLoading,
    error,
    onRetry,
    emptyMessage
}: {
    categories: FinancialCategorySummary[];
    isLoading: boolean;
    error: boolean;
    onRetry: () => void;
    emptyMessage: string;
}) {
    const visibleCategories = useMemo(() => {
        const sorted = aggregateCategories(categories)
            .filter((category) => category.value > 0)
            .sort((a, b) => b.value - a.value);

        if (sorted.length <= 6) return sorted;

        return [
            ...sorted.slice(0, 5),
            {
                name: "Outras categorias",
                type: sorted[0].type,
                description: null,
                value: sorted.slice(5).reduce((total, category) => total + category.value, 0)
            }
        ];
    }, [categories]);

    if (isLoading) {
        return <div className="analytics-chart-state">Carregando distribuição…</div>;
    }

    if (error) {
        return (
            <div className="analytics-chart-state" role="alert">
                <span>Não foi possível carregar os dados deste gráfico.</span>
                <button type="button" onClick={onRetry}>Tentar novamente</button>
            </div>
        );
    }

    if (visibleCategories.length === 0) {
        return <div className="analytics-chart-state">{emptyMessage}</div>;
    }

    return (
        <div className="analytics-distribution">
            <div className="analytics-distribution__chart">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={visibleCategories}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={66}
                            outerRadius={98}
                            paddingAngle={3}
                            stroke="none"
                        >
                            {visibleCategories.map((category, index) => (
                                <Cell key={`${category.type}-${category.name}-${index}`} fill={chartColors[index % chartColors.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                background: "var(--color-surface-raised)",
                                border: "1px solid var(--color-border)",
                                borderRadius: 10,
                                color: "var(--color-text)"
                            }}
                            formatter={(value) => formatCurrency(Number(value ?? 0))}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <div className="analytics-category-list">
                {visibleCategories.map((category, index) => (
                    <div className="analytics-category-row" key={`${category.type}-${category.name}-${index}`}>
                        <span className="analytics-category-row__name">
                            <i style={{ backgroundColor: chartColors[index % chartColors.length] }} aria-hidden="true" />
                            {category.name}
                        </span>
                        <strong>{formatCurrency(category.value)}</strong>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function FinancialAnalytics() {
    document.title = "Métricas e análises | Blue Admin";

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const today = toLocalDateInput(now);

    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [selectedMonth, setSelectedMonth] = useState(currentMonth);
    const [distributionType, setDistributionType] = useState<FinancialType>("expense");
    const [trendType, setTrendType] = useState<FinancialType>("expense");
    const [selectedCategoryKey, setSelectedCategoryKey] = useState("");

    const [periodDraftStart, setPeriodDraftStart] = useState(`${currentYear}-01-01`);
    const [periodDraftEnd, setPeriodDraftEnd] = useState(today);
    const [appliedPeriod, setAppliedPeriod] = useState({
        start: `${currentYear}-01-01`,
        end: today
    });
    const [periodType, setPeriodType] = useState<FinancialType>("expense");
    const [periodValidationError, setPeriodValidationError] = useState<string | null>(null);

    const availableYears = Array.from(
        { length: currentYear - 1999 },
        (_, index) => currentYear - index
    );
    const availableMonths = Array.from({ length: 12 }, (_, index) => ({
        value: index + 1,
        label: new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(new Date(2000, index, 1))
    }));

    const monthlyQuery = useMonthlyFinancialSummary({
        year: selectedYear,
        month: selectedMonth,
        limit: 10
    });
    const yearlyQuery = useYearlyFinancialSummary({ year: selectedYear });
    const periodQuery = usePeriodFinancialSummary({
        ...appliedPeriod,
        limit: 10
    });

    const monthly = monthlyQuery.data;
    const yearly = yearlyQuery.data;
    const period = periodQuery.data;

    const monthTitle = new Intl.DateTimeFormat("pt-BR", {
        month: "long",
        year: "numeric"
    }).format(new Date(selectedYear, selectedMonth - 1, 1));

    const yearlyChartData = (yearly?.monthsDetails ?? []).map((item) => ({
        month: new Date(selectedYear, item.month - 1, 1)
            .toLocaleDateString("pt-BR", { month: "short" })
            .replace(".", ""),
        incomes: item.incomesValue,
        expenses: item.expensesValue,
        balance: item.balanceValue
    }));

    const yearlyCategories = yearly?.categories ?? [];
    const distributionCategories = aggregateCategories(yearlyCategories)
        .filter((category) => category.type === distributionType && category.value > 0)
        .sort((a, b) => b.value - a.value);
    const trendCategoryOptions = getCategoryOptions(yearlyCategories, trendType);
    const effectiveCategoryKey = trendCategoryOptions.some((category) => category.key === selectedCategoryKey)
        ? selectedCategoryKey
        : trendCategoryOptions[0]?.key ?? "";
    const selectedCategory = trendCategoryOptions.find((category) => category.key === effectiveCategoryKey);
    const categoryTrendData = (yearly?.monthsDetails ?? []).map((month) => {
        const matchingCategories = aggregateCategories(month.categories);
        const category = matchingCategories.find((item) => getCategoryKey(item) === effectiveCategoryKey);

        return {
            month: new Date(selectedYear, month.month - 1, 1)
                .toLocaleDateString("pt-BR", { month: "short" })
                .replace(".", ""),
            value: category?.value ?? 0
        };
    });

    const periodCategories = aggregateCategories(period?.categories ?? [])
        .filter((category) => category.type === periodType && category.value > 0)
        .sort((a, b) => b.value - a.value);

    function handleYearChange(year: number) {
        if (!Number.isInteger(year) || year < 2000 || year > currentYear) return;

        setSelectedYear(year);
        if (year === currentYear && selectedMonth > currentMonth) {
            setSelectedMonth(currentMonth);
        }
        setSelectedCategoryKey("");
    }

    function handleApplyPeriod() {
        if (!periodDraftStart || !periodDraftEnd) {
            setPeriodValidationError("Informe a data inicial e a data final.");
            return;
        }

        if (periodDraftStart > periodDraftEnd) {
            setPeriodValidationError("A data inicial deve ser anterior ou igual à data final.");
            return;
        }

        setPeriodValidationError(null);
        setAppliedPeriod({ start: periodDraftStart, end: periodDraftEnd });
    }

    return (
        <main className="financial-analytics-page">
            <AppHeader />
            <nav className="page-back-row" aria-label="Navegação da página">
                <BackLink to="/financial" label="Voltar ao dashboard financeiro" />
            </nav>

            <section className="financial-analytics-content">
                <header className="analytics-heading">
                    <div className="analytics-heading__copy">
                        <span className="analytics-eyebrow">Gestão financeira · Indicadores</span>
                        <h1>Métricas e Análises</h1>
                        <p>
                            Explore os resultados da oficina, compare períodos e entenda como
                            entradas e saídas evoluem ao longo do tempo.
                        </p>
                    </div>

                    <div className="analytics-period-control">
                        <span className="analytics-period-control__label">
                            <FontAwesomeIcon icon={faCalendarDays} aria-hidden="true" />
                            Visão principal
                        </span>
                        <div className="analytics-period-control__picker">
                            <label className="analytics-period-field">
                                <span>Mês</span>
                                <select
                                    aria-label="Selecionar mês da análise"
                                    value={selectedMonth}
                                    onChange={(event) => setSelectedMonth(Number(event.target.value))}
                                >
                                    {availableMonths.map((month) => (
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
                            <label className="analytics-period-field">
                                <span>Ano</span>
                                <select
                                    aria-label="Selecionar ano da análise"
                                    value={selectedYear}
                                    onChange={(event) => handleYearChange(Number(event.target.value))}
                                >
                                    {availableYears.map((year) => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </select>
                            </label>
                        </div>
                    </div>
                </header>

                <section className="analytics-section" aria-labelledby="analytics-overview-title">
                    <div className="analytics-section-heading">
                        <div>
                            <span className="analytics-eyebrow">Visão anual e mensal</span>
                            <h2 id="analytics-overview-title">O panorama financeiro</h2>
                            <p>Compare o mês selecionado com o resultado acumulado de {selectedYear}.</p>
                        </div>
                    </div>

                    {(monthlyQuery.isError || yearlyQuery.isError) && (
                        <div className="analytics-alert" role="alert">
                            <span>
                                Não foi possível carregar parte dos indicadores.
                                {monthlyQuery.isError && " O resumo mensal apresenta erro."}
                                {yearlyQuery.isError && " O resumo anual apresenta erro."}
                            </span>
                            <div>
                                {monthlyQuery.isError && (
                                    <button type="button" onClick={() => void monthlyQuery.refetch()}>Tentar mês novamente</button>
                                )}
                                {yearlyQuery.isError && (
                                    <button type="button" onClick={() => void yearlyQuery.refetch()}>Tentar ano novamente</button>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="analytics-metrics">
                        <MetricCard
                            label="Entradas do mês"
                            value={monthlyQuery.isPending ? "Carregando…" : formatCurrency(monthly?.incomesValue)}
                            detail={monthTitle}
                            tone="green"
                        />
                        <MetricCard
                            label="Saídas do mês"
                            value={monthlyQuery.isPending ? "Carregando…" : formatCurrency(monthly?.expensesValue)}
                            detail={monthTitle}
                            tone="red"
                        />
                        <MetricCard
                            label="Saldo do mês"
                            value={monthlyQuery.isPending ? "Carregando…" : formatCurrency(monthly?.balanceValue)}
                            detail="Entradas menos saídas"
                            tone="blue"
                        />
                        <MetricCard
                            label="Entradas no ano"
                            value={yearlyQuery.isPending ? "Carregando…" : formatCurrency(yearly?.incomesValue)}
                            detail={String(selectedYear)}
                            tone="green"
                        />
                        <MetricCard
                            label="Saídas no ano"
                            value={yearlyQuery.isPending ? "Carregando…" : formatCurrency(yearly?.expensesValue)}
                            detail={String(selectedYear)}
                            tone="red"
                        />
                        <MetricCard
                            label="Saldo do ano"
                            value={yearlyQuery.isPending ? "Carregando…" : formatCurrency(yearly?.balanceValue)}
                            detail="Resultado anual acumulado"
                            tone="violet"
                        />
                    </div>

                    <div className="analytics-overview-grid">
                        <article className="analytics-panel analytics-panel--wide">
                            <header className="analytics-panel__header">
                                <div>
                                    <span className="analytics-panel__eyebrow">Movimento ao longo do ano</span>
                                    <h3>Entradas, saídas e saldo mensal</h3>
                                    <p>O saldo de cada mês é calculado pelas entradas menos as saídas daquele mês.</p>
                                </div>
                                <span className="analytics-panel__period">{selectedYear}</span>
                            </header>

                            {yearlyQuery.isPending ? (
                                <div className="analytics-chart-state">Carregando histórico anual…</div>
                            ) : yearlyQuery.isError ? (
                                <div className="analytics-chart-state" role="alert">O histórico anual não está disponível.</div>
                            ) : (
                                <div className="analytics-year-chart">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <ComposedChart data={yearlyChartData} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
                                            <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 5" vertical={false} />
                                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "var(--color-text-muted)", fontSize: 12 }} />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                width={76}
                                                tick={{ fill: "var(--color-text-muted)", fontSize: 11 }}
                                                tickFormatter={(value: number) => value === 0 ? "R$ 0" : `R$ ${Math.round(value / 1000)} mil`}
                                            />
                                            <Tooltip
                                                contentStyle={{ background: "var(--color-surface-raised)", border: "1px solid var(--color-border)", borderRadius: 10, color: "var(--color-text)" }}
                                                formatter={(value) => formatCurrency(Number(value ?? 0))}
                                            />
                                            <Bar dataKey="incomes" name="Entradas" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={18} />
                                            <Bar dataKey="expenses" name="Saídas" fill="#ef6464" radius={[4, 4, 0, 0]} maxBarSize={18} />
                                            <Line dataKey="balance" name="Saldo mensal" type="monotone" stroke="#4d9bff" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                            <footer className="analytics-chart-legend">
                                <span><i className="analytics-legend-dot analytics-legend-dot--income" /> Entradas</span>
                                <span><i className="analytics-legend-dot analytics-legend-dot--expense" /> Saídas</span>
                                <span><i className="analytics-legend-line" /> Saldo mensal</span>
                            </footer>
                        </article>

                        <article className="analytics-panel">
                            <header className="analytics-panel__header">
                                <div>
                                    <span className="analytics-panel__eyebrow">Distribuição anual</span>
                                    <h3>Categorias por tipo</h3>
                                    <p>Veja quais categorias concentram o maior volume em {selectedYear}.</p>
                                </div>
                            </header>
                            <TypeToggle
                                value={distributionType}
                                onChange={setDistributionType}
                                label="Tipo de categoria na distribuição anual"
                            />
                            <CategoryDistribution
                                categories={distributionCategories}
                                isLoading={yearlyQuery.isPending}
                                error={yearlyQuery.isError}
                                onRetry={() => void yearlyQuery.refetch()}
                                emptyMessage={distributionType === "income"
                                    ? "Nenhuma entrada por categoria neste ano."
                                    : "Nenhuma saída por categoria neste ano."}
                            />
                        </article>
                    </div>
                </section>

                <section className="analytics-section" aria-labelledby="analytics-category-title">
                    <div className="analytics-section-heading">
                        <div>
                            <span className="analytics-eyebrow">Evolução por categoria</span>
                            <h2 id="analytics-category-title">Acompanhe uma categoria mês a mês</h2>
                            <p>Selecione o tipo e a categoria para entender como os valores variaram em {selectedYear}.</p>
                        </div>
                    </div>

                    <article className="analytics-panel">
                        <div className="analytics-category-controls">
                            <TypeToggle value={trendType} onChange={(type) => {
                                setTrendType(type);
                                setSelectedCategoryKey("");
                            }} label="Tipo da categoria para evolução" />
                            <label className="analytics-period-field analytics-category-select">
                                <span>Categoria</span>
                                <select
                                    aria-label="Selecionar categoria para evolução"
                                    value={effectiveCategoryKey}
                                    onChange={(event) => setSelectedCategoryKey(event.target.value)}
                                    disabled={trendCategoryOptions.length === 0}
                                >
                                    {trendCategoryOptions.length === 0 ? (
                                        <option value="">Nenhuma categoria no ano</option>
                                    ) : trendCategoryOptions.map((category) => (
                                        <option key={category.key} value={category.key}>{category.name}</option>
                                    ))}
                                </select>
                            </label>
                        </div>

                        {yearlyQuery.isPending ? (
                            <div className="analytics-chart-state">Carregando evolução da categoria…</div>
                        ) : yearlyQuery.isError ? (
                            <div className="analytics-chart-state" role="alert">
                                Não foi possível carregar a evolução.
                                <button type="button" onClick={() => void yearlyQuery.refetch()}>Tentar novamente</button>
                            </div>
                        ) : !selectedCategory ? (
                            <div className="analytics-chart-state">
                                Não há categorias de {trendType === "income" ? "entrada" : "saída"} com movimentação em {selectedYear}.
                            </div>
                        ) : (
                            <>
                                <div className="analytics-category-trend-summary">
                                    <div>
                                        <span>{selectedCategory.name}</span>
                                        <strong>{formatCurrency(categoryTrendData.reduce((total, month) => total + month.value, 0))}</strong>
                                    </div>
                                    <span>Total no ano de {selectedYear}</span>
                                </div>
                                <div className="analytics-trend-chart">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <ComposedChart data={categoryTrendData} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                                            <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 5" vertical={false} />
                                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "var(--color-text-muted)", fontSize: 12 }} />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                width={76}
                                                tick={{ fill: "var(--color-text-muted)", fontSize: 11 }}
                                                tickFormatter={(value: number) => value === 0 ? "R$ 0" : `R$ ${Math.round(value / 1000)} mil`}
                                            />
                                            <Tooltip
                                                contentStyle={{ background: "var(--color-surface-raised)", border: "1px solid var(--color-border)", borderRadius: 10, color: "var(--color-text)" }}
                                                formatter={(value) => formatCurrency(Number(value ?? 0))}
                                            />
                                            <Bar dataKey="value" name={selectedCategory.name} fill={trendType === "income" ? "#22c55e" : "#ef6464"} radius={[5, 5, 0, 0]} maxBarSize={34} />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                </div>
                            </>
                        )}
                    </article>
                </section>

                <section className="analytics-section" aria-labelledby="analytics-period-title">
                    <div className="analytics-section-heading">
                        <div>
                            <span className="analytics-eyebrow">Período personalizado</span>
                            <h2 id="analytics-period-title">Analise um intervalo específico</h2>
                            <p>Compare entradas, saídas e categorias entre duas datas, sem alterar os filtros da visão anual.</p>
                        </div>
                    </div>

                    <article className="analytics-panel analytics-period-panel">
                        <form className="analytics-custom-period" onSubmit={(event) => {
                            event.preventDefault();
                            handleApplyPeriod();
                        }}>
                            <label className="analytics-period-field">
                                <span>Data inicial</span>
                                <input
                                    type="date"
                                    value={periodDraftStart}
                                    max={periodDraftEnd || undefined}
                                    onChange={(event) => setPeriodDraftStart(event.target.value)}
                                    required
                                />
                            </label>
                            <label className="analytics-period-field">
                                <span>Data final</span>
                                <input
                                    type="date"
                                    value={periodDraftEnd}
                                    min={periodDraftStart || undefined}
                                    onChange={(event) => setPeriodDraftEnd(event.target.value)}
                                    required
                                />
                            </label>
                            <button className="analytics-button" type="submit" disabled={periodQuery.isFetching}>
                                <FontAwesomeIcon icon={faChartLine} aria-hidden="true" />
                                {periodQuery.isFetching ? "Atualizando…" : "Aplicar período"}
                            </button>
                        </form>

                        {periodValidationError && (
                            <p className="analytics-validation-error" role="alert">{periodValidationError}</p>
                        )}
                        <p className="analytics-period-applied">
                            Período exibido: <strong>{formatDate(appliedPeriod.start)}</strong> até <strong>{formatDate(appliedPeriod.end)}</strong>
                        </p>

                        {periodQuery.isError && (
                            <div className="analytics-alert" role="alert">
                                <span>Não foi possível carregar o resumo do período personalizado.</span>
                                <button type="button" onClick={() => void periodQuery.refetch()}>Tentar novamente</button>
                            </div>
                        )}

                        <div className="analytics-metrics analytics-metrics--period">
                            <MetricCard
                                label="Entradas no período"
                                value={periodQuery.isPending ? "Carregando…" : formatCurrency(period?.incomesValue)}
                                detail="Receitas registradas"
                                tone="green"
                            />
                            <MetricCard
                                label="Saídas no período"
                                value={periodQuery.isPending ? "Carregando…" : formatCurrency(period?.expensesValue)}
                                detail="Despesas registradas"
                                tone="red"
                            />
                            <MetricCard
                                label="Saldo do período"
                                value={periodQuery.isPending ? "Carregando…" : formatCurrency(period?.balanceValue)}
                                detail="Entradas menos saídas"
                                tone="blue"
                            />
                        </div>

                        <div className="analytics-period-results">
                            <div className="analytics-period-results__categories">
                                <header className="analytics-panel__header">
                                    <div>
                                        <span className="analytics-panel__eyebrow">Composição do período</span>
                                        <h3>Categorias</h3>
                                    </div>
                                </header>
                                <TypeToggle value={periodType} onChange={setPeriodType} label="Tipo de categoria no período personalizado" />
                                <CategoryDistribution
                                    categories={periodCategories}
                                    isLoading={periodQuery.isPending}
                                    error={periodQuery.isError}
                                    onRetry={() => void periodQuery.refetch()}
                                    emptyMessage={periodType === "income"
                                        ? "Nenhuma entrada por categoria neste intervalo."
                                        : "Nenhuma saída por categoria neste intervalo."}
                                />
                            </div>

                            <div className="analytics-period-results__transactions">
                                <header className="analytics-panel__header">
                                    <div>
                                        <span className="analytics-panel__eyebrow">Movimentações</span>
                                        <h3>Lançamentos recentes</h3>
                                        <p>Lista limitada aos 10 registros retornados pela consulta.</p>
                                    </div>
                                </header>

                                {periodQuery.isPending ? (
                                    <div className="analytics-chart-state">Carregando lançamentos…</div>
                                ) : periodQuery.isError ? (
                                    <div className="analytics-chart-state">Os lançamentos deste intervalo não estão disponíveis.</div>
                                ) : (period?.transactions.length ?? 0) === 0 ? (
                                    <div className="analytics-chart-state">Nenhum lançamento encontrado neste intervalo.</div>
                                ) : (
                                    <div className="analytics-transactions-list">
                                        {period?.transactions.map((transaction) => (
                                            <div className="analytics-transaction-row" key={transaction.id}>
                                                <span className={`analytics-transaction-row__icon analytics-transaction-row__icon--${transaction.type}`} aria-hidden="true">
                                                    <FontAwesomeIcon icon={transaction.type === "income" ? faArrowTrendUp : faArrowTrendDown} />
                                                </span>
                                                <div className="analytics-transaction-row__details">
                                                    <strong>{transaction.description}</strong>
                                                    <span>{transaction.categoryName} <i aria-hidden="true" /> {formatDate(transaction.referenceDate)}</span>
                                                </div>
                                                <strong className={`analytics-transaction-row__value analytics-transaction-row__value--${transaction.type}`}>
                                                    {transaction.type === "income" ? "+" : "−"} {formatCurrency(transaction.value)}
                                                </strong>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </article>
                </section>

                <footer className="analytics-footnote">
                    <span className="analytics-footnote__icon" aria-hidden="true"><FontAwesomeIcon icon={faWallet} /></span>
                    <p>
                        Os indicadores refletem os lançamentos registrados. O saldo mensal representa o resultado
                        daquele mês; o saldo anual representa o resultado acumulado no ano. A lista do período
                        personalizado exibe somente os 10 lançamentos retornados pela consulta, enquanto os totais
                        e a distribuição consideram todo o intervalo.
                    </p>
                </footer>
            </section>
        </main>
    );
}
