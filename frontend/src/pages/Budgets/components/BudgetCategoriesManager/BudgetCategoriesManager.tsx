import { useState, type FormEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faBan, faCheck, faChevronDown, faChevronUp, faMagnifyingGlass, faPenToSquare, faPlus, faTrashCan
} from "@fortawesome/free-solid-svg-icons";

import { Modal } from "../../../../components/Modal/Modal";
import {
    useBudgetCategories, useBudgetCategoryMutations
} from "../../../../modules/budgets";
import type {
    BudgetCategory, CreateBudgetCategoryRequest, FindBudgetCategoriesFilters
} from "../../../../modules/budgets";
import "./BudgetCategoriesManager.css";

type CategoryForm = { name: string; description: string };
const emptyForm: CategoryForm = { name: "", description: "" };

function getError(error: unknown, fallback: string) {
    return error instanceof Error ? error.message : fallback;
}

export function BudgetCategoriesManager() {
    const [nameFilter, setNameFilter] = useState("");
    const [descriptionFilter, setDescriptionFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
    const [appliedFilters, setAppliedFilters] = useState<FindBudgetCategoriesFilters | undefined>();
    const [editingCategory, setEditingCategory] = useState<BudgetCategory | null>(null);
    const [form, setForm] = useState<CategoryForm>(emptyForm);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [pendingDelete, setPendingDelete] = useState<BudgetCategory | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [isExpanded, setIsExpanded] = useState(true);

    const categoriesQuery = useBudgetCategories(appliedFilters);
    const mutations = useBudgetCategoryMutations();
    const data = categoriesQuery.data;
    const categories = Array.isArray(data) ? data : data?.categories ?? [];
    const total = Array.isArray(data) ? categories.length : data?.total ?? categories.length;
    const isSaving = mutations.create.isPending || mutations.update.isPending;

    function applyFilters(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const filters: FindBudgetCategoriesFilters = {
            ...(nameFilter.trim() ? { name: nameFilter.trim() } : {}),
            ...(descriptionFilter.trim() ? { description: descriptionFilter.trim() } : {}),
            ...(statusFilter !== "all" ? { isActive: statusFilter === "active" } : {})
        };
        setAppliedFilters(Object.keys(filters).length ? { ...filters, page: 1, limit: 100 } : undefined);
    }

    function clearFilters() {
        setNameFilter("");
        setDescriptionFilter("");
        setStatusFilter("all");
        setAppliedFilters(undefined);
    }

    function openCreateModal() {
        setEditingCategory(null);
        setForm(emptyForm);
        setFormError(null);
        setIsFormOpen(true);
    }

    function openEditModal(category: BudgetCategory) {
        setEditingCategory(category);
        setForm({ name: category.name, description: category.description ?? "" });
        setFormError(null);
        setIsFormOpen(true);
    }

    async function saveCategory(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const payload: CreateBudgetCategoryRequest = {
            name: form.name.trim(),
            description: form.description.trim() || null
        };
        if (!payload.name) {
            setFormError("Informe o nome da categoria.");
            return;
        }

        setFormError(null);
        try {
            if (editingCategory) {
                await mutations.update.mutateAsync({ id: editingCategory.id, data: payload });
            } else {
                await mutations.create.mutateAsync(payload);
            }
            setIsFormOpen(false);
            setForm(emptyForm);
        } catch (error) {
            setFormError(getError(error, "Não foi possível salvar a categoria."));
        }
    }

    async function toggleStatus(category: BudgetCategory) {
        setActionError(null);
        try {
            if (category.isActive) {
                await mutations.deactivate.mutateAsync(category.id);
            } else {
                await mutations.activate.mutateAsync(category.id);
            }
        } catch (error) {
            setActionError(getError(error, "Não foi possível alterar a situação da categoria."));
        }
    }

    async function deleteCategory() {
        if (!pendingDelete) return;
        setDeleteError(null);
        try {
            await mutations.remove.mutateAsync(pendingDelete.id);
            setPendingDelete(null);
        } catch (error) {
            setDeleteError(getError(error, "Não foi possível excluir a categoria."));
        }
    }

    return (
        <section className="budget-category-manager" aria-labelledby="budget-category-manager-title">
            <header className="budget-category-manager__heading">
                <div>
                    <span className="budgets-section-eyebrow">Organização comercial</span>
                    <h2 id="budget-category-manager-title">Gerenciador de categorias</h2>
                    <p>Consulte e mantenha as categorias usadas nos itens dos orçamentos.</p>
                </div>
                <div className="budget-category-manager__heading-actions">
                    <button
                        className="budget-category-manager__collapse"
                        type="button"
                        aria-expanded={isExpanded}
                        aria-controls="budget-category-manager-content"
                        onClick={() => setIsExpanded(value => !value)}
                    >
                        <FontAwesomeIcon icon={isExpanded ? faChevronUp : faChevronDown} aria-hidden="true" />
                        {isExpanded ? "Recolher" : "Expandir"}
                    </button>
                    <button className="budget-category-manager__primary" type="button" onClick={openCreateModal}>
                        <FontAwesomeIcon icon={faPlus} /> Criar categoria
                    </button>
                </div>
            </header>

            <div id="budget-category-manager-content" hidden={!isExpanded}>
            <form className="budget-category-manager__filters" onSubmit={applyFilters}>
                <label>
                    <span>Nome</span>
                    <input value={nameFilter} onChange={event => setNameFilter(event.target.value)} placeholder="Buscar por nome" />
                </label>
                <label>
                    <span>Descrição</span>
                    <input value={descriptionFilter} onChange={event => setDescriptionFilter(event.target.value)} placeholder="Buscar por descrição" />
                </label>
                <label>
                    <span>Situação</span>
                    <select value={statusFilter} onChange={event => setStatusFilter(event.target.value as typeof statusFilter)}>
                        <option value="all">Todas</option>
                        <option value="active">Ativas</option>
                        <option value="inactive">Inativas</option>
                    </select>
                </label>
                <div className="budget-category-manager__filter-actions">
                    <button type="button" className="is-secondary" onClick={clearFilters}>Limpar</button>
                    <button type="submit" className="is-primary"><FontAwesomeIcon icon={faMagnifyingGlass} /> Consultar</button>
                </div>
            </form>

            <div className="budget-category-manager__results">
                <div className="budget-category-manager__results-heading">
                    <strong>Categorias cadastradas</strong>
                    <span>{total} {total === 1 ? "categoria" : "categorias"}</span>
                </div>

                {actionError && <p className="budget-category-manager__error" role="alert">{actionError}</p>}
                {categoriesQuery.isError && <p className="budget-category-manager__error" role="alert">Não foi possível carregar as categorias.</p>}

                {categoriesQuery.isPending ? (
                    <div className="budget-category-manager__empty">Carregando categorias…</div>
                ) : categories.length === 0 ? (
                    <div className="budget-category-manager__empty">
                        <strong>Nenhuma categoria encontrada</strong>
                        <span>Altere os filtros ou crie uma nova categoria.</span>
                    </div>
                ) : (
                    <div className="budget-category-manager__list">
                        {categories.map(category => (
                            <article className="budget-category-manager__item" key={category.id}>
                                <div className="budget-category-manager__item-copy">
                                    <div className="budget-category-manager__item-title">
                                        <strong>{category.name}</strong>
                                        <span className={category.isActive ? "is-active" : "is-inactive"}>
                                            {category.isActive ? "Ativa" : "Inativa"}
                                        </span>
                                    </div>
                                    <p>{category.description || "Sem descrição cadastrada."}</p>
                                </div>
                                <div className="budget-category-manager__item-actions">
                                    <button type="button" onClick={() => openEditModal(category)} aria-label={`Editar categoria ${category.name}`} title="Editar">
                                        <FontAwesomeIcon icon={faPenToSquare} />
                                    </button>
                                    <button type="button" onClick={() => void toggleStatus(category)} aria-label={category.isActive ? `Desativar categoria ${category.name}` : `Ativar categoria ${category.name}`} title={category.isActive ? "Desativar" : "Ativar"} disabled={mutations.activate.isPending || mutations.deactivate.isPending}>
                                        <FontAwesomeIcon icon={category.isActive ? faBan : faCheck} />
                                    </button>
                                    <button type="button" className="is-danger" onClick={() => { setPendingDelete(category); setDeleteError(null); }} aria-label={`Excluir categoria ${category.name}`} title="Excluir">
                                        <FontAwesomeIcon icon={faTrashCan} />
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </div>
            </div>

            <Modal isOpen={isFormOpen} title={editingCategory ? "Editar categoria" : "Criar categoria"} onClose={() => setIsFormOpen(false)}>
                <form className="budget-category-manager__form" onSubmit={saveCategory}>
                    <label>Nome<input value={form.name} onChange={event => setForm(current => ({ ...current, name: event.target.value }))} maxLength={120} required autoFocus /></label>
                    <label>Descrição<textarea rows={3} value={form.description} onChange={event => setForm(current => ({ ...current, description: event.target.value }))} maxLength={500} /></label>
                    {formError && <p className="budget-category-manager__error" role="alert">{formError}</p>}
                    <div className="budget-category-manager__modal-actions">
                        <button type="button" className="is-secondary" onClick={() => setIsFormOpen(false)}>Cancelar</button>
                        <button type="submit" className="is-primary" disabled={isSaving}>{isSaving ? "Salvando…" : "Salvar categoria"}</button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={Boolean(pendingDelete)} title="Excluir categoria" onClose={() => { setPendingDelete(null); setDeleteError(null); }}>
                <div className="budget-category-manager__confirm">
                    <p>Deseja excluir a categoria <strong>{pendingDelete?.name}</strong>?</p>
                    <span>Uma categoria vinculada a itens de orçamento ou à tabela de preços não pode ser excluída. Nesse caso, você poderá desativá-la para impedir novos usos.</span>
                    {deleteError && <p className="budget-category-manager__error" role="alert">{deleteError}</p>}
                    <div className="budget-category-manager__modal-actions">
                        <button type="button" className="is-secondary" onClick={() => { setPendingDelete(null); setDeleteError(null); }}>Cancelar</button>
                        <button type="button" className="is-danger" onClick={() => void deleteCategory()} disabled={mutations.remove.isPending}>{mutations.remove.isPending ? "Excluindo…" : "Confirmar exclusão"}</button>
                    </div>
                </div>
            </Modal>
        </section>
    );
}
