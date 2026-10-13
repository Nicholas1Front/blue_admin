import { useState, type FormEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass, faRotateLeft } from "@fortawesome/free-solid-svg-icons";

import type { FindMonthlyExpensesFilters } from "../../../modules/financial/monthlyExpenses/monthlyExpenses.types";

interface MonthlyExpenseSearchProps {
    isSearching: boolean;
    hasSearched: boolean;
    onSearch: (filters: FindMonthlyExpensesFilters) => void;
    onClear: () => void;
}

export function MonthlyExpenseSearch({
    isSearching,
    hasSearched,
    onSearch,
    onClear
}: MonthlyExpenseSearchProps) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [notes, setNotes] = useState("");
    const [expectedValue, setExpectedValue] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [active, setActive] = useState("");
    const [validationError, setValidationError] = useState<string | null>(null);

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const filters: FindMonthlyExpensesFilters = {
            name: name.trim() || undefined,
            description: description.trim() || undefined,
            notes: notes.trim() || undefined,
            expectedValue: expectedValue ? Number(expectedValue) : undefined,
            dueDate: dueDate ? new Date(`${dueDate}T12:00:00`).toISOString() : undefined,
            active: active === "" ? undefined : active === "true"
        };

        if (filters.expectedValue !== undefined && (!Number.isFinite(filters.expectedValue) || filters.expectedValue < 1)) {
            setValidationError("O valor deve ser maior ou igual a R$ 1,00.");
            return;
        }

        if (Object.values(filters).every((value) => value === undefined)) {
            setValidationError("Informe ao menos um filtro para pesquisar.");
            return;
        }

        setValidationError(null);
        onSearch(filters);
    }

    function handleClear() {
        setName("");
        setDescription("");
        setNotes("");
        setExpectedValue("");
        setDueDate("");
        setActive("");
        setValidationError(null);
        onClear();
    }

    return (
        <section className="monthly-expense-search" aria-labelledby="monthly-expense-search-title">
            <div className="monthly-expense-search__heading">
                <span className="monthly-expense-eyebrow">Consulta</span>
                <h2 id="monthly-expense-search-title">Pesquisar despesas</h2>
                <p>Combine os filtros para encontrar uma despesa específica.</p>
            </div>

            <form className="monthly-expense-search__form" onSubmit={handleSubmit}>
                <div className="monthly-expense-field">
                    <label htmlFor="monthly-expense-filter-name">Nome</label>
                    <input id="monthly-expense-filter-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex.: aluguel" disabled={isSearching} />
                </div>
                <div className="monthly-expense-field">
                    <label htmlFor="monthly-expense-filter-description">Descrição</label>
                    <input id="monthly-expense-filter-description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Buscar na descrição" disabled={isSearching} />
                </div>
                <div className="monthly-expense-field">
                    <label htmlFor="monthly-expense-filter-notes">Observações</label>
                    <input id="monthly-expense-filter-notes" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Buscar nas observações" disabled={isSearching} />
                </div>
                <div className="monthly-expense-field">
                    <label htmlFor="monthly-expense-filter-value">Valor previsto</label>
                    <input id="monthly-expense-filter-value" type="number" min="1" step="0.01" value={expectedValue} onChange={(event) => setExpectedValue(event.target.value)} placeholder="R$ 0,00" disabled={isSearching} />
                </div>
                <div className="monthly-expense-field">
                    <label htmlFor="monthly-expense-filter-date">Vencimento</label>
                    <input id="monthly-expense-filter-date" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} disabled={isSearching} />
                </div>
                <div className="monthly-expense-field">
                    <label htmlFor="monthly-expense-filter-status">Situação</label>
                    <select id="monthly-expense-filter-status" value={active} onChange={(event) => setActive(event.target.value)} disabled={isSearching}>
                        <option value="">Todas</option>
                        <option value="true">Ativas</option>
                        <option value="false">Inativas</option>
                    </select>
                </div>

                <div className="monthly-expense-search__actions">
                    <button className="monthly-expense-button monthly-expense-button--secondary" type="button" onClick={handleClear} disabled={isSearching && !hasSearched}>
                        <FontAwesomeIcon icon={faRotateLeft} />
                        Limpar filtros
                    </button>
                    <button className="monthly-expense-button monthly-expense-button--primary" type="submit" disabled={isSearching}>
                        <FontAwesomeIcon icon={faMagnifyingGlass} />
                        {isSearching ? "Pesquisando…" : "Pesquisar"}
                    </button>
                </div>
            </form>

            {validationError && <p className="monthly-expense-form-error" role="alert">{validationError}</p>}
        </section>
    );
}
