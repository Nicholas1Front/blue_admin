import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faCalendarDay,
    faCalendarCheck,
    faClock,
    faCircleCheck,
    faCircleXmark
} from "@fortawesome/free-solid-svg-icons";

import type { MonthlyExpensesOverview as MonthlyExpensesOverviewData } from "../../../modules/financial/monthlyExpenses/monthlyExpenses.types";

interface MonthlyExpenseOverviewProps {
    overview?: MonthlyExpensesOverviewData;
    isLoading: boolean;
}

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
});

function formatCurrency(value: number | string | null | undefined) {
    return currencyFormatter.format(Number(value ?? 0));
}

export function MonthlyExpenseOverview({
    overview,
    isLoading
}: MonthlyExpenseOverviewProps) {
    const metrics = [
        {
            label: "Despesas ativas",
            value: isLoading ? "Carregando…" : formatCurrency(overview?.activeExpenses.sum),
            detail: "Soma mensal prevista",
            icon: faCircleCheck,
            tone: "green"
        },
        {
            label: "Contas ativas",
            value: isLoading ? "—" : String(overview?.activeExpenses.number ?? 0),
            detail: "Despesas em vigor",
            icon: faCalendarCheck,
            tone: "blue"
        },
        {
            label: "Contas inativas",
            value: isLoading ? "—" : String(overview?.deactiveExpenses.number ?? 0),
            detail: "Despesas desativadas",
            icon: faCircleXmark,
            tone: "muted"
        },
        {
            label: "Custo diário",
            value: isLoading ? "Carregando…" : formatCurrency(overview?.activeExpenses.dayCosts),
            detail: "Estimativa em 30 dias",
            icon: faCalendarDay,
            tone: "violet"
        },
        {
            label: "Custo por hora",
            value: isLoading ? "Carregando…" : formatCurrency(overview?.activeExpenses.hourCosts),
            detail: "Estimativa em jornada de 8h",
            icon: faClock,
            tone: "amber"
        }
    ] as const;

    return (
        <section className="monthly-expense-metrics" aria-label="Resumo das despesas mensais">
            {metrics.map((metric) => (
                <article className={`monthly-expense-metric monthly-expense-metric--${metric.tone}`} key={metric.label}>
                    <div className="monthly-expense-metric__top">
                        <span>{metric.label}</span>
                        <span className="monthly-expense-metric__icon" aria-hidden="true">
                            <FontAwesomeIcon icon={metric.icon} />
                        </span>
                    </div>
                    <strong>{metric.value}</strong>
                    <small>{metric.detail}</small>
                </article>
            ))}
        </section>
    );
}
