import { useMemo, useState, type FormEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass, faRotateLeft } from "@fortawesome/free-solid-svg-icons";
import { Modal } from "../../../../components/Modal/Modal";
import { useBudgetsByAdvancedFilters } from "../../../../modules/budgets";
import type { BudgetStatus, FindBudgetsByAdvancedFilters, BudgetSearchSummary } from "../../../../modules/budgets";
import "./BudgetServiceConversionSearchModal.css";

const PAGE_SIZE = 8;
const statusLabels: Record<BudgetStatus, string> = {
    rascunho: "Rascunho", enviado: "Enviado", aprovado: "Aprovado",
    rejeitado: "Rejeitado", expirado: "Expirado", cancelado: "Cancelado"
};

function periodRange(year: number, month: number) {
    const lastDay = new Date(year, month, 0).getDate();
    const pad = (value: number) => String(value).padStart(2, "0");
    return { createdAtFrom: `${year}-${pad(month)}-01`, createdAtTo: `${year}-${pad(month)}-${lastDay}` };
}

function equipmentLabel(budget: BudgetSearchSummary) {
    return [budget.equipament.type, budget.equipament.brand, budget.equipament.model,
        budget.equipament.mainIdentification, budget.equipament.additionalIdentification]
        .filter(Boolean).join(" · ");
}

function budgetLabel(budget: BudgetSearchSummary) {
    return `Orçamento ${budget.id} · ${budget.client.name}`;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (budgetId: string) => void;
}

export function BudgetServiceConversionSearchModal({ isOpen, onClose, onSelect }: Props) {
    const now = new Date();
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear] = useState(now.getFullYear());
    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState({ search: "", status: "", clientName: "", equipamentSearch: "" });
    const [submitted, setSubmitted] = useState<FindBudgetsByAdvancedFilters | null>(null);
    const baseFilters = useMemo(() => ({
        ...periodRange(year, month), page, limit: PAGE_SIZE
    }), [year, month, page]);
    const queryFilters = submitted ? { ...submitted, page, limit: PAGE_SIZE } : baseFilters;
    const query = useBudgetsByAdvancedFilters(queryFilters, isOpen);

    function applyFilters(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const next: FindBudgetsByAdvancedFilters = {
            ...periodRange(year, month),
            ...(filters.search.trim() && { search: filters.search.trim() }),
            ...(filters.status && { status: filters.status as BudgetStatus }),
            ...(filters.clientName.trim() && { clientName: filters.clientName.trim() }),
            ...(filters.equipamentSearch.trim() && { equipamentSearch: filters.equipamentSearch.trim() }),
            page: 1,
            limit: PAGE_SIZE
        };
        setPage(1);
        setSubmitted(next);
    }

    function resetFilters() {
        setFilters({ search: "", status: "", clientName: "", equipamentSearch: "" });
        setSubmitted(null);
        setPage(1);
    }

    function changePeriod(nextMonth: number, nextYear: number) {
        setMonth(nextMonth);
        setYear(nextYear);
        setPage(1);
        setSubmitted(null);
    }

    return (
        <Modal isOpen={isOpen} title="Selecionar orçamento" onClose={onClose} size="wide">
            <div className="budget-service-search">
                <p className="budget-service-search__intro">Localize o orçamento que deseja transformar em um serviço. Por padrão, exibimos os orçamentos do mês atual.</p>
                <form className="budget-service-search__filters" onSubmit={applyFilters}>
                    <label className="budget-service-search__field budget-service-search__field--search">
                        <span>Busca geral</span>
                        <input value={filters.search} onChange={event => setFilters(current => ({ ...current, search: event.target.value }))} placeholder="Código, cliente, equipamento ou item" />
                    </label>
                    <label className="budget-service-search__field">
                        <span>Mês</span>
                        <select value={month} onChange={event => changePeriod(Number(event.target.value), year)}>
                            {Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(new Date(2000, index, 1))}</option>)}
                        </select>
                    </label>
                    <label className="budget-service-search__field">
                        <span>Ano</span>
                        <select value={year} onChange={event => changePeriod(month, Number(event.target.value))}>
                            {Array.from({ length: new Date().getFullYear() - 1999 }, (_, index) => new Date().getFullYear() - index).map(value => <option key={value} value={value}>{value}</option>)}
                        </select>
                    </label>
                    <label className="budget-service-search__field">
                        <span>Status</span>
                        <select value={filters.status} onChange={event => setFilters(current => ({ ...current, status: event.target.value }))}>
                            <option value="">Todos</option>
                            {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                        </select>
                    </label>
                    <label className="budget-service-search__field">
                        <span>Cliente</span>
                        <input value={filters.clientName} onChange={event => setFilters(current => ({ ...current, clientName: event.target.value }))} placeholder="Nome do cliente" />
                    </label>
                    <label className="budget-service-search__field">
                        <span>Equipamento</span>
                        <input value={filters.equipamentSearch} onChange={event => setFilters(current => ({ ...current, equipamentSearch: event.target.value }))} placeholder="Tipo, marca, modelo..." />
                    </label>
                    <div className="budget-service-search__actions">
                        <button type="button" className="is-secondary" onClick={resetFilters}><FontAwesomeIcon icon={faRotateLeft} /> Limpar filtros</button>
                        <button type="submit" className="is-primary"><FontAwesomeIcon icon={faMagnifyingGlass} /> Buscar</button>
                    </div>
                </form>

                <div className="budget-service-search__results">
                    <div className="budget-service-search__results-heading">
                        <strong>Orçamentos encontrados</strong>
                        <span>{query.data?.total ?? 0} registro(s)</span>
                    </div>
                    {query.isPending ? <p className="budget-service-search__state">Carregando orçamentos...</p>
                        : query.isError ? <div className="budget-service-search__state" role="alert">Não foi possível carregar os orçamentos. <button type="button" onClick={() => void query.refetch()}>Tentar novamente</button></div>
                        : query.data?.budgets.length ? <>
                            <div className="budget-service-search__list">
                                {query.data.budgets.map(budget => <button type="button" className="budget-service-search__item" key={budget.id} onClick={() => onSelect(budget.id)}>
                                    <span className="budget-service-search__item-main">
                                        <strong>{budgetLabel(budget)}</strong>
                                        <small>{equipmentLabel(budget) || "Equipamento não informado"}</small>
                                        <small>{new Date(budget.createdAt).toLocaleDateString("pt-BR")} · {statusLabels[budget.status]}</small>
                                    </span>
                                    <span className="budget-service-search__item-value">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(budget.finalAmount)}</span>
                                </button>)}
                            </div>
                            <div className="budget-service-search__pagination">
                                <span>Página {query.data.page} de {Math.max(query.data.totalPages, 1)}</span>
                                <div><button type="button" disabled={page <= 1} onClick={() => setPage(value => value - 1)}>Anterior</button><button type="button" disabled={page >= query.data.totalPages} onClick={() => setPage(value => value + 1)}>Próxima</button></div>
                            </div>
                        </> : <p className="budget-service-search__state">Nenhum orçamento encontrado para os filtros selecionados.</p>}
                </div>
            </div>
        </Modal>
    );
}
