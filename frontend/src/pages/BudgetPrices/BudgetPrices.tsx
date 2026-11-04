import { useEffect, useState, type FormEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faMagnifyingGlass,
    faPenToSquare,
    faPlus,
    faRotateLeft,
    faTags,
    faTrashCan
} from "@fortawesome/free-solid-svg-icons";

import { AppHeader } from "../../components/AppHeader/AppHeader";
import { BackLink } from "../../components/BackLink/BackLink";
import { Modal } from "../../components/Modal/Modal";
import {
    useBudgetCategories,
    useBudgetPriceMutations,
    useBudgetPricesByFilters
} from "../../modules/budgets";
import type {
    BudgetCategory,
    BudgetPrice,
    FindBudgetPricesFilters
} from "../../modules/budgets";

import "./BudgetPrices.css";

const PAGE_SIZE = 100;
const currency = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
});

const blankForm = {
    categoryId: "",
    title: "",
    description: "",
    unitValue: ""
};

type PriceForm = typeof blankForm;
type PriceGroup = {
    categoryId: string;
    category: BudgetCategory | null;
    prices: BudgetPrice[];
};

function parseUnitValue(input: string): number {
    const normalized = input.trim().replace(/\s/g, "");
    const parsed = normalized.includes(",")
        ? normalized.replace(/\./g, "").replace(",", ".")
        : normalized;

    return Number(parsed);
}

function getErrorMessage(error: unknown, fallback: string): string {
    return error instanceof Error ? error.message : fallback;
}

function groupPricesByCategory(
    prices: BudgetPrice[],
    categories: BudgetCategory[]
): PriceGroup[] {
    const groups = prices.reduce<PriceGroup[]>((result, price) => {
        let group = result.find(item => item.categoryId === price.categoryId);

        if (!group) {
            group = {
                categoryId: price.categoryId,
                category: price.category ?? categories.find(category => category.id === price.categoryId) ?? null,
                prices: []
            };
            result.push(group);
        }

        group.prices.push(price);
        return result;
    }, []);

    return groups.sort((first, second) =>
        (first.category?.name ?? "").localeCompare(second.category?.name ?? "", "pt-BR")
    );
}

export function BudgetPrices() {
    useEffect(() => {
        document.title = "Tabela de preços | Blue Admin";
    }, []);

    const [search, setSearch] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [filters, setFilters] = useState<FindBudgetPricesFilters>({});
    const [page, setPage] = useState(1);

    const [editing, setEditing] = useState<BudgetPrice | null>(null);
    const [form, setForm] = useState<PriceForm>(blankForm);
    const [formOpen, setFormOpen] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    const [deleting, setDeleting] = useState<BudgetPrice | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    const categoriesQuery = useBudgetCategories();
    const categories = Array.isArray(categoriesQuery.data)
        ? categoriesQuery.data
        : categoriesQuery.data?.categories ?? [];
    const activeCategories = categories.filter(category => category.isActive);

    const query = useBudgetPricesByFilters({
        ...filters,
        page,
        limit: PAGE_SIZE
    });
    const mutations = useBudgetPriceMutations();

    const prices = query.data?.prices ?? [];
    const groups = groupPricesByCategory(prices, categories);
    const isSaving = mutations.create.isPending || mutations.update.isPending;

    function applyFilters(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setPage(1);
        setFilters({
            ...(search.trim() ? { title: search.trim() } : {}),
            ...(categoryId ? { categoryId } : {})
        });
    }

    function clearFilters() {
        setSearch("");
        setCategoryId("");
        setPage(1);
        setFilters({});
    }

    function openCreate() {
        setEditing(null);
        setForm({
            ...blankForm,
            categoryId: activeCategories[0]?.id ?? ""
        });
        setFormError(null);
        setFormOpen(true);
    }

    function openEdit(price: BudgetPrice) {
        setEditing(price);
        setForm({
            categoryId: price.categoryId,
            title: price.title,
            description: price.description ?? "",
            unitValue: String(price.unitValue)
        });
        setFormError(null);
        setFormOpen(true);
    }

    async function save(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const unitValue = parseUnitValue(form.unitValue);
        if (
            !form.categoryId ||
            !form.title.trim() ||
            !Number.isFinite(unitValue) ||
            unitValue < 0
        ) {
            setFormError("Informe categoria, nome e valor unitário válido.");
            return;
        }

        setFormError(null);

        const payload = {
            categoryId: form.categoryId,
            title: form.title.trim(),
            description: form.description.trim() || null,
            unitValue
        };

        try {
            if (editing) {
                await mutations.update.mutateAsync({
                    id: editing.id,
                    data: payload
                });
            } else {
                await mutations.create.mutateAsync(payload);
            }

            setFormOpen(false);
            setForm(blankForm);
        } catch (error) {
            setFormError(
                getErrorMessage(error, "Não foi possível salvar o preço.")
            );
        }
    }

    async function remove() {
        if (!deleting || mutations.remove.isPending) return;

        setDeleteError(null);

        try {
            await mutations.remove.mutateAsync(deleting.id);
            setDeleting(null);
            setPage(1);
        } catch (error) {
            setDeleteError(
                getErrorMessage(error, "Não foi possível excluir o preço.")
            );
        }
    }

    function closeForm() {
        if (!isSaving) setFormOpen(false);
    }

    function closeDeleteConfirmation() {
        if (mutations.remove.isPending) return;

        setDeleting(null);
        setDeleteError(null);
    }

    return (
        <main className="budget-prices-page">
            <AppHeader />

            <nav className="page-back-row" aria-label="Navegação da página">
                <BackLink
                    to="/budgets"
                    label="Voltar ao dashboard de orçamentos"
                />
            </nav>

            <section className="budget-prices-content">
                <header className="budget-prices-heading">
                    <div>
                        <span>Referência comercial</span>
                        <h1>Tabela de preços</h1>
                        <p>
                            Organize os valores de referência por categoria. Os preços
                            cadastrados facilitam a montagem de novos orçamentos.
                        </p>
                    </div>

                    <button
                        className="budget-prices-primary"
                        type="button"
                        onClick={openCreate}
                        disabled={!activeCategories.length}
                    >
                        <FontAwesomeIcon icon={faPlus} />
                        Novo preço
                    </button>
                </header>

                <section className="budget-prices-toolbar" aria-label="Filtros da tabela">
                    <form onSubmit={applyFilters}>
                        <label className="budget-prices-search">
                            Buscar item
                            <div>
                                <FontAwesomeIcon icon={faMagnifyingGlass} />
                                <input
                                    value={search}
                                    onChange={event => setSearch(event.target.value)}
                                    placeholder="Nome do item"
                                />
                            </div>
                        </label>

                        <label>
                            Categoria
                            <select
                                value={categoryId}
                                onChange={event => setCategoryId(event.target.value)}
                            >
                                <option value="">Todas as categorias</option>
                                {categories.map(category => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                        {category.isActive ? "" : " · Inativa"}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <div className="budget-prices-actions">
                            <button
                                type="button"
                                className="budget-prices-secondary"
                                onClick={clearFilters}
                            >
                                <FontAwesomeIcon icon={faRotateLeft} />
                                Limpar
                            </button>
                            <button type="submit" className="budget-prices-primary">
                                <FontAwesomeIcon icon={faMagnifyingGlass} />
                                Consultar
                            </button>
                        </div>
                    </form>

                    <p>
                        <strong>{query.data?.total ?? 0}</strong> itens encontrados
                        <span>·</span>
                        {groups.length} categorias nesta página
                    </p>
                </section>

                {query.isError || categoriesQuery.isError ? (
                    <div className="budget-prices-empty" role="alert">
                        <strong>Não foi possível carregar a tabela</strong>
                        <p>Verifique sua conexão e tente novamente.</p>
                        <button
                            type="button"
                            className="budget-prices-secondary"
                            onClick={() => {
                                void query.refetch();
                                void categoriesQuery.refetch();
                            }}
                        >
                            Tentar novamente
                        </button>
                    </div>
                ) : query.isPending || categoriesQuery.isPending ? (
                    <div className="budget-prices-empty" role="status">
                        Carregando tabela de preços…
                    </div>
                ) : groups.length === 0 ? (
                    <div className="budget-prices-empty">
                        <FontAwesomeIcon icon={faTags} />
                        <strong>Nenhum preço encontrado</strong>
                        <p>
                            Altere os filtros ou cadastre um novo item de referência.
                        </p>
                        <button
                            type="button"
                            className="budget-prices-primary"
                            onClick={openCreate}
                            disabled={!activeCategories.length}
                        >
                            Adicionar preço
                        </button>
                    </div>
                ) : (
                    <div className="budget-prices-groups">
                        {groups.map(group => (
                            <section
                                className="budget-prices-group"
                                key={group.categoryId}
                            >
                                <header>
                                    <div>
                                        <strong>
                                            {group.category?.name ?? "Categoria indisponível"}
                                        </strong>
                                        <small>
                                            {group.category?.isActive === false
                                                ? "Categoria inativa"
                                                : group.category?.description || "Itens de referência"}
                                        </small>
                                    </div>
                                    <span>
                                        {group.prices.length}{" "}
                                        {group.prices.length === 1 ? "item" : "itens"}
                                    </span>
                                </header>

                                {group.prices.map(price => (
                                    <article className="budget-prices-item" key={price.id}>
                                        <div>
                                            <strong>{price.title}</strong>
                                            <small>
                                                {price.description || "Sem descrição"}
                                            </small>
                                        </div>

                                        <strong className="budget-prices-value">
                                            {currency.format(Number(price.unitValue))}
                                        </strong>

                                        <div className="budget-prices-row-actions">
                                            <button
                                                type="button"
                                                title="Editar preço"
                                                aria-label={`Editar ${price.title}`}
                                                onClick={() => openEdit(price)}
                                            >
                                                <FontAwesomeIcon icon={faPenToSquare} />
                                            </button>
                                            <button
                                                type="button"
                                                title="Excluir preço"
                                                aria-label={`Excluir ${price.title}`}
                                                onClick={() => {
                                                    setDeleting(price);
                                                    setDeleteError(null);
                                                }}
                                            >
                                                <FontAwesomeIcon icon={faTrashCan} />
                                            </button>
                                        </div>
                                    </article>
                                ))}
                            </section>
                        ))}
                    </div>
                )}

                {query.data && query.data.totalPages > 1 && (
                    <nav
                        className="budget-prices-pagination"
                        aria-label="Paginação da tabela de preços"
                    >
                        <span>
                            Página {page} de {query.data.totalPages}
                        </span>
                        <div>
                            <button
                                type="button"
                                disabled={page <= 1}
                                onClick={() => setPage(current => current - 1)}
                            >
                                Anterior
                            </button>
                            <button
                                type="button"
                                disabled={page >= query.data.totalPages}
                                onClick={() => setPage(current => current + 1)}
                            >
                                Próxima
                            </button>
                        </div>
                    </nav>
                )}
            </section>

            <Modal
                isOpen={formOpen}
                title={editing ? "Editar preço" : "Adicionar preço"}
                onClose={closeForm}
            >
                <form className="budget-prices-form" onSubmit={save}>
                    <label>
                        Categoria
                        <select
                            required
                            value={form.categoryId}
                            onChange={event =>
                                setForm(current => ({
                                    ...current,
                                    categoryId: event.target.value
                                }))
                            }
                        >
                            <option value="">Selecione</option>
                            {editing?.category?.isActive === false && (
                                <option value={editing.categoryId}>
                                    {editing.category.name} · Inativa (atual)
                                </option>
                            )}
                            {activeCategories.map(category => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label>
                        Nome
                        <input
                            required
                            maxLength={160}
                            autoFocus
                            value={form.title}
                            onChange={event =>
                                setForm(current => ({
                                    ...current,
                                    title: event.target.value
                                }))
                            }
                        />
                    </label>

                    <label>
                        Descrição <span>(opcional)</span>
                        <textarea
                            rows={3}
                            maxLength={500}
                            value={form.description}
                            onChange={event =>
                                setForm(current => ({
                                    ...current,
                                    description: event.target.value
                                }))
                            }
                        />
                    </label>

                    <label>
                        Valor unitário (R$)
                        <input
                            required
                            inputMode="decimal"
                            placeholder="0,00"
                            value={form.unitValue}
                            onChange={event =>
                                setForm(current => ({
                                    ...current,
                                    unitValue: event.target.value
                                }))
                            }
                        />
                    </label>

                    {formError && (
                        <p className="budget-prices-error" role="alert">
                            {formError}
                        </p>
                    )}

                    <footer>
                        <button
                            type="button"
                            className="budget-prices-secondary"
                            onClick={closeForm}
                            disabled={isSaving}
                        >
                            Cancelar
                        </button>
                        <button
                            className="budget-prices-primary"
                            type="submit"
                            disabled={isSaving}
                        >
                            {isSaving ? "Salvando…" : "Salvar preço"}
                        </button>
                    </footer>
                </form>
            </Modal>

            <Modal
                isOpen={Boolean(deleting)}
                title="Excluir preço"
                onClose={closeDeleteConfirmation}
            >
                <div className="budget-prices-confirm">
                    <p>
                        Deseja excluir <strong>{deleting?.title}</strong> da tabela?
                    </p>
                    <small>
                        Orçamentos já criados não serão alterados; cada item mantém o
                        valor registrado na proposta.
                    </small>

                    {deleteError && (
                        <p className="budget-prices-error" role="alert">
                            {deleteError}
                        </p>
                    )}

                    <footer>
                        <button
                            type="button"
                            className="budget-prices-secondary"
                            onClick={closeDeleteConfirmation}
                            disabled={mutations.remove.isPending}
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            className="budget-prices-danger"
                            onClick={() => void remove()}
                            disabled={mutations.remove.isPending}
                        >
                            {mutations.remove.isPending
                                ? "Excluindo…"
                                : "Confirmar exclusão"}
                        </button>
                    </footer>
                </div>
            </Modal>
        </main>
    );
}
