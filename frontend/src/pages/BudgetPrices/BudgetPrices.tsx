import { useState, type FormEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass, faPlus, faPenToSquare, faTrashCan, faTags, faRotateLeft } from "@fortawesome/free-solid-svg-icons";
import { AppHeader } from "../../components/AppHeader/AppHeader";
import { BackLink } from "../../components/BackLink/BackLink";
import { Modal } from "../../components/Modal/Modal";
import { useBudgetCategories, useBudgetPriceMutations, useBudgetPricesByFilters } from "../../modules/budgets";
import type { BudgetCategory, BudgetPrice, FindBudgetPricesFilters } from "../../modules/budgets";
import "./BudgetPrices.css";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const blank = { categoryId: "", title: "", description: "", unitValue: "" };
type PriceForm = typeof blank;

export function BudgetPrices() {
    document.title = "Tabela de preços | Blue Admin";
    const [search, setSearch] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [filters, setFilters] = useState<FindBudgetPricesFilters>({ page: 1, limit: 100 });
    const [page, setPage] = useState(1);
    const [editing, setEditing] = useState<BudgetPrice | null>(null);
    const [form, setForm] = useState<PriceForm>(blank);
    const [formOpen, setFormOpen] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [deleting, setDeleting] = useState<BudgetPrice | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const categoriesQuery = useBudgetCategories();
    const categories = Array.isArray(categoriesQuery.data) ? categoriesQuery.data : categoriesQuery.data?.categories ?? [];
    const activeCategories = categories.filter(category => category.isActive);
    const query = useBudgetPricesByFilters({ ...filters, page, limit: 100 });
    const mutations = useBudgetPriceMutations();
    const prices = query.data?.prices ?? [];
    const groups = prices.reduce<Array<{ category: BudgetCategory | null; prices: BudgetPrice[] }>>((all, price) => {
        let group = all.find(item => item.category?.id === price.categoryId);
        if (!group) {
            group = { category: price.category ?? categories.find(item => item.id === price.categoryId) ?? null, prices: [] };
            all.push(group);
        }
        group.prices.push(price);
        return all;
    }, []).sort((a, b) => (a.category?.name ?? "").localeCompare(b.category?.name ?? "", "pt-BR"));

    function applyFilters(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setPage(1);
        setFilters({ ...(search.trim() ? { title: search.trim() } : {}), ...(categoryId ? { categoryId } : {}), page: 1, limit: 100 });
    }
    function clearFilters() {
        setSearch(""); setCategoryId(""); setPage(1); setFilters({ page: 1, limit: 100 });
    }
    function openCreate() {
        setEditing(null); setForm({ ...blank, categoryId: activeCategories[0]?.id ?? "" }); setFormError(null); setFormOpen(true);
    }
    function openEdit(price: BudgetPrice) {
        setEditing(price);
        setForm({ categoryId: price.categoryId, title: price.title, description: price.description ?? "", unitValue: String(price.unitValue) });
        setFormError(null); setFormOpen(true);
    }
    async function save(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const normalizedValue = form.unitValue.trim().replace(/\s/g, "");
        const parsedValue = normalizedValue.includes(",")
            ? normalizedValue.replace(/\./g, "").replace(",", ".")
            : normalizedValue;
        const value = Number(parsedValue);
        if (!form.categoryId || !form.title.trim() || !Number.isFinite(value) || value < 0) {
            setFormError("Informe categoria, nome e valor unitário válido."); return;
        }
        setFormError(null);
        try {
            const payload = { categoryId: form.categoryId, title: form.title.trim(), description: form.description.trim() || null, unitValue: value };
            if (editing) await mutations.update.mutateAsync({ id: editing.id, data: payload });
            else await mutations.create.mutateAsync(payload);
            setFormOpen(false); setForm(blank);
        } catch (error) { setFormError(error instanceof Error ? error.message : "Não foi possível salvar o preço."); }
    }
    async function remove() {
        if (!deleting || mutations.remove.isPending) return;
        setDeleteError(null);
        try { await mutations.remove.mutateAsync(deleting.id); setDeleting(null); }
        catch (error) { setDeleteError(error instanceof Error ? error.message : "Não foi possível excluir o preço."); }
    }

    return <main className="budget-prices-page">
        <AppHeader />
        <nav className="page-back-row" aria-label="Navegação da página"><BackLink to="/budgets" label="Voltar ao dashboard de orçamentos" /></nav>
        <section className="budget-prices-content">
            <header className="budget-prices-heading">
                <div><span>REFERÊNCIA COMERCIAL</span><h1>Tabela de preços</h1><p>Organize os valores de referência por categoria. Os preços cadastrados facilitam a montagem de novos orçamentos.</p></div>
                <button className="budget-prices-primary" type="button" onClick={openCreate} disabled={!activeCategories.length}><FontAwesomeIcon icon={faPlus} /> Novo preço</button>
            </header>
            <section className="budget-prices-toolbar">
                <form onSubmit={applyFilters}>
                    <label className="budget-prices-search">Buscar item<div><FontAwesomeIcon icon={faMagnifyingGlass} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Nome do item" /></div></label>
                    <label>Categoria<select value={categoryId} onChange={e => setCategoryId(e.target.value)}><option value="">Todas as categorias</option>{categories.map(item => <option key={item.id} value={item.id}>{item.name}{item.isActive ? "" : " · Inativa"}</option>)}</select></label>
                    <div className="budget-prices-actions"><button type="button" className="budget-prices-secondary" onClick={clearFilters}><FontAwesomeIcon icon={faRotateLeft} /> Limpar</button><button type="submit" className="budget-prices-primary"><FontAwesomeIcon icon={faMagnifyingGlass} /> Consultar</button></div>
                </form>
                <p><strong>{query.data?.total ?? 0}</strong> itens cadastrados <span>·</span> {groups.length} categorias</p>
            </section>
            {query.isError || categoriesQuery.isError ? <div className="budget-prices-empty" role="alert">Não foi possível carregar a tabela. <button type="button" onClick={() => { void query.refetch(); void categoriesQuery.refetch(); }}>Tentar novamente</button></div>
            : query.isPending || categoriesQuery.isPending ? <div className="budget-prices-empty">Carregando tabela de preços…</div>
            : !groups.length ? <div className="budget-prices-empty"><FontAwesomeIcon icon={faTags} /><strong>Nenhum preço encontrado</strong><p>Altere os filtros ou cadastre um novo item de referência.</p><button type="button" className="budget-prices-primary" onClick={openCreate} disabled={!activeCategories.length}>Adicionar preço</button></div>
            : <div className="budget-prices-groups">{groups.map(group => <section className="budget-prices-group" key={group.category?.id ?? group.prices[0].categoryId}>
                <header><div><strong>{group.category?.name ?? "Categoria indisponível"}</strong><small>{group.category?.isActive === false ? "Categoria inativa" : group.category?.description || "Itens de referência"}</small></div><span>{group.prices.length} {group.prices.length === 1 ? "item" : "itens"}</span></header>
                {group.prices.map(price => <article className="budget-prices-item" key={price.id}>
                    <div><strong>{price.title}</strong><small>{price.description || "Sem descrição"}</small></div>
                    <strong className="budget-prices-value">{currency.format(Number(price.unitValue))}</strong>
                    <div className="budget-prices-row-actions"><button type="button" title="Editar preço" aria-label={`Editar ${price.title}`} onClick={() => openEdit(price)}><FontAwesomeIcon icon={faPenToSquare} /></button><button type="button" title="Excluir preço" aria-label={`Excluir ${price.title}`} onClick={() => { setDeleting(price); setDeleteError(null); }}><FontAwesomeIcon icon={faTrashCan} /></button></div>
                </article>)}
            </section>)}</div>}
            {query.data && query.data.totalPages > 1 && <nav className="budget-prices-pagination" aria-label="Paginação"><span>Página {page} de {query.data.totalPages}</span><div><button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Anterior</button><button disabled={page >= query.data.totalPages} onClick={() => setPage(p => p + 1)}>Próxima</button></div></nav>}
        </section>
        <Modal isOpen={formOpen} title={editing ? "Editar preço" : "Adicionar preço"} onClose={() => { if (!mutations.create.isPending && !mutations.update.isPending) setFormOpen(false); }}>
            <form className="budget-prices-form" onSubmit={save}>
                <label>Categoria<select required value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}><option value="">Selecione</option>{editing && !editing.category.isActive && <option value={editing.categoryId}>{editing.category.name} · Inativa (atual)</option>}{activeCategories.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
                <label>Nome<input required maxLength={160} autoFocus value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></label>
                <label>Descrição <span>(opcional)</span><textarea rows={3} maxLength={500} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></label>
                <label>Valor unitário (R$)<input required inputMode="decimal" placeholder="0,00" value={form.unitValue} onChange={e => setForm(f => ({ ...f, unitValue: e.target.value }))} /></label>
                {formError && <p className="budget-prices-error" role="alert">{formError}</p>}
                <footer><button type="button" className="budget-prices-secondary" onClick={() => setFormOpen(false)} disabled={mutations.create.isPending || mutations.update.isPending}>Cancelar</button><button className="budget-prices-primary" type="submit" disabled={mutations.create.isPending || mutations.update.isPending}>Salvar preço</button></footer>
            </form>
        </Modal>
        <Modal isOpen={Boolean(deleting)} title="Excluir preço" onClose={() => { if (!mutations.remove.isPending) { setDeleting(null); setDeleteError(null); } }}>
            <div className="budget-prices-confirm"><p>Deseja excluir <strong>{deleting?.title}</strong> da tabela?</p><small>Orçamentos já criados não serão alterados; cada item mantém o valor registrado na proposta.</small>{deleteError && <p className="budget-prices-error" role="alert">{deleteError}</p>}<footer><button type="button" className="budget-prices-secondary" onClick={() => setDeleting(null)} disabled={mutations.remove.isPending}>Cancelar</button><button type="button" className="budget-prices-danger" onClick={() => void remove()} disabled={mutations.remove.isPending}>Confirmar exclusão</button></footer></div>
        </Modal>
    </main>;
}
