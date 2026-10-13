import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faCheck,
    faCircleCheck,
    faCircleXmark,
    faMagnifyingGlass,
    faPenToSquare,
    faPlus,
    faRotateLeft,
    faToggleOff,
    faToggleOn,
    faTriangleExclamation
} from "@fortawesome/free-solid-svg-icons";

import { AppHeader } from "../../components/AppHeader/AppHeader";
import { BackLink } from "../../components/BackLink/BackLink";
import { Modal } from "../../components/Modal/Modal";
import {
    useCategories,
    useCategoryMutations
} from "../../modules/financial";
import type {
    CreateCategoryRequest,
    FindCategoryFilters,
    FinancialCategory,
    UpdateCategoryRequest
} from "../../modules/financial/categories/categories.types";
import type { FinancialType } from "../../modules/financial/shared/financial.types";
import {
    categoryFormSchema,
    type CategoryFormValues
} from "./category.schema";

import "./CategoryPanel.css";

function getErrorMessage(error: unknown, fallback: string) {
    return error instanceof Error ? error.message : fallback;
}

function formatDateTime(value: string) {
    return new Date(value).toLocaleString("pt-BR", {
        dateStyle: "short",
        timeStyle: "short"
    });
}

function CategoryFormModal({
    isOpen,
    category,
    isSubmitting,
    error,
    onClose,
    onSubmit
}: {
    isOpen: boolean;
    category: FinancialCategory | null;
    isSubmitting: boolean;
    error: string | null;
    onClose: () => void;
    onSubmit: (data: CreateCategoryRequest) => Promise<void>;
}) {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm<CategoryFormValues>({
        resolver: zodResolver(categoryFormSchema),
        defaultValues: { name: "", description: "", type: "expense" }
    });

    useEffect(() => {
        if (!isOpen) return;
        reset({
            name: category?.name ?? "",
            description: category?.description ?? "",
            type: category?.type ?? "expense"
        });
    }, [category, isOpen, reset]);

    async function submit(values: CategoryFormValues) {
        await onSubmit({
            name: values.name.trim(),
            description: values.description.trim() || null,
            type: values.type
        });
    }

    return (
        <Modal
            isOpen={isOpen}
            title={category ? "Editar categoria" : "Adicionar categoria"}
            onClose={onClose}
        >
            <form className="category-form" onSubmit={handleSubmit(submit)}>
                <div className="category-field">
                    <label htmlFor="category-name">Nome</label>
                    <input
                        id="category-name"
                        autoFocus
                        {...register("name")}
                        disabled={isSubmitting}
                        placeholder="Ex.: Manutenção"
                    />
                    {errors.name && <span className="category-form-error">{errors.name.message}</span>}
                </div>

                <div className="category-field">
                    <label htmlFor="category-description">Descrição <span>(opcional)</span></label>
                    <textarea
                        id="category-description"
                        rows={3}
                        {...register("description")}
                        disabled={isSubmitting}
                        placeholder="Explique para que essa categoria será utilizada"
                    />
                </div>

                <div className="category-field">
                    <label htmlFor="category-type">Tipo</label>
                    <select id="category-type" {...register("type")} disabled={isSubmitting}>
                        <option value="income">Entrada (income)</option>
                        <option value="expense">Saída (expense)</option>
                    </select>
                    {errors.type && <span className="category-form-error">{errors.type.message}</span>}
                </div>

                {error && <p className="category-form-error" role="alert">{error}</p>}

                <div className="category-modal__actions">
                    <button className="category-button category-button--secondary" type="button" onClick={onClose} disabled={isSubmitting}>
                        Cancelar
                    </button>
                    <button className="category-button category-button--primary" type="submit" disabled={isSubmitting}>
                        <FontAwesomeIcon icon={faCheck} />
                        {isSubmitting ? "Salvando…" : category ? "Salvar alterações" : "Adicionar categoria"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

function CategorySearch({
    isSearching,
    hasSearched,
    onSearch,
    onClear
}: {
    isSearching: boolean;
    hasSearched: boolean;
    onSearch: (filters: FindCategoryFilters) => void;
    onClear: () => void;
}) {
    const [id, setId] = useState("");
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [type, setType] = useState<"" | FinancialType>("");
    const [active, setActive] = useState("");

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const filters: FindCategoryFilters = {
            id: id.trim() || undefined,
            name: name.trim() || undefined,
            description: description.trim() || undefined,
            type: type || undefined,
            active: active === "" ? undefined : active === "true"
        };
        if (Object.values(filters).every((value) => value === undefined)) {
            onClear();
            return;
        }
        onSearch(filters);
    }

    function clear() {
        setId("");
        setName("");
        setDescription("");
        setType("");
        setActive("");
        onClear();
    }

    return (
        <section className="category-search" aria-labelledby="category-search-title">
            <div className="category-section-heading">
                <div>
                    <span className="category-eyebrow">Consulta</span>
                    <h2 id="category-search-title">Pesquisar categorias</h2>
                    <p>Combine os filtros disponíveis para localizar categorias específicas.</p>
                </div>
            </div>
            <form className="category-search__form" onSubmit={submit}>
                <div className="category-field">
                    <label htmlFor="category-filter-id">ID</label>
                    <input id="category-filter-id" value={id} onChange={(event) => setId(event.target.value)} placeholder="ID da categoria" disabled={isSearching} />
                </div>
                <div className="category-field">
                    <label htmlFor="category-filter-name">Nome</label>
                    <input id="category-filter-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Nome da categoria" disabled={isSearching} />
                </div>
                <div className="category-field">
                    <label htmlFor="category-filter-description">Descrição</label>
                    <input id="category-filter-description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Buscar na descrição" disabled={isSearching} />
                </div>
                <div className="category-field">
                    <label htmlFor="category-filter-type">Tipo</label>
                    <select id="category-filter-type" value={type} onChange={(event) => setType(event.target.value as "" | FinancialType)} disabled={isSearching}>
                        <option value="">Todos</option>
                        <option value="income">Entrada (income)</option>
                        <option value="expense">Saída (expense)</option>
                    </select>
                </div>
                <div className="category-field">
                    <label htmlFor="category-filter-active">Situação</label>
                    <select id="category-filter-active" value={active} onChange={(event) => setActive(event.target.value)} disabled={isSearching}>
                        <option value="">Todas</option>
                        <option value="true">Ativas</option>
                        <option value="false">Desativadas</option>
                    </select>
                </div>
                <div className="category-search__actions">
                    <button className="category-button category-button--secondary" type="button" onClick={clear} disabled={isSearching && !hasSearched}>
                        <FontAwesomeIcon icon={faRotateLeft} /> Limpar filtros
                    </button>
                    <button className="category-button category-button--primary" type="submit" disabled={isSearching}>
                        <FontAwesomeIcon icon={faMagnifyingGlass} />
                        {isSearching ? "Pesquisando…" : "Pesquisar"}
                    </button>
                </div>
            </form>
        </section>
    );
}

function CategoryList({
    title,
    type,
    categories,
    isLoading,
    hasSearched,
    onEdit,
    onToggleStatus
}: {
    title: string;
    type: FinancialType;
    categories: FinancialCategory[];
    isLoading: boolean;
    hasSearched: boolean;
    onEdit: (category: FinancialCategory) => void;
    onToggleStatus: (category: FinancialCategory) => void;
}) {
    const rows = categories.filter((category) => category.type === type);

    return (
        <section className="category-list-section" aria-label={title}>
            <header className="category-list-section__heading">
                <div>
                    <span className="category-eyebrow">{type === "income" ? "Receitas" : "Despesas"}</span>
                    <h2>{title}</h2>
                    <p>{type === "income" ? "Categorias usadas para organizar as entradas financeiras." : "Categorias usadas para organizar as saídas financeiras."}</p>
                </div>
                <span className="category-list-count">{isLoading ? "…" : rows.length} {rows.length === 1 ? "categoria" : "categorias"}</span>
            </header>

            {isLoading ? (
                <div className="category-empty-state">Carregando categorias…</div>
            ) : rows.length === 0 ? (
                <div className="category-empty-state">
                    <strong>{hasSearched ? "Nenhuma categoria encontrada" : "Nenhuma categoria cadastrada"}</strong>
                    <p>{hasSearched ? "Altere os filtros ou limpe a pesquisa para ver outras categorias." : "Use “Adicionar categoria” para criar o primeiro cadastro deste tipo."}</p>
                </div>
            ) : (
                <div className="category-list">
                    {rows.map((category) => (
                        <article className="category-card" key={category.id}>
                            <div className="category-card__main">
                                <div className="category-card__title-row">
                                    <div className="category-card__title">
                                        <h3>{category.name}</h3>
                                        <span className={`category-status category-status--${category.active ? "active" : "inactive"}`}>
                                            <FontAwesomeIcon icon={category.active ? faCircleCheck : faCircleXmark} />
                                            {category.active ? "Ativa" : "Desativada"}
                                        </span>
                                    </div>
                                    <span className={`category-type category-type--${category.type}`}>
                                        {category.type === "income" ? "Entrada · income" : "Saída · expense"}
                                    </span>
                                </div>
                                <div className="category-card__description">
                                    <span>Descrição</span>
                                    <p>{category.description || "Sem descrição informada."}</p>
                                </div>
                                <dl className="category-card__details">
                                    <div><dt>ID</dt><dd className="category-card__id" title={category.id}>{category.id}</dd></div>
                                    <div><dt>Tipo</dt><dd>{category.type}</dd></div>
                                    <div><dt>Situação</dt><dd>{category.active ? "Ativa" : "Desativada"}</dd></div>
                                    <div><dt>Criada em</dt><dd>{formatDateTime(category.createdAt)}</dd></div>
                                    <div><dt>Atualizada em</dt><dd>{formatDateTime(category.updatedAt)}</dd></div>
                                </dl>
                            </div>
                            <div className="category-card__actions" aria-label={`Ações para ${category.name}`}>
                                <button className="category-icon-button" type="button" onClick={() => onEdit(category)} aria-label={`Editar ${category.name}`} title="Editar">
                                    <FontAwesomeIcon icon={faPenToSquare} />
                                </button>
                                <button
                                    className={`category-icon-button ${category.active ? "category-icon-button--danger" : "category-icon-button--success"}`}
                                    type="button"
                                    onClick={() => onToggleStatus(category)}
                                    aria-label={category.active ? `Desativar ${category.name}` : `Ativar ${category.name}`}
                                    title={category.active ? "Desativar" : "Ativar"}
                                >
                                    <FontAwesomeIcon icon={category.active ? faToggleOff : faToggleOn} />
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </section>
    );
}

function CategoryStatusModal({
    category,
    isSubmitting,
    error,
    onClose,
    onConfirm
}: {
    category: FinancialCategory | null;
    isSubmitting: boolean;
    error: string | null;
    onClose: () => void;
    onConfirm: () => Promise<void>;
}) {
    const activating = category !== null && !category.active;
    return (
        <Modal
            isOpen={category !== null}
            title={activating ? "Ativar categoria" : "Desativar categoria"}
            onClose={onClose}
        >
            {category && (
                <div className="category-status-modal">
                    <div className="category-status-modal__warning">
                        <FontAwesomeIcon icon={faTriangleExclamation} />
                        <div>
                            <strong>{activating ? "Deseja ativar esta categoria?" : "Deseja desativar esta categoria?"}</strong>
                            <p>
                                {activating
                                    ? <>A categoria <strong>{category.name}</strong> ficará disponível para novos lançamentos.</>
                                    : <>A categoria <strong>{category.name}</strong> deixará de ficar disponível para novos lançamentos. Os registros existentes serão mantidos.</>}
                            </p>
                        </div>
                    </div>
                    {error && <p className="category-form-error" role="alert">{error}</p>}
                    <div className="category-modal__actions">
                        <button className="category-button category-button--secondary" type="button" onClick={onClose} disabled={isSubmitting}>Cancelar</button>
                        <button className={`category-button ${activating ? "category-button--success" : "category-button--danger"}`} type="button" onClick={onConfirm} disabled={isSubmitting}>
                            <FontAwesomeIcon icon={activating ? faToggleOn : faToggleOff} />
                            {isSubmitting ? "Processando…" : activating ? "Ativar categoria" : "Desativar categoria"}
                        </button>
                    </div>
                </div>
            )}
        </Modal>
    );
}

export function CategoryPanel() {
    document.title = "Categorias financeiras | Blue Admin";

    const [filters, setFilters] = useState<FindCategoryFilters | undefined>();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<FinancialCategory | null>(null);
    const [statusCategory, setStatusCategory] = useState<FinancialCategory | null>(null);

    const allCategoriesQuery = useCategories();
    const filteredCategoriesQuery = useCategories(filters);
    const mutations = useCategoryMutations();

    const hasSearched = filters !== undefined;
    const listQuery = hasSearched ? filteredCategoriesQuery : allCategoriesQuery;
    const allCategories = allCategoriesQuery.data ?? [];
    const visibleCategories = listQuery.data ?? [];

    const metrics = useMemo(() => ({
        active: allCategories.filter((category) => category.active).length,
        inactive: allCategories.filter((category) => !category.active).length,
        income: allCategories.filter((category) => category.type === "income").length,
        expense: allCategories.filter((category) => category.type === "expense").length
    }), [allCategories]);

    const formMutation = editingCategory ? mutations.update : mutations.create;
    const formError = editingCategory
        ? getErrorMessage(mutations.update.error, "")
        : getErrorMessage(mutations.create.error, "");
    const statusMutation = statusCategory?.active ? mutations.deactivate : mutations.activate;
    const statusError = statusCategory?.active ? mutations.deactivate.error : mutations.activate.error;

    function openCreateModal() {
        mutations.create.reset();
        mutations.update.reset();
        setEditingCategory(null);
        setIsFormOpen(true);
    }

    function openEditModal(category: FinancialCategory) {
        mutations.create.reset();
        mutations.update.reset();
        setEditingCategory(category);
        setIsFormOpen(true);
    }

    function closeFormModal() {
        if (mutations.create.isPending || mutations.update.isPending) return;
        setIsFormOpen(false);
        setEditingCategory(null);
    }

    async function handleSave(data: CreateCategoryRequest) {
        try {
            if (editingCategory) {
                const updateData: UpdateCategoryRequest = data;
                await mutations.update.mutateAsync({ id: editingCategory.id, data: updateData });
            } else {
                await mutations.create.mutateAsync(data);
            }
            setIsFormOpen(false);
            setEditingCategory(null);
        } catch {
            // O erro da mutação é exibido no formulário.
        }
    }

    function openStatusModal(category: FinancialCategory) {
        mutations.activate.reset();
        mutations.deactivate.reset();
        setStatusCategory(category);
    }

    function closeStatusModal() {
        if (mutations.activate.isPending || mutations.deactivate.isPending) return;
        setStatusCategory(null);
    }

    async function handleConfirmStatus() {
        if (!statusCategory) return;
        try {
            if (statusCategory.active) {
                await mutations.deactivate.mutateAsync(statusCategory.id);
            } else {
                await mutations.activate.mutateAsync(statusCategory.id);
            }
            setStatusCategory(null);
        } catch {
            // O erro da mutação é exibido na confirmação.
        }
    }

    const isLoading = listQuery.isPending;
    const isSearching = hasSearched && filteredCategoriesQuery.isFetching;
    const listError = listQuery.isError
        ? getErrorMessage(listQuery.error, "Não foi possível carregar as categorias.")
        : null;

    return (
        <main className="category-page">
            <AppHeader />
            <nav className="page-back-row" aria-label="Navegação da página">
                <BackLink to="/financial" label="Voltar ao dashboard financeiro" />
            </nav>

            <section className="category-content">
                <header className="category-page-heading">
                    <div>
                        <span className="category-eyebrow">Gestão financeira</span>
                        <h1>Categorias</h1>
                        <p>Organize as categorias de entrada e saída utilizadas nos lançamentos financeiros.</p>
                    </div>
                </header>

                <section className="category-metrics" aria-label="Resumo das categorias">
                    <article className="category-metric category-metric--blue">
                        <span>Categorias ativas</span>
                        <strong>{allCategoriesQuery.isPending ? "…" : metrics.active}</strong>
                        <small>Disponíveis para novos lançamentos</small>
                    </article>
                    <article className="category-metric category-metric--muted">
                        <span>Categorias desativadas</span>
                        <strong>{allCategoriesQuery.isPending ? "…" : metrics.inactive}</strong>
                        <small>Cadastros preservados no histórico</small>
                    </article>
                    <article className="category-metric category-metric--green">
                        <span>Categorias de entrada</span>
                        <strong>{allCategoriesQuery.isPending ? "…" : metrics.income}</strong>
                        <small>Tipo income</small>
                    </article>
                    <article className="category-metric category-metric--amber">
                        <span>Categorias de saída</span>
                        <strong>{allCategoriesQuery.isPending ? "…" : metrics.expense}</strong>
                        <small>Tipo expense</small>
                    </article>
                </section>

                {allCategoriesQuery.isError && (
                    <div className="category-alert" role="alert">
                        <span>{getErrorMessage(allCategoriesQuery.error, "Não foi possível carregar o resumo das categorias.")}</span>
                        <button type="button" onClick={() => void allCategoriesQuery.refetch()}>Tentar novamente</button>
                    </div>
                )}

                <section className="category-management">
                    <header className="category-management__toolbar">
                        <div>
                            <span className="category-eyebrow">Cadastro</span>
                            <h2>Gerenciar categorias</h2>
                            <p>Adicione, consulte, edite e altere a situação dos cadastros.</p>
                        </div>
                        <button className="category-button category-button--primary" type="button" onClick={openCreateModal}>
                            <FontAwesomeIcon icon={faPlus} /> Adicionar categoria
                        </button>
                    </header>

                    <CategorySearch
                        isSearching={isSearching}
                        hasSearched={hasSearched}
                        onSearch={(nextFilters) => setFilters(nextFilters)}
                        onClear={() => setFilters(undefined)}
                    />

                    {listError && <div className="category-alert" role="alert">{listError}</div>}

                    <div className="category-list-grid">
                        <CategoryList
                            title="Categorias de entrada"
                            type="income"
                            categories={visibleCategories}
                            isLoading={isLoading || isSearching}
                            hasSearched={hasSearched}
                            onEdit={openEditModal}
                            onToggleStatus={openStatusModal}
                        />
                        <CategoryList
                            title="Categorias de saída"
                            type="expense"
                            categories={visibleCategories}
                            isLoading={isLoading || isSearching}
                            hasSearched={hasSearched}
                            onEdit={openEditModal}
                            onToggleStatus={openStatusModal}
                        />
                    </div>
                </section>
            </section>

            <CategoryFormModal
                isOpen={isFormOpen}
                category={editingCategory}
                isSubmitting={formMutation.isPending}
                error={formError || null}
                onClose={closeFormModal}
                onSubmit={handleSave}
            />

            <CategoryStatusModal
                category={statusCategory}
                isSubmitting={statusMutation.isPending}
                error={getErrorMessage(statusError, "") || null}
                onClose={closeStatusModal}
                onConfirm={handleConfirmStatus}
            />
        </main>
    );
}
