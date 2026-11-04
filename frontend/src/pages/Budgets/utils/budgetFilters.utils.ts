import type { FindBudgetsByAdvancedFilters } from "../../../modules/budgets";

export function updateBudgetAdvancedFilter(
    current: FindBudgetsByAdvancedFilters,
    key: keyof FindBudgetsByAdvancedFilters,
    value: string,
    numeric = false
): FindBudgetsByAdvancedFilters {
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
}

export function validateBudgetAdvancedFilters(
    filters: FindBudgetsByAdvancedFilters
): string | null {
    const activeFilters = Object.entries(filters).filter(
        ([key, value]) =>
            !["page", "limit"].includes(key) &&
            value !== undefined &&
            value !== ""
    );

    if (activeFilters.length === 0) {
        return "Informe ao menos um filtro para realizar a consulta.";
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
        const min = filters[minKey];
        const max = filters[maxKey];

        if (typeof min === "number" && typeof max === "number" && min > max) {
            return `${label}: o valor mínimo não pode ser maior que o máximo.`;
        }

        if (typeof min === "string" && typeof max === "string" && min > max) {
            return `${label}: a data inicial não pode ser posterior à data final.`;
        }
    }

    return null;
}
