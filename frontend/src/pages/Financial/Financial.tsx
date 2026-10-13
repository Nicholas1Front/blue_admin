import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
    faArrowDown,
    faArrowTrendDown,
    faArrowTrendUp,
    faCalendarDays,
    faWallet
} from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";
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
    useMonthlyExpensesOverview,
    useYearlyFinancialSummary
} from "../../modules/financial";
import "./Financial.css";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
});

const chartColors = ["#4d9bff", "#22c55e", "#f59e0b", "#a78bfa", "#38bdf8"];

function formatCurrency(value: number | string | null | undefined) {
    return currencyFormatter.format(Number(value ?? 0));
}

function formatReferenceDate(value: string) {
    return new Date(`${value.slice(0, 10)}T12:00:00`).toLocaleDateString("pt-BR");
}

function MetricCard({
    label,
    value,
    detail,
    icon,
    tone,
    to,
    ariaLabel
}: {
    label: string;
    value: string;
    detail: string;
    icon: IconDefinition;
    tone: "blue" | "green" | "red" | "violet";
    to?: string;
    ariaLabel?: string;
}) {
    const content = (
        <article className={`financial-metric financial-metric--${tone}`}>
            <div className="financial-metric__top">
                <span className="financial-metric__label">{label}</span>
                <span className="financial-metric__icon" aria-hidden="true">
                    <FontAwesomeIcon icon={icon} />
                </span>
            </div>
            <strong className="financial-metric__value">{value}</strong>
            <span className="financial-metric__detail">{detail}</span>
        </article>
    );

    if (to) {
        return (
            <Link className="financial-metric-link" to={to} aria-label={ariaLabel ?? label}>
                {content}
            </Link>
        );
    }

    return content;
}

export function Financial() {
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

    const monthlyQuery = useMonthlyFinancialSummary({
        year: selectedYear,
        month: selectedMonth,
        limit: 5
    });
    const yearlyQuery = useYearlyFinancialSummary({ year: selectedYear });
    const expensesQuery = useMonthlyExpensesOverview();

    const monthly = monthlyQuery.data;
    const yearly = yearlyQuery.data;
    const expenses = expensesQuery.data;

    const monthTitle = new Intl.DateTimeFormat("pt-BR", {
        month: "long",
        year: "numeric"
    }).format(new Date(selectedYear, selectedMonth - 1, 1));

    const yearlyChartData = (yearly?.monthsDetails ?? []).map(item => ({
        month: new Date(selectedYear, item.month - 1, 1)
            .toLocaleDateString("pt-BR", { month: "short" })
            .replace(".", ""),
        incomes: item.incomesValue,
        expenses: item.expensesValue,
        balance: item.balanceValue
    }));

    const sortedExpenseCategories = (monthly?.categories ?? [])
        .filter(category => category.type === "expense" && category.value > 0)
        .sort((a, b) => b.value - a.value);

    const expenseCategories = sortedExpenseCategories.length > 5
        ? [
            ...sortedExpenseCategories.slice(0, 4),
            {
                name: "Outras categorias",
                type: "expense" as const,
                description: null,
                value: sortedExpenseCategories
                    .slice(4)
                    .reduce((total, category) => total + category.value, 0)
            }
        ]
        : sortedExpenseCategories;

    function handleYearChange(year: number) {
        if (!Number.isInteger(year) || year < 2000 || year > currentYear) {
            return;
        }

        setSelectedYear(year);

        if (year === currentYear && selectedMonth > currentMonth) {
            setSelectedMonth(currentMonth);
        }
    }

    return (
        <main className="financial-page">
            <title>Financeiro | Blue Admin</title>
            <AppHeader />
            <nav className="page-back-row" aria-label="Navegação da página">
                <BackLink />
            </nav>

            <section className="financial-content">
                <header className="financial-heading">
                    <div className="financial-heading__copy">
                        <span className="financial-eyebrow">Gestão financeira</span>
                        <h1>Seu financeiro, em perspectiva.</h1>
                        <p>
                            Acompanhe os resultados, entenda as despesas e veja
                            o movimento da sua empresa em um só lugar.
                        </p>
                    </div>

                    <div className="financial-period-control">
                        <span className="financial-period-control__label">
                            <FontAwesomeIcon icon={faCalendarDays} />
                            Período de análise
                        </span>
                        <div className="financial-period-control__picker">
                            <label className="financial-period-field">
                                <span>Mês</span>
                                <select aria-label="Selecionar mês" value={selectedMonth} onChange={(event) => setSelectedMonth(Number(event.target.value))}>
                                    {availableMonths.map((month) => (
                                        <option key={month.value} value={month.value} disabled={selectedYear === currentYear && month.value > currentMonth}>
                                            {month.label}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className="financial-period-field">
                                <span>Ano</span>
                                <select aria-label="Selecionar ano" value={selectedYear} onChange={(event) => handleYearChange(Number(event.target.value))}>
                                    {availableYears.map((year) => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </select>
                            </label>
                        </div>
                    </div>
                </header>

                {monthlyQuery.isError && (
                    <div className="financial-alert" role="alert">
                        Não foi possível carregar o resumo do período. Confira sua conexão e tente novamente.
                        <button type="button" onClick={() => monthlyQuery.refetch()}>
                            Tentar novamente
                        </button>
                    </div>
                )}

                <section className="financial-metrics" aria-label="Indicadores do mês">
                    <MetricCard
                        label="Entradas do mês"
                        value={monthlyQuery.isPending ? "Carregando…" : formatCurrency(monthly?.incomesValue)}
                        detail="Total de receitas registradas"
                        icon={faArrowTrendUp}
                        tone="green"
                    />
                    <MetricCard
                        label="Saídas do mês"
                        value={monthlyQuery.isPending ? "Carregando…" : formatCurrency(monthly?.expensesValue)}
                        detail="Total de despesas registradas"
                        icon={faArrowTrendDown}
                        tone="red"
                    />
                    <MetricCard
                        label="Saldo do período"
                        value={monthlyQuery.isPending ? "Carregando…" : formatCurrency(monthly?.balanceValue)}
                        detail="Entradas menos saídas"
                        icon={faWallet}
                        tone="blue"
                    />
                    <MetricCard
                        label="Despesas recorrentes"
                        value={expensesQuery.isPending ? "Carregando…" : formatCurrency(expenses?.activeExpenses.sum)}
                        detail={expenses ? `${expenses.activeExpenses.number} despesas ativas cadastradas` : "Total mensal previsto"}
                        icon={faArrowDown}
                        tone="violet"
                        to="/monthly-expenses"
                        ariaLabel="Abrir gestão de despesas mensais"
                    />
                </section>

                <section className="financial-main-grid">
                    <article className="financial-panel financial-panel--wide">
                        <header className="financial-panel__header">
                            <div>
                                <span className="financial-panel__eyebrow">Acompanhamento anual</span>
                                <h2>Entradas e saídas</h2>
                                <p>Compare o movimento financeiro ao longo de {selectedYear}.</p>
                            </div>
                            <span className="financial-panel__period">{selectedYear}</span>
                        </header>

                        {yearlyQuery.isError ? (
                            <div className="financial-empty-state">
                                Não foi possível carregar o histórico anual.
                                <button type="button" onClick={() => yearlyQuery.refetch()}>Tentar novamente</button>
                            </div>
                        ) : yearlyQuery.isPending ? (
                            <div className="financial-chart-loading">Carregando histórico anual…</div>
                        ) : (
                            <div className="financial-year-chart">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={yearlyChartData} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
                                        <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 5" vertical={false} />
                                        <XAxis
                                            dataKey="month"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: "var(--color-text-muted)", fontSize: 12 }}
                                        />
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
                                        <Line dataKey="balance" name="Saldo" type="monotone" stroke="#4d9bff" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                        )}

                        <footer className="financial-chart-legend">
                            <span><i className="financial-legend-dot financial-legend-dot--income" /> Entradas</span>
                            <span><i className="financial-legend-dot financial-legend-dot--expense" /> Saídas</span>
                            <span><i className="financial-legend-line" /> Saldo</span>
                        </footer>
                    </article>

                    <article className="financial-panel">
                        <header className="financial-panel__header">
                            <div>
                                <span className="financial-panel__eyebrow">Onde você gasta</span>
                                <h2>Despesas por categoria</h2>
                                <p>Distribuição das saídas em {monthTitle}.</p>
                            </div>
                        </header>

                        {monthlyQuery.isError ? (
                            <div className="financial-empty-state">
                                <strong>Não foi possível carregar as categorias</strong>
                                <button type="button" onClick={() => monthlyQuery.refetch()}>Tentar novamente</button>
                            </div>
                        ) : monthlyQuery.isPending ? (
                            <div className="financial-chart-loading">Carregando categorias…</div>
                        ) : expenseCategories.length === 0 ? (
                            <div className="financial-empty-state">
                                <span className="financial-empty-state__icon">
                                    <FontAwesomeIcon icon={faArrowTrendDown} />
                                </span>
                                <strong>Nenhuma despesa registrada</strong>
                                <p>Quando houver saídas no período, a distribuição aparecerá aqui.</p>
                            </div>
                        ) : (
                            <>
                                <div className="financial-category-chart">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={expenseCategories}
                                                dataKey="value"
                                                nameKey="name"
                                                innerRadius={62}
                                                outerRadius={92}
                                                paddingAngle={3}
                                                stroke="none"
                                            >
                                                {expenseCategories.map((category, index) => (
                                                    <Cell key={`${category.name}-${index}`} fill={chartColors[index % chartColors.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{ background: "var(--color-surface-raised)", border: "1px solid var(--color-border)", borderRadius: 10, color: "var(--color-text)" }}
                                                formatter={(value) => formatCurrency(Number(value ?? 0))}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="financial-category-list">
                                    {expenseCategories.map((category, index) => (
                                        <div className="financial-category-row" key={`${category.name}-${index}`}>
                                            <span className="financial-category-row__name">
                                                <i style={{ backgroundColor: chartColors[index % chartColors.length] }} />
                                                {category.name}
                                            </span>
                                            <strong>{formatCurrency(category.value)}</strong>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </article>
                </section>

                <section className="financial-bottom-grid">
                    <article className="financial-panel financial-panel--transactions">
                        <header className="financial-panel__header">
                            <div>
                                <span className="financial-panel__eyebrow">Movimentações recentes</span>
                                <h2>Últimos lançamentos</h2>
                                <p>Os registros mais recentes de {monthTitle}.</p>
                            </div>
                        </header>

                        {monthlyQuery.isError ? (
                            <div className="financial-empty-state financial-empty-state--compact">
                                <strong>Não foi possível carregar os lançamentos</strong>
                                <button type="button" onClick={() => monthlyQuery.refetch()}>Tentar novamente</button>
                            </div>
                        ) : monthlyQuery.isPending ? (
                            <div className="financial-chart-loading">Carregando lançamentos…</div>
                        ) : (monthly?.lastTransactions.transactions.length ?? 0) === 0 ? (
                            <div className="financial-empty-state financial-empty-state--compact">
                                <strong>Nenhum lançamento neste mês</strong>
                                <p>Quando você registrar uma movimentação, ela aparecerá aqui.</p>
                            </div>
                        ) : (
                            <div className="financial-transactions-list">
                                {monthly?.lastTransactions.transactions.map(transaction => (
                                    <div className="financial-transaction-row" key={transaction.id}>
                                        <span className={`financial-transaction-row__icon financial-transaction-row__icon--${transaction.type}`}>
                                            <FontAwesomeIcon icon={transaction.type === "income" ? faArrowTrendUp : faArrowTrendDown} />
                                        </span>
                                        <div className="financial-transaction-row__details">
                                            <strong>{transaction.description}</strong>
                                            <span>{transaction.categoryName} <i /> {formatReferenceDate(transaction.referenceDate)}</span>
                                        </div>
                                        <strong className={`financial-transaction-row__value financial-transaction-row__value--${transaction.type}`}>
                                            {transaction.type === "income" ? "+" : "−"} {formatCurrency(transaction.value)}
                                        </strong>
                                    </div>
                                ))}
                            </div>
                        )}
                    </article>

                    <Link
                        className="financial-panel financial-fixed-costs financial-fixed-costs--link"
                        to="/monthly-expenses"
                        aria-label="Abrir gestão de despesas mensais"
                    >
                        <div className="financial-fixed-costs__icon">
                            <FontAwesomeIcon icon={faCalendarDays} />
                        </div>
                        <span className="financial-panel__eyebrow">Compromissos recorrentes</span>
                        <h2>Despesas mensais</h2>
                        {expensesQuery.isPending ? (
                            <p>Carregando despesas cadastradas…</p>
                        ) : expensesQuery.isError ? (
                            <p>Não foi possível carregar as despesas recorrentes.</p>
                        ) : (
                            <>
                                <strong className="financial-fixed-costs__value">{formatCurrency(expenses?.activeExpenses.sum)}</strong>
                                <p>Valor mensal previsto para despesas ativas.</p>
                                <div className="financial-fixed-costs__divider" />
                                <div className="financial-fixed-costs__meta">
                                    <span>Estimativa diária</span>
                                    <strong>{formatCurrency(expenses?.activeExpenses.dayCosts)}</strong>
                                </div>
                                <div className="financial-fixed-costs__meta">
                                    <span>Estimativa por hora</span>
                                    <strong>{formatCurrency(expenses?.activeExpenses.hourCosts)}</strong>
                                </div>
                            </>
                        )}
                    </Link>
                </section>
            </section>
        </main>
    );
}
