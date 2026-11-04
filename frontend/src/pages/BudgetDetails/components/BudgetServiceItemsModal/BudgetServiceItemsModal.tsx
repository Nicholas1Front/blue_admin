import { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWrench } from "@fortawesome/free-solid-svg-icons";
import { Modal } from "../../../../components/Modal/Modal";
import { useCreateServiceFromBudget } from "../../../../modules/services/services.hooks";
import type { BudgetDetailsResponse } from "../../../../modules/budgets";
import "./BudgetServiceItemsModal.css";

interface Props {
    isOpen: boolean;
    budget: BudgetDetailsResponse;
    onClose: () => void;
    onCreated: (serviceId: string) => void;
}

export function BudgetServiceItemsModal({ isOpen, budget, onClose, onCreated }: Props) {
    const createService = useCreateServiceFromBudget();
    const items = useMemo(() => budget.items.categories.flatMap(category =>
        category.items.map(item => ({ ...item, categoryName: category.name }))
    ), [budget.items.categories]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setSelectedIds(items.map(item => item.id));
            setError(null);
        }
    }, [isOpen, items]);

    function toggleItem(itemId: string, checked: boolean) {
        setSelectedIds(current => checked
            ? [...current, itemId]
            : current.filter(id => id !== itemId));
    }

    async function submit() {
        if (selectedIds.length === 0) {
            setError("Selecione ao menos um item para criar o serviço.");
            return;
        }
        setError(null);
        try {
            const result = await createService.mutateAsync({
                budgetId: budget.budget.id,
                budgetItemIds: items.filter(item => selectedIds.includes(item.id)).map(item => item.id)
            });
            onCreated(result.service.id);
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "Não foi possível criar o serviço.");
        }
    }

    return (
        <Modal isOpen={isOpen} title="Criar serviço a partir do orçamento" onClose={onClose} size="wide">
            <div className="budget-service-items">
                <div className="budget-service-items__context">
                    <span>Orçamento #{budget.budget.id}</span>
                    <strong>{budget.client.name}</strong>
                    <small>Os itens selecionados serão copiados como atividades do novo serviço. Os valores e descontos do orçamento não são transferidos.</small>
                </div>
                {items.length === 0 ? <div className="budget-service-items__empty">Este orçamento ainda não possui itens para converter.</div> : <>
                    <div className="budget-service-items__heading"><strong>Itens que serão convertidos</strong><span>{selectedIds.length} de {items.length} selecionado(s)</span></div>
                    <div className="budget-service-items__list">
                        {items.map(item => <label className="budget-service-items__item" key={item.id}>
                            <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={event => toggleItem(item.id, event.target.checked)} disabled={createService.isPending} />
                            <span><strong>{item.title}</strong><small>{item.categoryName}{item.description ? ` · ${item.description}` : ""}</small></span>
                        </label>)}
                    </div>
                </>}
                {error && <p className="budget-service-items__error" role="alert">{error}</p>}
                <div className="budget-service-items__actions">
                    <button type="button" onClick={onClose} disabled={createService.isPending}>Cancelar</button>
                    <button type="button" className="is-primary" onClick={() => void submit()} disabled={items.length === 0 || selectedIds.length === 0 || createService.isPending}>
                        <FontAwesomeIcon icon={faWrench} /> {createService.isPending ? "Criando serviço..." : "Criar serviço"}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
