import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faArrowDown, faArrowUp, faFilePdf, faListOl,
    faPenToSquare, faPlus, faPrint, faRotateLeft, faTrashCan
} from "@fortawesome/free-solid-svg-icons";

import { AppHeader } from "../../components/AppHeader/AppHeader";
import { BackLink } from "../../components/BackLink/BackLink";
import { Modal } from "../../components/Modal/Modal";
import { useClients } from "../../modules/clients/useClients";
import { useEquipaments } from "../../modules/equipaments/useEquipaments";
import {
    useBudgetById, useBudgetMutations, useBudgetItemMutations,
    useBudgetCategories, useBudgetCategoryMutations
} from "../../modules/budgets";
import type {
    BudgetStatus, BudgetDetailsResponse, BudgetCategory,
    BudgetItem, CreateBudgetItemRequest, UpdateBudgetItemRequest,
    CreateBudgetCategoryRequest
} from "../../modules/budgets";
import "./BudgetDetails.css";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const dateTime = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

const statusLabels: Record<BudgetStatus, string> = {
    rascunho: "Rascunho", enviado: "Enviado", aprovado: "Aprovado",
    rejeitado: "Rejeitado", expirado: "Expirado", cancelado: "Cancelado"
};
const statusTones: Record<BudgetStatus, string> = {
    rascunho: "neutral", enviado: "info", aprovado: "success",
    rejeitado: "danger", expirado: "warning", cancelado: "muted"
};
const statusOptions = Object.entries(statusLabels) as Array<[BudgetStatus, string]>;

function money(value: number) { return currency.format(Number(value || 0)); }
function date(value: string) {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? "—" : dateTime.format(parsed);
}
function equipmentLabel(details: BudgetDetailsResponse) {
    return [details.equipament.type, details.equipament.brand, details.equipament.model,
        details.equipament.mainIdentification, details.equipament.additionalIdentification]
        .filter(Boolean).join(" · ");
}
function getError(error: unknown, fallback: string) {
    return error instanceof Error ? error.message : fallback;
}

function getHistoryStatusTransition(description: string) {
    const match = description.match(/status do orçamento alterado de "([^"]+)" para "([^"]+)"/i);
    if (!match) return null;

    const from = match[1] as BudgetStatus;
    const to = match[2] as BudgetStatus;
    if (!(from in statusLabels) || !(to in statusLabels)) return null;
    return { from, to };
}

type EditableItem = {
    id?: string; title: string; description: string; categoryId: string;
    quantity: string; unitValue: string; discount: string;
};

const emptyItem: EditableItem = {
    title: "", description: "", categoryId: "", quantity: "1", unitValue: "0", discount: "0"
};

export function BudgetDetails() {
    const { budgetId } = useParams<{ budgetId: string }>();
    const navigate = useNavigate();
    const query = useBudgetById(budgetId);
    const clientsQuery = useClients();
    const equipamentsQuery = useEquipaments();
    const budgetMutations = useBudgetMutations();
    const itemMutations = useBudgetItemMutations();
    const categoriesQuery = useBudgetCategories();
    const categoryMutations = useBudgetCategoryMutations();
    const details = query.data;
    const categories = (categoriesQuery.data as BudgetCategory[] | undefined) ?? [];

    const [dialog, setDialog] = useState<"budget" | "discount" | "item" | "delete-item" | null>(null);
    const [editingItem, setEditingItem] = useState<EditableItem>(emptyItem);
    const [itemDialogTab, setItemDialogTab] = useState<"item" | "category">("item");
    const [newCategoryName, setNewCategoryName] = useState("");
    const [newCategoryDescription, setNewCategoryDescription] = useState("");
    const [globalDiscountInput, setGlobalDiscountInput] = useState("0");
    const [pendingDelete, setPendingDelete] = useState<BudgetItem | null>(null);
    const [formError, setFormError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [printMode, setPrintMode] = useState(false);
    const [organizerOpen, setOrganizerOpen] = useState(false);
    const [relationshipOpen, setRelationshipOpen] = useState(false);
    const [deleteBudgetOpen, setDeleteBudgetOpen] = useState(false);
    const [selectedClientId, setSelectedClientId] = useState("");
    const [selectedEquipamentId, setSelectedEquipamentId] = useState("");
    const [printOrder, setPrintOrder] = useState<string[]>([]);

    useEffect(() => {
        if (!relationshipOpen) return;
        void clientsQuery.loadClients();
    }, [relationshipOpen, clientsQuery.loadClients]);

    useEffect(() => {
        if (!relationshipOpen || !selectedClientId) return;
        void equipamentsQuery.loadEquipaments(selectedClientId);
    }, [relationshipOpen, selectedClientId, equipamentsQuery.loadEquipaments]);

    useEffect(() => {
        const resetPrintView = () => setPrintMode(false);
        window.addEventListener("afterprint", resetPrintView);
        return () => window.removeEventListener("afterprint", resetPrintView);
    }, []);

    const [editableBudget, setEditableBudget] = useState({
        status: "rascunho" as BudgetStatus,
        validity: "",
        warranty: "",
        deliveryTime: "",
        paymentCondition: "",
        observations: "",
    });
    const orderedCategories = useMemo(() => {
        if (!details) return [];
        const allItems = details.items.categories.flatMap(category => category.items);
        const initialIds = allItems.map(item => item.id);
        const ids = printOrder.length === initialIds.length &&
            initialIds.every(id => printOrder.includes(id)) ? printOrder : initialIds;
        const position = new Map(ids.map((id, index) => [id, index]));
        return details.items.categories
            .map(category => ({
                ...category,
                items: [...category.items].sort((a, b) =>
                    (position.get(a.id) ?? 0) - (position.get(b.id) ?? 0))
            }))
            .filter(category => category.items.length > 0)
            .sort((a, b) => (position.get(a.items[0].id) ?? 0) - (position.get(b.items[0].id) ?? 0));
    }, [details, printOrder]);

    function openRelationshipEditor() {
        setSelectedClientId(details!.budget.clientId);
        setSelectedEquipamentId(details!.budget.equipamentId);
        setFormError(null);
        setRelationshipOpen(true);
    }

    async function saveRelationship(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!details || !selectedClientId || !selectedEquipamentId) {
            setFormError("Selecione o cliente e um equipamento pertencente a ele.");
            return;
        }
        setIsSaving(true);
        setFormError(null);
        try {
            await budgetMutations.update.mutateAsync({
                id: details.budget.id,
                data: { clientId: selectedClientId, equipamentId: selectedEquipamentId }
            });
            setRelationshipOpen(false);
            await query.refetch();
        } catch (error) {
            setFormError(getError(error, "Não foi possível atualizar o cliente e equipamento."));
        } finally {
            setIsSaving(false);
        }
    }

    async function deleteBudget() {
        if (!details) return;
        setIsSaving(true);
        setFormError(null);
        try {
            await budgetMutations.remove.mutateAsync(details.budget.id);
            navigate("/budgets", { replace: true });
        } catch (error) {
            setFormError(getError(error, "Não foi possível excluir o orçamento."));
        } finally {
            setIsSaving(false);
        }
    }

    function openBudgetEditor() {
        setEditableBudget({
            status: details!.budget.status,
            validity: details!.budget.validity,
            warranty: details!.budget.warranty,
            deliveryTime: details!.budget.deliveryTime,
            paymentCondition: details!.budget.paymentCondition,
            observations: details!.budget.observations ?? "",
        });
        setFormError(null);
        setDialog("budget");
    }

    function openGlobalDiscountEditor() {
        setGlobalDiscountInput(String(details!.totals.globalDiscount));
        setFormError(null);
        setDialog("discount");
    }

    function openItemEditor(item?: BudgetItem) {
        setEditingItem(item ? {
            id: item.id, title: item.title, description: item.description ?? "",
            categoryId: item.categoryId, quantity: String(item.quantity),
            unitValue: String(item.unitValue), discount: String(item.discount)
        } : emptyItem);
        setItemDialogTab("item");
        setNewCategoryName("");
        setNewCategoryDescription("");
        setFormError(null);
        setDialog("item");
    }

    async function saveBudget(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!details) return;
        setIsSaving(true);
        setFormError(null);
        try {
            await budgetMutations.update.mutateAsync({
                id: details.budget.id,
                data: {
                    status: editableBudget.status,
                    validity: editableBudget.validity.trim(),
                    warranty: editableBudget.warranty.trim(),
                    deliveryTime: editableBudget.deliveryTime.trim(),
                    paymentCondition: editableBudget.paymentCondition.trim(),
                    observations: editableBudget.observations.trim() || null
                }
            });
            setDialog(null);
            await query.refetch();
        } catch (error) {
            setFormError(getError(error, "Não foi possível atualizar o orçamento."));
        } finally {
            setIsSaving(false);
        }
    }

    async function saveItem(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!details) return;
        const quantity = Number(editingItem.quantity);
        const unitValue = Number(editingItem.unitValue);
        const discount = Number(editingItem.discount);
        if (!editingItem.title.trim() || !editingItem.categoryId ||
            !Number.isFinite(quantity) || quantity <= 0 ||
            !Number.isFinite(unitValue) || unitValue < 0 ||
            !Number.isFinite(discount) || discount < 0 || discount > 100) {
            setFormError("Confira título, categoria, quantidade, valor unitário e desconto (0 a 100%).");
            return;
        }
        const payload: CreateBudgetItemRequest = {
            title: editingItem.title.trim(),
            description: editingItem.description.trim() || null,
            categoryId: editingItem.categoryId,
            quantity, unitValue, discount
        };
        setIsSaving(true);
        setFormError(null);
        try {
            if (editingItem.id) {
                await itemMutations.update.mutateAsync({
                    id: editingItem.id, data: payload as UpdateBudgetItemRequest
                });
            } else {
                await itemMutations.create.mutateAsync({ budgetId: details.budget.id, data: payload });
            }
            setDialog(null);
            await query.refetch();
        } catch (error) {
            setFormError(getError(error, "Não foi possível salvar o item."));
        } finally {
            setIsSaving(false);
        }
    }

    async function saveGlobalDiscount(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!details) return;
        const discount = Number(globalDiscountInput);
        if (!Number.isFinite(discount) || discount < 0 || discount > 100) {
            setFormError("O desconto global deve estar entre 0 e 100%.");
            return;
        }

        setIsSaving(true);
        setFormError(null);
        try {
            await budgetMutations.update.mutateAsync({
                id: details.budget.id,
                data: { globalDiscount: discount }
            });
            setDialog(null);
            await query.refetch();
        } catch (error) {
            setFormError(getError(error, "Não foi possível atualizar o desconto global."));
        } finally {
            setIsSaving(false);
        }
    }

    async function saveCategory(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const name = newCategoryName.trim();
        if (!name) {
            setFormError("Informe o nome da categoria.");
            return;
        }

        const payload: CreateBudgetCategoryRequest = {
            name,
            description: newCategoryDescription.trim() || null
        };

        setIsSaving(true);
        setFormError(null);
        try {
            const category = await categoryMutations.create.mutateAsync(payload);
            await categoriesQuery.refetch();
            setEditingItem(current => ({ ...current, categoryId: category.id }));
            setNewCategoryName("");
            setNewCategoryDescription("");
            setItemDialogTab("item");
        } catch (error) {
            setFormError(getError(error, "Não foi possível criar a categoria."));
        } finally {
            setIsSaving(false);
        }
    }

    async function deleteItem() {
        if (!pendingDelete) return;
        setIsSaving(true);
        setFormError(null);
        try {
            await itemMutations.remove.mutateAsync(pendingDelete.id);
            setPendingDelete(null);
            setDialog(null);
            await query.refetch();
        } catch (error) {
            setFormError(getError(error, "Não foi possível excluir o item."));
        } finally {
            setIsSaving(false);
        }
    }

    function movePrintItem(itemId: string, direction: -1 | 1) {
        if (!details) return;
        const ids = details.items.categories.flatMap(category => category.items.map(item => item.id));
        const current = printOrder.length === ids.length ? [...printOrder] : ids;
        const index = current.indexOf(itemId);
        const next = index + direction;
        if (index < 0 || next < 0 || next >= current.length) return;
        [current[index], current[next]] = [current[next], current[index]];
        setPrintOrder(current);
    }

    function startPrint() {
        setOrganizerOpen(false);
        setDialog(null);
        setPrintMode(true);
        window.setTimeout(() => window.print(), 150);
    }

    if (query.isPending) {
        return <main className="budget-details-page"><AppHeader /><div className="budget-details-state"><strong>Carregando orçamento…</strong><p>Buscando dados, itens e histórico.</p></div></main>;
    }
    if (query.isError || !details) {
        return <main className="budget-details-page"><AppHeader /><div className="budget-details-state budget-details-state--error"><strong>Não foi possível carregar o orçamento.</strong><p>Verifique o identificador ou tente novamente.</p><button type="button" onClick={() => void query.refetch()}>Tentar novamente</button><Link to="/budgets">Voltar aos orçamentos</Link></div></main>;
    }

    const { budget, totals, history } = details;
    const allItems = details.items.categories.flatMap(category => category.items);

    return (
        <main className={`budget-details-page${printMode ? " is-printing" : ""}`}>
            <title>Orçamento #{budget.id.slice(0, 8)} | Blue Admin</title>
            <AppHeader />
            <nav className="page-back-row budget-details-back"><BackLink to="/budgets" label="Voltar ao dashboard de orçamentos" /></nav>
            <div className="budget-details-content">
                <header className="budget-details-hero">
                    <div className="budget-details-hero__copy">
                        <span className="budget-details-eyebrow">Gestão comercial · Detalhes</span>
                        <div className="budget-details-title-row">
                            <h1>Orçamento <span>#{budget.id.slice(0, 8)}</span></h1>
                            <span className={`budget-details-status budget-details-status--${statusTones[budget.status]}`}>{statusLabels[budget.status]}</span>
                        </div>
                        <p>Consulte a proposta, seus itens, condições comerciais e histórico de alterações.</p>
                    </div>
                    <div className="budget-details-hero__actions">
                        <button type="button" onClick={openBudgetEditor}><FontAwesomeIcon icon={faPenToSquare} /> Editar orçamento</button>
                        <button type="button" className="is-danger" onClick={() => { setDeleteBudgetOpen(true); setFormError(null); }}><FontAwesomeIcon icon={faTrashCan} /> Excluir</button>
                        <button type="button" onClick={() => { setPrintOrder(allItems.map(item => item.id)); setOrganizerOpen(true); }}><FontAwesomeIcon icon={faListOl} /> Organizar impressão</button>
                        <button type="button" className="is-primary" onClick={startPrint}><FontAwesomeIcon icon={faFilePdf} /> Exportar PDF</button>
                    </div>
                </header>

                <section className="budget-details-summary" aria-label="Resumo do orçamento">
                    <article><span>Itens</span><strong>{totals.itemCount}</strong><small>{totals.categoryCount} categorias</small></article>
                    <article><span>Valor bruto</span><strong>{money(totals.grossAmount)}</strong><small>Composição antes dos descontos</small></article>
                    <article className="is-total"><span>Valor final</span><strong>{money(totals.finalAmount)}</strong><small>Valor da proposta</small></article>
                </section>

                <div className="budget-details-grid">
                    <section className="budget-details-panel">
                        <header><div><span className="budget-details-eyebrow">Responsável pela proposta</span><h2>Cliente</h2></div></header>
                        <p className="budget-details-entity-name">{details.client.name}</p>
                    </section>
                    <section className="budget-details-panel">
                        <header><div><span className="budget-details-eyebrow">Bem relacionado à proposta</span><h2>Equipamento</h2></div><button type="button" onClick={openRelationshipEditor}><FontAwesomeIcon icon={faPenToSquare} /> Alterar vínculo</button></header>
                        <p className="budget-details-entity-name">{equipmentLabel(details) || "Não informado"}</p>
                    </section>
                    <section className="budget-details-panel">
                        <header><div><span className="budget-details-eyebrow">Condições comerciais</span><h2>Dados do orçamento</h2></div><button type="button" onClick={openBudgetEditor}><FontAwesomeIcon icon={faPenToSquare} /> Editar</button></header>
                        <dl><div><dt>Status</dt><dd>{statusLabels[budget.status]}</dd></div><div><dt>Validade</dt><dd>{budget.validity}</dd></div><div><dt>Garantia</dt><dd>{budget.warranty}</dd></div><div><dt>Prazo de entrega</dt><dd>{budget.deliveryTime}</dd></div><div><dt>Pagamento</dt><dd>{budget.paymentCondition}</dd></div><div><dt>Criado em</dt><dd>{date(budget.createdAt)}</dd></div><div><dt>Atualizado em</dt><dd>{date(budget.updatedAt)}</dd></div></dl>
                        {budget.observations && <div className="budget-details-observations"><strong>Observações</strong><p>{budget.observations}</p></div>}
                    </section>
                </div>

                <section className="budget-details-panel budget-details-items" id="budget-items">
                    <header><div><span className="budget-details-eyebrow">Composição da proposta</span><h2>Itens do orçamento</h2><p>Itens agrupados por categoria e seus respectivos subtotais.</p></div><button type="button" className="is-primary" onClick={() => openItemEditor()}><FontAwesomeIcon icon={faPlus} /> Adicionar item</button></header>
                    {allItems.length === 0 ? <div className="budget-details-empty"><strong>Nenhum item cadastrado</strong><p>Adicione serviços, peças ou outros itens para compor esta proposta.</p></div> : (
                        <div className="budget-details-categories">
                            {(printMode ? orderedCategories : details.items.categories).map(category => <section className="budget-details-category" key={category.id}>
                                <header><div><h3>{category.name}</h3><span>{category.itemCount} {category.itemCount === 1 ? "item" : "itens"}</span></div>{!category.isActive && <small>Categoria inativa</small>}</header>
                                <div className="budget-details-item-list">
                                    {category.items.map(item => <article className="budget-details-item" key={item.id}>
                                        <div className="budget-details-item__main"><strong>{item.title}</strong>{item.description && <p>{item.description}</p>}<small>{item.quantity} × {money(item.unitValue)}</small></div>
                                        <div className="budget-details-item__amount"><strong>{money(item.totalAmount)}</strong></div>
                                        <div className="budget-details-item__actions no-print"><button type="button" aria-label={`Editar ${item.title}`} onClick={() => openItemEditor({ ...item, budgetId: budget.id, categoryId: category.id, quantity: item.quantity, unitValue: item.unitValue, totalAmount: item.totalAmount, discount: item.discount, createdAt: item.createdAt, updatedAt: item.updatedAt })}><FontAwesomeIcon icon={faPenToSquare} /></button><button type="button" className="is-danger" aria-label={`Excluir ${item.title}`} onClick={() => { setPendingDelete({ ...item, budgetId: budget.id, categoryId: category.id, quantity: item.quantity, unitValue: item.unitValue, totalAmount: item.totalAmount, discount: item.discount, createdAt: item.createdAt, updatedAt: item.updatedAt }); setDialog("delete-item"); setFormError(null); }}><FontAwesomeIcon icon={faTrashCan} /></button></div>
                                    </article>)}
                                </div>
                                <footer className="budget-details-category-total"><span>Total da categoria</span><strong>{money(category.totalAmount)}</strong></footer>
                            </section>)}
                        </div>
                    )}
                    <section className="budget-details-pricing" aria-label="Resumo financeiro do orçamento">
                        <div><span>Valor bruto</span><strong>{money(totals.grossAmount)}</strong></div>
                        <div className="budget-details-pricing__discount"><span>Desconto global ({totals.globalDiscount}%)</span><strong>- {money(totals.globalDiscountAmount)}</strong><button type="button" onClick={openGlobalDiscountEditor}><FontAwesomeIcon icon={faPenToSquare} /> Editar desconto</button></div>
                        <div className="budget-details-pricing__final"><span>Valor final do orçamento</span><strong>{money(totals.finalAmount)}</strong></div>
                    </section>
                </section>

                <section className="budget-details-panel budget-details-history">
                    <header><div><span className="budget-details-eyebrow">Rastreabilidade</span><h2>Histórico do orçamento</h2><p>Registros de criação, atualizações e alterações nos itens.</p></div><span className="budget-details-history__count">{history.length} registros</span></header>
                    {history.length === 0 ? <div className="budget-details-empty"><strong>Nenhum registro encontrado</strong></div> : <ol>{history.map(event => {
                        const transition = getHistoryStatusTransition(event.description);
                        return <li key={event.id} className={transition ? "has-status" : ""}>
                            <span className="budget-details-history__dot" />
                            <div>
                                <strong>{event.description}</strong>
                                {transition && <div className="budget-details-history__transition"><span className={`budget-details-status budget-details-status--${statusTones[transition.from]}`}>{statusLabels[transition.from]}</span><span aria-hidden="true">→</span><span className={`budget-details-status budget-details-status--${statusTones[transition.to]}`}>{statusLabels[transition.to]}</span></div>}
                                <small>{event.eventType.replaceAll("_", " ")} · {date(event.createdAt)}</small>
                            </div>
                        </li>;
                    })}</ol>}
                </section>

                <section className="budget-print-document" aria-label="Documento para impressão">
                    <header className="budget-print-document__header">
                        <div className="budget-print-brand"><strong>BLUE ADMIN</strong><span>Gestão de oficina</span></div>
                        <div className="budget-print-document__title"><h1>ORÇAMENTO</h1><strong>#{budget.id.slice(0, 8)}</strong><span>{statusLabels[budget.status]}</span></div>
                        <small>Emitido em {date(budget.createdAt)}</small>
                    </header>

                    <div className="budget-print-parties">
                        <section><h2>Cliente</h2><p>{details.client.name}</p></section>
                        <section><h2>Equipamento</h2><p>{equipmentLabel(details) || "Não informado"}</p></section>
                    </div>

                    <section className="budget-print-conditions">
                        <h2>Condições comerciais</h2>
                        <dl>
                            <div><dt>Validade</dt><dd>{budget.validity}</dd></div>
                            <div><dt>Garantia</dt><dd>{budget.warranty}</dd></div>
                            <div><dt>Prazo de entrega</dt><dd>{budget.deliveryTime}</dd></div>
                            <div><dt>Pagamento</dt><dd>{budget.paymentCondition}</dd></div>
                        </dl>
                    </section>

                    <section className="budget-print-items">
                        <h2>Itens do orçamento</h2>
                        {(printMode ? orderedCategories : details.items.categories).map(category => <section className="budget-print-category" key={category.id}>
                            <header><h3>{category.name}</h3><span>{category.itemCount} {category.itemCount === 1 ? "item" : "itens"}</span></header>
                            <table>
                                <thead><tr><th>Descrição</th><th>Qtd.</th><th>Valor unitário</th><th>Total</th></tr></thead>
                                <tbody>{category.items.map(item => <tr key={item.id}>
                                    <td><strong>{item.title}</strong>{item.description && <small>{item.description}</small>}</td>
                                    <td>{item.quantity}</td>
                                    <td>{money(item.unitValue)}</td>
                                    <td>{money(item.totalAmount)}</td>
                                </tr>)}</tbody>
                            </table>
                            <footer><span>Total da categoria</span><strong>{money(category.totalAmount)}</strong></footer>
                        </section>)}
                    </section>

                    <section className="budget-print-summary">
                        <div><span>Valor bruto</span><strong>{money(totals.grossAmount)}</strong></div>
                        <div><span>Desconto global ({totals.globalDiscount}%)</span><strong>- {money(totals.globalDiscountAmount)}</strong></div>
                        <div className="is-final"><span>Valor final</span><strong>{money(totals.finalAmount)}</strong></div>
                    </section>

                    {budget.observations && <section className="budget-print-observations"><h2>Observações gerais</h2><p>{budget.observations}</p></section>}
                </section>
            </div>

            <Modal isOpen={relationshipOpen} title="Alterar cliente e equipamento" onClose={() => setRelationshipOpen(false)} size="wide">
                <form className="budget-details-form" onSubmit={saveRelationship}>
                    <label>Cliente<select value={selectedClientId} onChange={event => { setSelectedClientId(event.target.value); setSelectedEquipamentId(""); }} required disabled={clientsQuery.isLoading}><option value="">Selecione um cliente</option>{clientsQuery.clients.map(client => <option key={client.id} value={client.id}>{client.name}</option>)}</select></label>
                    <label>Equipamento<select value={selectedEquipamentId} onChange={event => setSelectedEquipamentId(event.target.value)} required disabled={!selectedClientId || equipamentsQuery.isLoading}><option value="">Selecione um equipamento</option>{equipamentsQuery.equipaments.map(equipament => <option key={equipament.id} value={equipament.id}>{[equipament.type, equipament.brand, equipament.model, equipament.mainIdentification].filter(Boolean).join(" · ")}</option>)}</select></label>
                    <p className="budget-details-form__hint">Ao trocar o cliente, selecione também um equipamento cadastrado para esse cliente. A API valida esse vínculo antes de salvar.</p>
                    {formError && <p className="budget-details-error" role="alert">{formError}</p>}
                    <div className="budget-details-form__actions"><button type="button" onClick={() => setRelationshipOpen(false)}>Cancelar</button><button type="submit" disabled={isSaving || !selectedEquipamentId}>{isSaving ? "Salvando..." : "Salvar vínculo"}</button></div>
                </form>
            </Modal>

            <Modal isOpen={deleteBudgetOpen} title="Excluir orçamento" onClose={() => setDeleteBudgetOpen(false)}>
                <div className="budget-details-confirm"><p>Deseja excluir o orçamento <strong>#{budget.id.slice(0, 8)}</strong>? Os itens e o histórico também serão removidos. Essa ação não poderá ser desfeita.</p>{formError && <p className="budget-details-error" role="alert">{formError}</p>}<div className="budget-details-form__actions"><button type="button" onClick={() => setDeleteBudgetOpen(false)}>Cancelar</button><button type="button" className="is-danger" disabled={isSaving} onClick={() => void deleteBudget()}>{isSaving ? "Excluindo..." : "Confirmar exclusão"}</button></div></div>
            </Modal>

            <Modal isOpen={dialog === "budget"} title="Editar condições do orçamento" onClose={() => setDialog(null)} size="wide">
                <form className="budget-details-form" onSubmit={saveBudget}>
                    <label>Status<select value={editableBudget.status} onChange={event => setEditableBudget(current => ({ ...current, status: event.target.value as BudgetStatus }))}>{statusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                    <label>Validade<input value={editableBudget.validity} onChange={event => setEditableBudget(current => ({ ...current, validity: event.target.value }))} maxLength={120} required /></label>
                    <label>Garantia<input value={editableBudget.warranty} onChange={event => setEditableBudget(current => ({ ...current, warranty: event.target.value }))} maxLength={120} required /></label>
                    <label>Prazo de entrega<input value={editableBudget.deliveryTime} onChange={event => setEditableBudget(current => ({ ...current, deliveryTime: event.target.value }))} maxLength={120} required /></label>
                    <label>Condição de pagamento<input value={editableBudget.paymentCondition} onChange={event => setEditableBudget(current => ({ ...current, paymentCondition: event.target.value }))} maxLength={160} required /></label>
                    <label className="is-wide">Observações<textarea rows={4} value={editableBudget.observations} onChange={event => setEditableBudget(current => ({ ...current, observations: event.target.value }))} maxLength={2000} /></label>
                    {formError && <p className="budget-details-error" role="alert">{formError}</p>}
                    <div className="budget-details-form__actions"><button type="button" onClick={() => setDialog(null)}>Cancelar</button><button type="submit" disabled={isSaving}>{isSaving ? "Salvando..." : "Salvar alterações"}</button></div>
                </form>
            </Modal>

            <Modal isOpen={dialog === "item"} title={itemDialogTab === "category" ? "Nova categoria" : editingItem.id ? "Editar item" : "Adicionar item"} onClose={() => setDialog(null)}>
                <div className="budget-details-tabs" role="tablist" aria-label="Cadastro de item">
                    <button type="button" role="tab" aria-selected={itemDialogTab === "item"} className={itemDialogTab === "item" ? "is-active" : ""} onClick={() => { setItemDialogTab("item"); setFormError(null); }}>Item</button>
                    <button type="button" role="tab" aria-selected={itemDialogTab === "category"} className={itemDialogTab === "category" ? "is-active" : ""} onClick={() => { setItemDialogTab("category"); setFormError(null); }}>Nova categoria</button>
                </div>
                {itemDialogTab === "item" ? (
                    <form className="budget-details-form budget-details-form--single" onSubmit={saveItem}>
                        <label>Título<input value={editingItem.title} onChange={event => setEditingItem(current => ({ ...current, title: event.target.value }))} maxLength={160} required /></label>
                        <label>Categoria<select value={editingItem.categoryId} onChange={event => setEditingItem(current => ({ ...current, categoryId: event.target.value }))} required><option value="">Selecione uma categoria</option>{categories.filter(category => category.isActive || category.id === editingItem.categoryId).map(category => <option key={category.id} value={category.id}>{category.name}{category.isActive ? "" : " (inativa)"}</option>)}</select></label>
                        <label>Descrição<textarea rows={3} value={editingItem.description} onChange={event => setEditingItem(current => ({ ...current, description: event.target.value }))} maxLength={1000} /></label>
                        <div className="budget-details-form__numbers"><label>Quantidade<input type="number" min="0.001" step="0.001" value={editingItem.quantity} onChange={event => setEditingItem(current => ({ ...current, quantity: event.target.value }))} required /></label><label>Valor unitário<input type="number" min="0" step="0.01" value={editingItem.unitValue} onChange={event => setEditingItem(current => ({ ...current, unitValue: event.target.value }))} required /></label><label>Desconto (%)<input type="number" min="0" max="100" step="0.01" value={editingItem.discount} onChange={event => setEditingItem(current => ({ ...current, discount: event.target.value }))} required /></label></div>
                        {formError && <p className="budget-details-error" role="alert">{formError}</p>}
                        <div className="budget-details-form__actions"><button type="button" onClick={() => setDialog(null)}>Cancelar</button><button type="submit" disabled={isSaving}>{isSaving ? "Salvando..." : "Salvar item"}</button></div>
                    </form>
                ) : (
                    <form className="budget-details-form budget-details-form--single" onSubmit={saveCategory}>
                        <label>Nome da categoria<input value={newCategoryName} onChange={event => setNewCategoryName(event.target.value)} maxLength={120} required autoFocus /></label>
                        <label>Descrição (opcional)<textarea rows={3} value={newCategoryDescription} onChange={event => setNewCategoryDescription(event.target.value)} maxLength={500} /></label>
                        {formError && <p className="budget-details-error" role="alert">{formError}</p>}
                        <div className="budget-details-form__actions"><button type="button" onClick={() => { setItemDialogTab("item"); setFormError(null); }}>Voltar ao item</button><button type="submit" disabled={isSaving}>{isSaving ? "Salvando..." : "Criar categoria"}</button></div>
                    </form>
                )}
            </Modal>

            <Modal isOpen={dialog === "discount"} title="Editar desconto global" onClose={() => setDialog(null)}>
                <form className="budget-details-form budget-details-form--single" onSubmit={saveGlobalDiscount}>
                    <label>Desconto global (%)<input type="number" min="0" max="100" step="0.01" value={globalDiscountInput} onChange={event => setGlobalDiscountInput(event.target.value)} required /></label>
                    <p className="budget-details-form__hint">O desconto é aplicado sobre o subtotal dos itens após os descontos individuais. Os totais são recalculados pelo servidor.</p>
                    {formError && <p className="budget-details-error" role="alert">{formError}</p>}
                    <div className="budget-details-form__actions"><button type="button" onClick={() => setDialog(null)}>Cancelar</button><button type="submit" disabled={isSaving}>{isSaving ? "Salvando..." : "Salvar desconto"}</button></div>
                </form>
            </Modal>

            <Modal isOpen={dialog === "delete-item"} title="Excluir item do orçamento" onClose={() => { setDialog(null); setPendingDelete(null); }}>
                <div className="budget-details-confirm"><p>Deseja excluir o item <strong>{pendingDelete?.title}</strong>? O histórico e os totais do orçamento serão atualizados pelo servidor.</p>{formError && <p className="budget-details-error" role="alert">{formError}</p>}<div className="budget-details-form__actions"><button type="button" onClick={() => { setDialog(null); setPendingDelete(null); }}>Cancelar</button><button type="button" className="is-danger" disabled={isSaving} onClick={() => void deleteItem()}>{isSaving ? "Excluindo..." : "Confirmar exclusão"}</button></div></div>
            </Modal>

            <Modal isOpen={organizerOpen} title="Organizar itens para impressão" onClose={() => setOrganizerOpen(false)} size="wide">
                <div className="budget-print-organizer">
                    <p>Use as setas para alterar a ordem dos itens. Essa organização é temporária e não modifica o orçamento salvo.</p>
                    {orderedCategories.map(category => <section key={category.id}><h3>{category.name}</h3>{category.items.map(item => {
                        const index = printOrder.indexOf(item.id);
                        return <div className="budget-print-organizer__item" key={item.id}><span>{item.title}</span><small>{money(item.totalAmount)}</small><div><button type="button" aria-label="Mover item para cima" disabled={index <= 0} onClick={() => movePrintItem(item.id, -1)}><FontAwesomeIcon icon={faArrowUp} /></button><button type="button" aria-label="Mover item para baixo" disabled={index < 0 || index >= allItems.length - 1} onClick={() => movePrintItem(item.id, 1)}><FontAwesomeIcon icon={faArrowDown} /></button></div></div>;
                    })}</section>)}
                    <div className="budget-details-form__actions"><button type="button" onClick={() => setPrintOrder(allItems.map(item => item.id))}><FontAwesomeIcon icon={faRotateLeft} /> Restaurar ordem original</button><button type="button" className="is-primary" onClick={startPrint}><FontAwesomeIcon icon={faPrint} /> Imprimir / salvar PDF</button></div>
                </div>
            </Modal>
        </main>
    );
}
