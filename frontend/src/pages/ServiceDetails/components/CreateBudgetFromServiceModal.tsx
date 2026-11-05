import { useEffect, useMemo, useState, type FormEvent } from "react";

import { Modal } from "../../../components/Modal/Modal";
import {
    useBudgetCategories,
    useBudgetCategoryMutations,
    useBudgetMutations
} from "../../../modules/budgets";
import type { BudgetCategory } from "../../../modules/budgets";
import type { ServiceActivity, ServiceActivityStatus } from "../../../modules/services";
import "./CreateBudgetFromServiceModal.css";

interface Props {
    isOpen: boolean;
    serviceId: string;
    activities: ServiceActivity[];
    onClose: () => void;
    onCreated: (budgetId: string) => void;
}

const activityStatusLabels: Record<ServiceActivityStatus, string> = {
    pendente: "Pendente",
    "em_execução": "Em execução",
    concluida: "Concluída",
    cancelada: "Cancelada"
};

export function CreateBudgetFromServiceModal({
    isOpen,
    serviceId,
    activities,
    onClose,
    onCreated
}: Props) {
    const categoriesQuery = useBudgetCategories();
    const categoryMutations = useBudgetCategoryMutations();
    const budgetMutations = useBudgetMutations();

    const [selectedActivityIds, setSelectedActivityIds] = useState<string[]>([]);
    const [categoryByActivity, setCategoryByActivity] = useState<Record<string, string>>({});
    const [createdCategories, setCreatedCategories] = useState<BudgetCategory[]>([]);
    const [creatingCategoryFor, setCreatingCategoryFor] = useState<string | null>(null);
    const [categoryName, setCategoryName] = useState("");
    const [error, setError] = useState<string | null>(null);

    const categories = useMemo(() => {
        const serverCategories = Array.isArray(categoriesQuery.data) ? categoriesQuery.data : [];
        const byId = new Map<string, BudgetCategory>();
        [...serverCategories, ...createdCategories].forEach(category => byId.set(category.id, category));
        return [...byId.values()]
            .filter(category => category.isActive)
            .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    }, [categoriesQuery.data, createdCategories]);

    useEffect(() => {
        if (!isOpen) return;
        setSelectedActivityIds([]);
        setCategoryByActivity({});
        setCreatedCategories([]);
        setCreatingCategoryFor(null);
        setCategoryName("");
        setError(null);
    }, [isOpen, serviceId]);

    function toggleActivity(activityId: string, checked: boolean) {
        setSelectedActivityIds(current => checked
            ? (current.includes(activityId) ? current : [...current, activityId])
            : current.filter(id => id !== activityId)
        );
        if (!checked) {
            setCategoryByActivity(current => {
                const next = { ...current };
                delete next[activityId];
                return next;
            });
            if (creatingCategoryFor === activityId) setCreatingCategoryFor(null);
        }
    }

    async function createCategory(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const targetActivityId = creatingCategoryFor;
        const name = categoryName.trim();
        if (!targetActivityId || !name) return;

        setError(null);
        try {
            const category = await categoryMutations.create.mutateAsync({ name });
            setCreatedCategories(current => [...current.filter(item => item.id !== category.id), category]);
            setSelectedActivityIds(current => current.includes(targetActivityId)
                ? current
                : [...current, targetActivityId]
            );
            setCategoryByActivity(current => ({ ...current, [targetActivityId]: category.id }));
            setCreatingCategoryFor(null);
            setCategoryName("");
        } catch (caught) {
            setError(caught instanceof Error ? caught.message : "Não foi possível criar a categoria.");
        }
    }

    async function createBudget() {
        setError(null);
        const items = selectedActivityIds.map(activityId => ({
            activityId,
            budgetCategoryId: categoryByActivity[activityId] ?? ""
        }));

        if (items.length === 0 || items.some(item => !item.budgetCategoryId)) {
            setError("Selecione ao menos uma atividade e defina uma categoria para cada atividade selecionada.");
            return;
        }

        try {
            const result = await budgetMutations.createFromService.mutateAsync({ serviceId, items });
            onCreated(result.budget.id);
        } catch (caught) {
            setError(caught instanceof Error ? caught.message : "Não foi possível criar o orçamento a partir deste serviço.");
        }
    }

    const isSaving = budgetMutations.createFromService.isPending;
    const isCreatingCategory = categoryMutations.create.isPending;
    const canCreateBudget = selectedActivityIds.length > 0
        && selectedActivityIds.every(activityId => Boolean(categoryByActivity[activityId]))
        && !isSaving
        && !isCreatingCategory
        && !categoriesQuery.isPending
        && !categoriesQuery.isError;

    return (
        <Modal
            isOpen={isOpen}
            title="Criar orçamento a partir deste serviço"
            onClose={onClose}
            size="wide"
        >
            <div className="create-budget-from-service">
                <header className="create-budget-from-service__intro">
                    <span>Seleção de atividades</span>
                    <p>
                        Marque as atividades que deseja levar para o orçamento e escolha
                        uma categoria para cada item. O cliente e o equipamento serão
                        preenchidos automaticamente com os dados deste serviço.
                    </p>
                </header>

                {categoriesQuery.isPending ? (
                    <div className="create-budget-from-service__state">Carregando categorias de orçamento…</div>
                ) : categoriesQuery.isError ? (
                    <div className="create-budget-from-service__state" role="alert">
                        <strong>Não foi possível carregar as categorias.</strong>
                        <button type="button" onClick={() => void categoriesQuery.refetch()}>Tentar novamente</button>
                    </div>
                ) : null}

                {activities.length === 0 ? (
                    <div className="create-budget-from-service__state">
                        <strong>Este serviço ainda não possui atividades.</strong>
                        <p>Adicione atividades ao serviço antes de criar um orçamento a partir dele.</p>
                    </div>
                ) : (
                    <div className="create-budget-from-service__list">
                        {activities.map(activity => {
                            const isSelected = selectedActivityIds.includes(activity.id);
                            return (
                                <article className="create-budget-from-service__activity" key={activity.id}>
                                    <div className="create-budget-from-service__activity-top">
                                        <label className="create-budget-from-service__check">
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                disabled={isCreatingCategory}
                                                onChange={event => toggleActivity(activity.id, event.target.checked)}
                                            />
                                            <span>
                                                <strong>{activity.title}</strong>
                                                <small>{activityStatusLabels[activity.status]} · ID: {activity.id}</small>
                                            </span>
                                        </label>
                                    </div>

                                    {activity.description && (
                                        <p className="create-budget-from-service__description">{activity.description}</p>
                                    )}

                                    <div className="create-budget-from-service__category-row">
                                        <label>
                                            <span>Categoria do orçamento</span>
                                            <select
                                                value={categoryByActivity[activity.id] ?? ""}
                                                disabled={!isSelected || categoriesQuery.isPending || categoriesQuery.isError}
                                                onChange={event => setCategoryByActivity(current => ({
                                                    ...current,
                                                    [activity.id]: event.target.value
                                                }))}
                                            >
                                                <option value="">Selecione uma categoria</option>
                                                {categories.map(category => (
                                                    <option key={category.id} value={category.id}>{category.name}</option>
                                                ))}
                                            </select>
                                        </label>
                                        <button
                                            type="button"
                                            className="create-budget-from-service__new-category"
                                            disabled={!isSelected || isCreatingCategory}
                                            onClick={() => {
                                                setError(null);
                                                setCreatingCategoryFor(current => current === activity.id ? null : activity.id);
                                                setCategoryName("");
                                            }}
                                        >
                                            Nova categoria
                                        </button>
                                    </div>

                                    {creatingCategoryFor === activity.id && (
                                        <form className="create-budget-from-service__category-form" onSubmit={createCategory}>
                                            <label>
                                                <span>Nome da nova categoria</span>
                                                <input
                                                    value={categoryName}
                                                    onChange={event => setCategoryName(event.target.value)}
                                                    maxLength={100}
                                                    required
                                                    autoFocus
                                                />
                                            </label>
                                            <div>
                                                <button type="button" onClick={() => setCreatingCategoryFor(null)}>Cancelar</button>
                                                <button type="submit" disabled={isCreatingCategory || !categoryName.trim()}>
                                                    {isCreatingCategory ? "Criando…" : "Criar categoria"}
                                                </button>
                                            </div>
                                        </form>
                                    )}
                                </article>
                            );
                        })}
                    </div>
                )}

                <div className="create-budget-from-service__summary">
                    <strong>{selectedActivityIds.length} de {activities.length} atividade(s) selecionada(s)</strong>
                    <p>Os itens serão criados com quantidade 1 e valor unitário R$ 0,00. Você poderá preencher os valores no detalhamento do orçamento.</p>
                </div>

                {error && <p className="create-budget-from-service__error" role="alert">{error}</p>}

                <footer className="create-budget-from-service__actions">
                    <button type="button" onClick={onClose} disabled={isSaving}>Cancelar</button>
                    <button
                        type="button"
                        className="create-budget-from-service__submit"
                        onClick={() => void createBudget()}
                        disabled={!canCreateBudget || activities.length === 0}
                    >
                        {isSaving ? "Criando orçamento…" : "Criar orçamento"}
                    </button>
                </footer>
            </div>
        </Modal>
    );
}
