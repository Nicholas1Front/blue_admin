import { useState, type FormEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faBroom,
    faCalendarDays,
    faFilter,
    faMagnifyingGlass,
    faWrench
} from "@fortawesome/free-solid-svg-icons";

import { Modal } from "../../../../components/Modal/Modal";
import { useBudgetsByAdvancedFilters } from "../../../../modules/budgets";
import type {
    BudgetSearchSummary,
    BudgetStatus,
    FindBudgetsByAdvancedFilters
} from "../../../../modules/budgets";
import "./BudgetServiceConversionSearchModal.css";

const PAGE_SIZE = 8;

const statusLabels: Record<BudgetStatus, string> = {
    rascunho: "Rascunho",
    enviado: "Enviado",
    aprovado: "Aprovado",
    rejeitado: "Rejeitado",
    expirado: "Expirado",
    cancelado: "Cancelado"
};

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
});

function getPeriodRange(year: number, month: number) {
    const lastDay = new Date(year, month, 0).getDate();
    const pad = (value: number) => String(value).padStart(2, "0");

    return {
        createdAtFrom: `${year}-${pad(month)}-01`,
        createdAtTo: `${year}-${pad(month)}-${lastDay}`
    };
}

function formatDate(value: string) {
    return new Date(`${value.slice(0, 10)}T12:00:00`).toLocaleDateString("pt-BR");
}

function formatEquipment(budget: BudgetSearchSummary) {
    return [
        budget.equipament.type,
        budget.equipament.brand,
        budget.equipament.model,
        budget.equipament.mainIdentification,
        budget.equipament.additionalIdentification
    ].filter(Boolean).join(" · ");
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (budgetId: string) => void;
}

export function BudgetServiceConversionSearchModal({
    isOpen,
    onClose,
    onSelect
}: Props) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const [month, setMonth] = useState(currentMonth);
    const [year, setYear] = useState(currentYear);
    const [page, setPage] = useState(1);
    const [filterForm, setFilterForm] = useState<FindBudgetsByAdvancedFilters>(() => ({
        ...getPeriodRange(currentYear, currentMonth)
    }));
    const [submittedFilters, setSubmittedFilters] = useState<FindBudgetsByAdvancedFilters | null>(null);
    const [filterError, setFilterError] = useState<string | null>(null);

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

    const defaultFilters: FindBudgetsByAdvancedFilters = {
        ...getPeriodRange(year, month),
        page,
        limit: PAGE_SIZE
    };
    const queryFilters = submittedFilters
        ? { ...submittedFilters, page, limit: PAGE_SIZE }
        : defaultFilters;
    const query = useBudgetsByAdvancedFilters(queryFilters, isOpen);

    function updateFilter(
        key: keyof FindBudgetsByAdvancedFilters,
        value: string,
        numeric = false
    ) {
        setFilterForm(current => {
            const next = { ...current };
            const normalizedValue = value.trim();

            if (!normalizedValue) {
                delete next[key];
            } else if (numeric) {
                const parsedValue = Number(normalizedValue);
                if (Number.isFinite(parsedValue)) {
                    Object.assign(next, { [key]: parsedValue });
                }
            } else {
                Object.assign(next, { [key]: normalizedValue });
            }

            return next;
        });
    }

    function changePeriod(nextMonth: number, nextYear: number) {
        setMonth(nextMonth);
        setYear(nextYear);
        setPage(1);
        setFilterError(null);
        setFilterForm(current => ({
            ...current,
            ...getPeriodRange(nextYear, nextMonth)
        }));
        setSubmittedFilters(null);
    }

    function applyFilters(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setFilterError(null);

        const activeFilters = Object.entries(filterForm).filter(
            ([key, value]) =>
                !["page", "limit"].includes(key) &&
                value !== undefined &&
                value !== ""
        );

        if (activeFilters.length === 0) {
            setFilterError("Informe ao menos um filtro para realizar a consulta.");
            return;
        }

        const rangePairs: Array<[
            keyof FindBudgetsByAdvancedFilters,
            keyof FindBudgetsByAdvancedFilters,
            string
        ]> = [
            ["createdAtFrom", "createdAtTo", "O período de criação"],
            ["updatedAtFrom", "updatedAtTo", "O período de atualização"],
            ["historyCreatedAtFrom", "historyCreatedAtTo", "O período do histórico"],
            ["totalAmountMin", "totalAmountMax", "A faixa de valor total"],
            ["globalDiscountMin", "globalDiscountMax", "A faixa de desconto global"],
            ["finalAmountMin", "finalAmountMax", "A faixa de valor final"],
            ["itemQuantityMin", "itemQuantityMax", "A faixa de quantidade dos itens"],
            ["itemUnitValueMin", "itemUnitValueMax", "A faixa de valor unitário"],
            ["itemTotalAmountMin", "itemTotalAmountMax", "A faixa de valor dos itens"],
            ["itemDiscountMin", "itemDiscountMax", "A faixa de desconto dos itens"]
        ];

        for (const [minKey, maxKey, label] of rangePairs) {
            const min = filterForm[minKey];
            const max = filterForm[maxKey];

            if (typeof min === "number" && typeof max === "number" && min > max) {
                setFilterError(`${label}: o valor mínimo não pode ser maior que o máximo.`);
                return;
            }

            if (typeof min === "string" && typeof max === "string" && min > max) {
                setFilterError(`${label}: a data inicial não pode ser posterior à data final.`);
                return;
            }
        }

        setPage(1);
        setSubmittedFilters({ ...filterForm, page: 1, limit: PAGE_SIZE });
    }

    function clearFilters() {
        const period = getPeriodRange(year, month);
        setFilterForm(period);
        setSubmittedFilters(null);
        setFilterError(null);
        setPage(1);
    }

    function changePage(nextPage: number) {
        setPage(nextPage);
    }

    function renderTextField(
        key: keyof FindBudgetsByAdvancedFilters,
        label: string,
        placeholder?: string,
        wide = false
    ) {
        return (
            <label
                className={`budget-service-search__field${wide ? " budget-service-search__field--wide" : ""}`}
                key={key}
            >
                <span>{label}</span>
                <input
                    value={String(filterForm[key] ?? "")}
                    onChange={event => updateFilter(key, event.target.value)}
                    placeholder={placeholder}
                />
            </label>
        );
    }

    function renderDateField(
        key: keyof FindBudgetsByAdvancedFilters,
        label: string
    ) {
        return (
            <label className="budget-service-search__field" key={key}>
                <span>{label}</span>
                <input
                    type="date"
                    value={String(filterForm[key] ?? "")}
                    onChange={event => updateFilter(key, event.target.value)}
                />
            </label>
        );
    }

    function renderNumberFields(
        fields: ReadonlyArray<readonly [keyof FindBudgetsByAdvancedFilters, string]>
    ) {
        return fields.map(([key, label]) => (
            <label className="budget-service-search__field" key={key}>
                <span>{label}</span>
                <input
                    type="number"
                    min={String(key).includes("Quantity") ? "0.000001" : "0"}
                    max={String(key).includes("Discount") ? 100 : undefined}
                    step="0.01"
                    value={String(filterForm[key] ?? "")}
                    onChange={event => updateFilter(key, event.target.value, true)}
                />
            </label>
        ));
    }

    return (
        <Modal
            isOpen={isOpen}
            title="Selecionar orçamento para criar serviço"
            onClose={onClose}
            size="wide"
        >
            <div className="budget-service-search">
                <header className="budget-service-search__intro">
                    <span className="budget-service-search__eyebrow">
                        <FontAwesomeIcon icon={faWrench} aria-hidden="true" />
                        Conversão de orçamento
                    </span>
                    <p>
                        Pesquise usando os mesmos critérios disponíveis na consulta avançada
                        do dashboard. Os resultados começam pelo mês atual; selecione um
                        orçamento para escolher quais itens serão levados ao serviço.
                    </p>
                </header>

                <form className="budget-service-search__form" onSubmit={applyFilters}>
                    <section className="budget-service-search__period" aria-label="Período inicial da pesquisa">
                        <div className="budget-service-search__section-heading">
                            <span className="budget-service-search__section-icon">
                                <FontAwesomeIcon icon={faCalendarDays} aria-hidden="true" />
                            </span>
                            <div>
                                <strong>Período de criação</strong>
                                <small>Por padrão, os orçamentos do mês atual</small>
                            </div>
                        </div>
                        <div className="budget-service-search__period-fields">
                            <label className="budget-service-search__field">
                                <span>Mês</span>
                                <select
                                    value={month}
                                    onChange={event => changePeriod(Number(event.target.value), year)}
                                >
                                    {availableMonths.map(option => (
                                        <option
                                            key={option.value}
                                            value={option.value}
                                            disabled={year === currentYear && option.value > currentMonth}
                                        >
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className="budget-service-search__field">
                                <span>Ano</span>
                                <select
                                    value={year}
                                    onChange={event => changePeriod(month, Number(event.target.value))}
                                >
                                    {availableYears.map(value => (
                                        <option key={value} value={value}>{value}</option>
                                    ))}
                                </select>
                            </label>
                        </div>
                    </section>

                    <section className="budget-service-search__filter-panel">
                        <header className="budget-service-search__filter-heading">
                            <div>
                                <span className="budget-service-search__eyebrow">Busca avançada</span>
                                <h3>Filtros de pesquisa</h3>
                                <p>Combine os critérios para encontrar o orçamento correto.</p>
                            </div>
                            <span className="budget-service-search__filter-icon" aria-hidden="true">
                                <FontAwesomeIcon icon={faFilter} />
                            </span>
                        </header>

                        <div className="budget-service-search__quick-fields">
                            {renderTextField(
                                "search",
                                "Busca geral",
                                "Cliente, documento, equipamento, item ou observação",
                                true
                            )}
                            {renderTextField("budgetId", "Código do orçamento", "Identificador")}
                            <label className="budget-service-search__field">
                                <span>Status</span>
                                <select
                                    value={filterForm.status ?? ""}
                                    onChange={event => updateFilter("status", event.target.value)}
                                >
                                    <option value="">Todos</option>
                                    {Object.entries(statusLabels).map(([value, label]) => (
                                        <option key={value} value={value}>{label}</option>
                                    ))}
                                </select>
                            </label>
                        </div>

                        <div className="budget-service-search__groups">
                            <details className="budget-service-search__group" open>
                                <summary>Cliente e equipamento</summary>
                                <div className="budget-service-search__group-fields">
                                    {renderTextField("clientName", "Nome do cliente")}
                                    {renderTextField("clientDocument", "Documento do cliente")}
                                    {renderTextField("clientId", "Cliente (ID)")}
                                    {renderTextField(
                                        "equipamentSearch",
                                        "Equipamento",
                                        "Tipo, marca, modelo ou identificação"
                                    )}
                                    {renderTextField("equipamentId", "Equipamento (ID)")}
                                </div>
                            </details>

                            <details className="budget-service-search__group">
                                <summary>Condições do orçamento</summary>
                                <div className="budget-service-search__group-fields">
                                    {renderTextField("paymentCondition", "Condição de pagamento", "Ex.: à vista")}
                                    {renderTextField("validity", "Validade")}
                                    {renderTextField("warranty", "Garantia")}
                                    {renderTextField("deliveryTime", "Prazo de entrega")}
                                    {renderTextField("observations", "Observações", undefined, true)}
                                </div>
                            </details>

                            <details className="budget-service-search__group">
                                <summary>Datas e valores</summary>
                                <div className="budget-service-search__group-fields">
                                    {renderDateField("createdAtFrom", "Criado a partir de")}
                                    {renderDateField("createdAtTo", "Criado até")}
                                    {renderDateField("updatedAtFrom", "Atualizado a partir de")}
                                    {renderDateField("updatedAtTo", "Atualizado até")}
                                    {renderNumberFields([
                                        ["totalAmountMin", "Valor total mínimo"],
                                        ["totalAmountMax", "Valor total máximo"],
                                        ["globalDiscountMin", "Desconto global mínimo (%)"],
                                        ["globalDiscountMax", "Desconto global máximo (%)"],
                                        ["finalAmountMin", "Valor final mínimo"],
                                        ["finalAmountMax", "Valor final máximo"]
                                    ])}
                                </div>
                            </details>

                            <details className="budget-service-search__group">
                                <summary>Itens e categorias</summary>
                                <div className="budget-service-search__group-fields">
                                    {renderTextField("itemId", "Item (ID)")}
                                    {renderTextField("itemTitle", "Título do item")}
                                    {renderTextField("itemDescription", "Descrição do item")}
                                    {renderTextField("itemCategoryName", "Categoria")}
                                    {renderTextField("itemCategoryId", "Categoria (ID)")}
                                    {renderNumberFields([
                                        ["itemQuantityMin", "Quantidade mínima"],
                                        ["itemQuantityMax", "Quantidade máxima"],
                                        ["itemUnitValueMin", "Valor unitário mínimo"],
                                        ["itemUnitValueMax", "Valor unitário máximo"],
                                        ["itemTotalAmountMin", "Total dos itens mínimo"],
                                        ["itemTotalAmountMax", "Total dos itens máximo"],
                                        ["itemDiscountMin", "Desconto mínimo (%)"],
                                        ["itemDiscountMax", "Desconto máximo (%)"]
                                    ])}
                                </div>
                            </details>

                            <details className="budget-service-search__group">
                                <summary>Histórico</summary>
                                <div className="budget-service-search__group-fields">
                                    {renderTextField("historyId", "Histórico (ID)")}
                                    {renderTextField("historyEventType", "Tipo de evento")}
                                    {renderTextField("historyDescription", "Descrição do evento", undefined, true)}
                                    {renderDateField("historyCreatedAtFrom", "Evento a partir de")}
                                    {renderDateField("historyCreatedAtTo", "Evento até")}
                                </div>
                            </details>
                        </div>
                    </section>

                    {filterError && (
                        <p className="budget-service-search__error" role="alert">{filterError}</p>
                    )}

                    <div className="budget-service-search__actions">
                        <button type="button" className="is-secondary" onClick={clearFilters}>
                            <FontAwesomeIcon icon={faBroom} aria-hidden="true" />
                            Limpar filtros
                        </button>
                        <button type="submit" className="is-primary">
                            <FontAwesomeIcon icon={faMagnifyingGlass} aria-hidden="true" />
                            Buscar orçamentos
                        </button>
                    </div>
                </form>

                <section className="budget-service-search__results" aria-live="polite">
                    <div className="budget-service-search__results-heading">
                        <div>
                            <span className="budget-service-search__eyebrow">Seleção</span>
                            <h3>Orçamentos encontrados</h3>
                        </div>
                        <span className="budget-service-search__count">
                            {query.data?.total ?? 0} registro(s)
                        </span>
                    </div>

                    {query.isPending ? (
                        <div className="budget-service-search__state">
                            <span className="budget-service-search__spinner" aria-hidden="true" />
                            Carregando orçamentos…
                        </div>
                    ) : query.isError ? (
                        <div className="budget-service-search__state" role="alert">
                            <strong>Não foi possível carregar os orçamentos.</strong>
                            <button type="button" onClick={() => void query.refetch()}>
                                Tentar novamente
                            </button>
                        </div>
                    ) : query.data && query.data.budgets.length > 0 ? (
                        <>
                            <div className="budget-service-search__list">
                                {query.data.budgets.map(budget => (
                                    <button
                                        type="button"
                                        className="budget-service-search__item"
                                        key={budget.id}
                                        onClick={() => onSelect(budget.id)}
                                    >
                                        <span className="budget-service-search__item-main">
                                            <span className="budget-service-search__item-topline">
                                                <strong>Orçamento {budget.id}</strong>
                                                <span className={`budget-service-search__status budget-service-search__status--${budget.status}`}>
                                                    {statusLabels[budget.status]}
                                                </span>
                                            </span>
                                            <strong className="budget-service-search__client">
                                                {budget.client.name}
                                            </strong>
                                            <small>{formatEquipment(budget) || "Equipamento não informado"}</small>
                                            <small>
                                                Criado em {formatDate(budget.createdAt)}
                                                {budget._count?.items !== undefined
                                                    ? ` · ${budget._count.items} item(ns)`
                                                    : ""}
                                            </small>
                                        </span>
                                        <span className="budget-service-search__item-side">
                                            <strong>{currencyFormatter.format(Number(budget.finalAmount))}</strong>
                                            <small>Valor final</small>
                                            <span aria-hidden="true">Selecionar orçamento →</span>
                                        </span>
                                    </button>
                                ))}
                            </div>

                            <nav className="budget-service-search__pagination" aria-label="Paginação dos orçamentos encontrados">
                                <span>
                                    Página <strong>{query.data.page}</strong> de{" "}
                                    <strong>{Math.max(query.data.totalPages, 1)}</strong>
                                    <small> · {query.data.total} orçamento(s)</small>
                                </span>
                                <div>
                                    <button
                                        type="button"
                                        disabled={page <= 1}
                                        onClick={() => changePage(page - 1)}
                                    >
                                        Anterior
                                    </button>
                                    <button
                                        type="button"
                                        disabled={page >= query.data.totalPages}
                                        onClick={() => changePage(page + 1)}
                                    >
                                        Próxima
                                    </button>
                                </div>
                            </nav>
                        </>
                    ) : (
                        <div className="budget-service-search__state budget-service-search__state--empty">
                            <strong>Nenhum orçamento encontrado</strong>
                            <p>Altere os filtros ou o período para ampliar sua pesquisa.</p>
                        </div>
                    )}
                </section>
            </div>
        </Modal>
    );
}
