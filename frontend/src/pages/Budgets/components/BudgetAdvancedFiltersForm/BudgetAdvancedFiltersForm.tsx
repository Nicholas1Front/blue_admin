import type { FormEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBroom, faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import type { FindBudgetsByAdvancedFilters, BudgetStatus } from "../../../../modules/budgets";

const statusLabels: Record<BudgetStatus, string> = {
    rascunho: "Rascunho",
    enviado: "Enviado",
    aprovado: "Aprovado",
    rejeitado: "Rejeitado",
    expirado: "Expirado",
    cancelado: "Cancelado"
};

interface Props {
    values: FindBudgetsByAdvancedFilters;
    onChange: (key: keyof FindBudgetsByAdvancedFilters, value: string, numeric?: boolean) => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    onClear: () => void;
    error: string | null;
}

export function BudgetAdvancedFiltersForm({
    values,
    onChange,
    onSubmit,
    onClear,
    error
}: Props) {
    return (
        <form className="budgets-filter-form" onSubmit={onSubmit}>
            <div className="budgets-filter-form__quick">
                <label className="budgets-filter-field budgets-filter-field--search">
                    <span>Busca geral</span>
                    <input
                        type="search"
                        value={values.search ?? ""}
                        onChange={event => onChange("search", event.target.value)}
                        placeholder="Cliente, documento, equipamento, item ou observação"
                    />
                </label>
                <label className="budgets-filter-field">
                    <span>Código do orçamento</span>
                    <input
                        value={values.budgetId ?? ""}
                        onChange={event => onChange("budgetId", event.target.value)}
                        placeholder="Identificador"
                    />
                </label>
                <label className="budgets-filter-field">
                    <span>Status</span>
                    <select
                        value={values.status ?? ""}
                        onChange={event => onChange("status", event.target.value)}
                    >
                        <option value="">Todos</option>
                        {Object.entries(statusLabels).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                        ))}
                    </select>
                </label>
            </div>

            <div className="budgets-filter-groups">
                <details className="budgets-filter-group" open>
                    <summary>Cliente e equipamento</summary>
                    <div className="budgets-filter-group__fields">
                        <label className="budgets-filter-field">
                            <span>Nome do cliente</span>
                            <input value={values.clientName ?? ""} onChange={event => onChange("clientName", event.target.value)} />
                        </label>
                        <label className="budgets-filter-field">
                            <span>Documento do cliente</span>
                            <input value={values.clientDocument ?? ""} onChange={event => onChange("clientDocument", event.target.value)} />
                        </label>
                        <label className="budgets-filter-field">
                            <span>Cliente (ID)</span>
                            <input value={values.clientId ?? ""} onChange={event => onChange("clientId", event.target.value)} />
                        </label>
                        <label className="budgets-filter-field">
                            <span>Equipamento</span>
                            <input value={values.equipamentSearch ?? ""} onChange={event => onChange("equipamentSearch", event.target.value)} placeholder="Tipo, marca, modelo ou identificação" />
                        </label>
                        <label className="budgets-filter-field">
                            <span>Equipamento (ID)</span>
                            <input value={values.equipamentId ?? ""} onChange={event => onChange("equipamentId", event.target.value)} />
                        </label>
                    </div>
                </details>

                <details className="budgets-filter-group">
                    <summary>Condições do orçamento</summary>
                    <div className="budgets-filter-group__fields">
                        <label className="budgets-filter-field">
                            <span>Condição de pagamento</span>
                            <input value={values.paymentCondition ?? ""} onChange={event => onChange("paymentCondition", event.target.value)} placeholder="Ex.: à vista" />
                        </label>
                        <label className="budgets-filter-field">
                            <span>Validade</span>
                            <input value={values.validity ?? ""} onChange={event => onChange("validity", event.target.value)} />
                        </label>
                        <label className="budgets-filter-field">
                            <span>Garantia</span>
                            <input value={values.warranty ?? ""} onChange={event => onChange("warranty", event.target.value)} />
                        </label>
                        <label className="budgets-filter-field">
                            <span>Prazo de entrega</span>
                            <input value={values.deliveryTime ?? ""} onChange={event => onChange("deliveryTime", event.target.value)} />
                        </label>
                        <label className="budgets-filter-field budgets-filter-field--wide">
                            <span>Observações</span>
                            <input value={values.observations ?? ""} onChange={event => onChange("observations", event.target.value)} />
                        </label>
                    </div>
                </details>

                <details className="budgets-filter-group">
                    <summary>Datas e valores</summary>
                    <div className="budgets-filter-group__fields">
                        <label className="budgets-filter-field">
                            <span>Criado a partir de</span>
                            <input type="date" value={values.createdAtFrom ?? ""} onChange={event => onChange("createdAtFrom", event.target.value)} />
                        </label>
                        <label className="budgets-filter-field">
                            <span>Criado até</span>
                            <input type="date" value={values.createdAtTo ?? ""} onChange={event => onChange("createdAtTo", event.target.value)} />
                        </label>
                        <label className="budgets-filter-field">
                            <span>Atualizado a partir de</span>
                            <input type="date" value={values.updatedAtFrom ?? ""} onChange={event => onChange("updatedAtFrom", event.target.value)} />
                        </label>
                        <label className="budgets-filter-field">
                            <span>Atualizado até</span>
                            <input type="date" value={values.updatedAtTo ?? ""} onChange={event => onChange("updatedAtTo", event.target.value)} />
                        </label>
                        {([
                            ["totalAmountMin", "Valor total mínimo"],
                            ["totalAmountMax", "Valor total máximo"],
                            ["globalDiscountMin", "Desconto global mínimo (%)"],
                            ["globalDiscountMax", "Desconto global máximo (%)"],
                            ["finalAmountMin", "Valor final mínimo"],
                            ["finalAmountMax", "Valor final máximo"]
                        ] as const).map(([key, label]) => (
                            <label className="budgets-filter-field" key={key}>
                                <span>{label}</span>
                                <input
                                    type="number"
                                    min={key.includes("Quantity") ? "0.000001" : "0"}
                                    max={key.includes("Discount") ? 100 : undefined}
                                    step="0.01"
                                    value={values[key] ?? ""}
                                    onChange={event => onChange(key, event.target.value, true)}
                                />
                            </label>
                        ))}
                    </div>
                </details>

                <details className="budgets-filter-group">
                    <summary>Itens e categorias</summary>
                    <div className="budgets-filter-group__fields">
                        <label className="budgets-filter-field">
                            <span>Item (ID)</span>
                            <input value={values.itemId ?? ""} onChange={event => onChange("itemId", event.target.value)} />
                        </label>
                        <label className="budgets-filter-field">
                            <span>Título do item</span>
                            <input value={values.itemTitle ?? ""} onChange={event => onChange("itemTitle", event.target.value)} />
                        </label>
                        <label className="budgets-filter-field">
                            <span>Descrição do item</span>
                            <input value={values.itemDescription ?? ""} onChange={event => onChange("itemDescription", event.target.value)} />
                        </label>
                        <label className="budgets-filter-field">
                            <span>Categoria</span>
                            <input value={values.itemCategoryName ?? ""} onChange={event => onChange("itemCategoryName", event.target.value)} />
                        </label>
                        <label className="budgets-filter-field">
                            <span>Categoria (ID)</span>
                            <input value={values.itemCategoryId ?? ""} onChange={event => onChange("itemCategoryId", event.target.value)} />
                        </label>
                        {([
                            ["itemQuantityMin", "Quantidade mínima"],
                            ["itemQuantityMax", "Quantidade máxima"],
                            ["itemUnitValueMin", "Valor unitário mínimo"],
                            ["itemUnitValueMax", "Valor unitário máximo"],
                            ["itemTotalAmountMin", "Total dos itens mínimo"],
                            ["itemTotalAmountMax", "Total dos itens máximo"],
                            ["itemDiscountMin", "Desconto mínimo (%)"],
                            ["itemDiscountMax", "Desconto máximo (%)"]
                        ] as const).map(([key, label]) => (
                            <label className="budgets-filter-field" key={key}>
                                <span>{label}</span>
                                <input
                                    type="number"
                                    min={key.includes("Quantity") ? "0.000001" : "0"}
                                    max={key.includes("Discount") ? 100 : undefined}
                                    step="0.01"
                                    value={values[key] ?? ""}
                                    onChange={event => onChange(key, event.target.value, true)}
                                />
                            </label>
                        ))}
                    </div>
                </details>

                <details className="budgets-filter-group">
                    <summary>Histórico</summary>
                    <div className="budgets-filter-group__fields">
                        <label className="budgets-filter-field">
                            <span>Histórico (ID)</span>
                            <input value={values.historyId ?? ""} onChange={event => onChange("historyId", event.target.value)} />
                        </label>
                        <label className="budgets-filter-field">
                            <span>Tipo de evento</span>
                            <input value={values.historyEventType ?? ""} onChange={event => onChange("historyEventType", event.target.value)} />
                        </label>
                        <label className="budgets-filter-field budgets-filter-field--wide">
                            <span>Descrição do evento</span>
                            <input value={values.historyDescription ?? ""} onChange={event => onChange("historyDescription", event.target.value)} />
                        </label>
                        <label className="budgets-filter-field">
                            <span>Evento a partir de</span>
                            <input type="date" value={values.historyCreatedAtFrom ?? ""} onChange={event => onChange("historyCreatedAtFrom", event.target.value)} />
                        </label>
                        <label className="budgets-filter-field">
                            <span>Evento até</span>
                            <input type="date" value={values.historyCreatedAtTo ?? ""} onChange={event => onChange("historyCreatedAtTo", event.target.value)} />
                        </label>
                    </div>
                </details>
            </div>

            {error && <p className="budgets-filter-error" role="alert">{error}</p>}

            <div className="budgets-filter-form__actions">
                <button type="button" className="budgets-filter-reset" onClick={onClear}>
                    <FontAwesomeIcon icon={faBroom} aria-hidden="true" />
                    Limpar filtros
                </button>
                <button type="submit" className="budgets-filter-submit">
                    <FontAwesomeIcon icon={faMagnifyingGlass} aria-hidden="true" />
                    Buscar orçamentos
                </button>
            </div>
        </form>
    );
}
