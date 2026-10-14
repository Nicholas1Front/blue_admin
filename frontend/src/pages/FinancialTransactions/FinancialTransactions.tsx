import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faArrowTrendDown,
    faArrowTrendUp,
    faCalendarDays,
    faWallet
} from "@fortawesome/free-solid-svg-icons";

import { AppHeader } from "../../components/AppHeader/AppHeader";
import { BackLink } from "../../components/BackLink/BackLink";
import { useYearlyFinancialSummary } from "../../modules/financial";
import "./FinancialTransactions.css";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
});

function formatCurrency(value: number | string | null | undefined) {
    return currencyFormatter.format(Number(value ?? 0));
}

function YearMetric({
    label,
    value,
    description,
    icon,
    tone
}: {
    label: string;
    value: string;
    description: string;
    icon: typeof faWallet;
    tone: "income" | "expense" | "balance";
}) {
    return (
        <article className={`financial-transactions-metric financial-transactions-metric--${tone}`}>
            <div className="financial-transactions-metric__top">
                <span>{label}</span>
                <span className="financial-transactions-metric__icon" aria-hidden="true">
                    <FontAwesomeIcon icon={icon} />
                </span>
            </div>
            <strong className="financial-transactions-metric__value">{value}</strong>
            <p>{description}</p>
        </article>
    );
}

export function FinancialTransactions() {
    document.title = "Lançamentos financeiros | Blue Admin";

    const currentYear = new Date().getFullYear();
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const availableYears = Array.from(
        { length: currentYear - 1999 },
        (_, index) => currentYear - index
    );

    const yearlyQuery = useYearlyFinancialSummary({ year: selectedYear });
    const yearlySummary = yearlyQuery.data;

    return (
        <main className="financial-transactions-page">
            <AppHeader />

            <nav className="page-back-row" aria-label="Navegação da página">
                <BackLink to="/financial" label="Voltar ao financeiro" />
            </nav>

            <section className="financial-transactions-content">
                <header className="financial-transactions-heading">
                    <span className="financial-transactions-eyebrow">
                        Gestão financeira
                    </span>
                    <h1>Lançamentos financeiros</h1>
                    <p>
                        Consulte e organize as movimentações da empresa, acompanhando
                        entradas, saídas e o resultado financeiro de cada período.
                    </p>
                </header>

                <section
                    className="financial-transactions-yearly"
                    aria-labelledby="financial-transactions-yearly-title"
                >
                    <header className="financial-transactions-yearly__header">
                        <div>
                            <span className="financial-transactions-eyebrow">
                                Visão geral
                            </span>
                            <h2 id="financial-transactions-yearly-title">
                                Resumo anual
                            </h2>
                            <p>
                                Os indicadores abaixo acompanham o ano selecionado.
                            </p>
                        </div>

                        <label className="financial-transactions-year-picker">
                            <span>
                                <FontAwesomeIcon icon={faCalendarDays} aria-hidden="true" />
                                Ano de referência
                            </span>
                            <select
                                aria-label="Selecionar ano do resumo financeiro"
                                value={selectedYear}
                                onChange={(event) => setSelectedYear(Number(event.target.value))}
                            >
                                {availableYears.map((year) => (
                                    <option key={year} value={year}>
                                        {year}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </header>

                    {yearlyQuery.isError ? (
                        <div className="financial-transactions-feedback" role="alert">
                            <p>Não foi possível carregar o resumo de {selectedYear}.</p>
                            <button type="button" onClick={() => yearlyQuery.refetch()}>
                                Tentar novamente
                            </button>
                        </div>
                    ) : (
                        <div className="financial-transactions-metrics" aria-live="polite">
                            <YearMetric
                                label="Entradas do ano"
                                value={yearlyQuery.isPending ? "Carregando…" : formatCurrency(yearlySummary?.incomesValue)}
                                description={`Receitas registradas em ${selectedYear}`}
                                icon={faArrowTrendUp}
                                tone="income"
                            />
                            <YearMetric
                                label="Saídas do ano"
                                value={yearlyQuery.isPending ? "Carregando…" : formatCurrency(yearlySummary?.expensesValue)}
                                description={`Despesas registradas em ${selectedYear}`}
                                icon={faArrowTrendDown}
                                tone="expense"
                            />
                            <YearMetric
                                label="Saldo do ano"
                                value={yearlyQuery.isPending ? "Carregando…" : formatCurrency(yearlySummary?.balanceValue)}
                                description="Entradas menos saídas"
                                icon={faWallet}
                                tone="balance"
                            />
                        </div>
                    )}
                </section>
            </section>
        </main>
    );
}
