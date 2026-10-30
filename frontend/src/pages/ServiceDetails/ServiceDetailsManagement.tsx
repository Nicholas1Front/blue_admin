import { createContext, useContext, useState, type FormEvent, type ReactNode } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faCalendarDays,
    faCoins,
    faFileInvoiceDollar,
    faGaugeHigh,
    faListCheck,
    faPenToSquare,
    faPlus,
    faRightLeft,
    faTrash,
    faUnlink,
    faUser,
    faTruck,
    faWrench
} from "@fortawesome/free-solid-svg-icons";

import { Modal } from "../../components/Modal/Modal";
import { ClientSelectModal } from "../Clients/components/ClientSelectModal/ClientSelectModal";
import { EquipamentSelectModal } from "../Clients/components/EquipamentSelectModal/EquipamentSelectModal";
import { EquipamentCreateModal } from "../Clients/components/EquipamentCreateModal/EquipamentCreateModal";
import { useClients } from "../../modules/clients/useClients";
import { useEquipaments } from "../../modules/equipaments/useEquipaments";
import type { Client } from "../../modules/clients/clients.types";
import type { CreateEquipamentRequest, Equipament } from "../../modules/equipaments/equipaments.types";
import { useCategories } from "../../modules/financial/categories/useCategories";
import type { FinancialType } from "../../modules/financial/shared/financial.types";
import { useTransactionMutations } from "../../modules/financial/transactions/useTransactionMutations";
import type { FinancialTransactionListItem } from "../../modules/financial/transactions/transactions.types";
import {
    useAddServiceActivity,
    useAvailableFinancialTransactions,
    useDeleteServiceActivity,
    useLinkTitheTransaction,
    useLinkTransactionToService,
    useUnlinkTitheTransaction,
    useUnlinkTransactionFromService,
    useUpdateService,
    useUpdateServiceActivity,
    useUpdateServiceStatus
} from "../../modules/services";
import type {
    CreateServiceActivityRequest,
    ServiceActivity,
    ServiceActivityStatus,
    ServiceDetailsResponse,
    ServiceStatus,
    UpdateServiceActivityRequest
} from "../../modules/services";

import "./ServiceDetailsManagement.css";

type Dialog =
    | "dates"
    | "relationship"
    | "service"
    | "cost"
    | "tithe"
    | "transactions"
    | "activities"
    | null;

type TransactionTarget = "tithe" | "income" | "expense";
type ServiceDetailsActionName = "dates" | "client" | "equipament" | "service" | "cost" | "tithe" | "transactions" | "activities";
const ServiceDetailsActionsContext = createContext<Record<ServiceDetailsActionName, () => void> | null>(null);
const serviceDetailsActionConfig = {
 dates:{label:"Alterar datas",icon:faCalendarDays},client:{label:"Alterar cliente",icon:faUser},
 equipament:{label:"Alterar equipamento",icon:faTruck},service:{label:"Editar status",icon:faWrench},
 cost:{label:"Editar horas e custo",icon:faGaugeHigh},tithe:{label:"Gerenciar dízimo",icon:faCoins},
 transactions:{label:"Gerenciar lançamentos",icon:faFileInvoiceDollar},activities:{label:"Gerenciar atividades",icon:faListCheck}
} satisfies Record<ServiceDetailsActionName,{label:string;icon:typeof faCalendarDays}>;
export function ServiceDetailsAction({action}:{action:ServiceDetailsActionName}) {
 const actions=useContext(ServiceDetailsActionsContext);
 if(!actions)return null;
 const config=serviceDetailsActionConfig[action];
 return <button type="button" className="service-details-action" onClick={actions[action]}><FontAwesomeIcon icon={config.icon} aria-hidden="true" />{config.label}</button>;
}

interface Props {
    details: ServiceDetailsResponse;
    onUpdated: () => Promise<unknown>;
    children: ReactNode;
}

const statusOptions: Array<{ value: ServiceStatus; label: string }> = [
    { value: "pendente", label: "Pendente" },
    { value: "aguardando_resposta_cliente", label: "Aguardando cliente" },
    { value: "aguardando_peças", label: "Aguardando peças" },
    { value: "em_execução", label: "Em execução" },
    { value: "aguardando_pagamento", label: "Aguardando pagamento" },
    { value: "pagamento_atrasado", label: "Pagamento atrasado" },
    { value: "pagamento_recebido", label: "Pagamento recebido" },
    { value: "finalizado", label: "Finalizado" },
    { value: "equipamento_saiu", label: "Equipamento saiu" },
    { value: "cancelado", label: "Cancelado" }
];

const activityStatusOptions: Array<{ value: ServiceActivityStatus; label: string }> = [
    { value: "pendente", label: "Pendente" },
    { value: "em_execução", label: "Em execução" },
    { value: "concluida", label: "Concluída" },
    { value: "cancelada", label: "Cancelada" }
];

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function localToday() {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${today.getFullYear()}-${month}-${day}`;
}

function dateInput(value: string | null | undefined) {
    return value ? value.slice(0, 10) : "";
}

function toIsoDate(value: string) {
    return new Date(`${value}T12:00:00`).toISOString();
}

function getErrorMessage(error: unknown, fallback: string) {
    return error instanceof Error ? error.message : fallback;
}

export function ServiceDetailsManagement({ details, onUpdated, children }: Props) {
    const serviceId = details.service.id;
    const clients = useClients();
    const equipaments = useEquipaments();
    const transactions = useTransactionMutations();

    const updateService = useUpdateService();
    const updateStatus = useUpdateServiceStatus();
    const linkTransaction = useLinkTransactionToService();
    const unlinkTransactionMutation = useUnlinkTransactionFromService();
    const linkTithe = useLinkTitheTransaction();
    const unlinkTithe = useUnlinkTitheTransaction();
    const addActivity = useAddServiceActivity();
    const updateActivity = useUpdateServiceActivity();
    const deleteActivity = useDeleteServiceActivity();

    const [dialog, setDialog] = useState<Dialog>(null);
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const [entryDate, setEntryDate] = useState(dateInput(details.service.entryDate));
    const [exitDate, setExitDate] = useState(dateInput(details.service.exitDate));
    const [status, setStatus] = useState<ServiceStatus>(details.service.status);
    const [serviceDescription, setServiceDescription] = useState("Informações do serviço atualizadas");
    const [hoursWorked, setHoursWorked] = useState(details.service.hoursWorked == null ? "" : String(details.service.hoursWorked));
    const [costAction, setCostAction] = useState<"keep" | "recalculate" | "manual" | "clear">("keep");
    const [costPerHourInput, setCostPerHourInput] = useState(details.service.costPerHour == null ? "" : String(details.service.costPerHour));

    const [clientSelectOpen, setClientSelectOpen] = useState(false);
    const [equipamentSelectOpen, setEquipamentSelectOpen] = useState(false);
    const [equipamentCreateOpen, setEquipamentCreateOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [relationshipMode, setRelationshipMode] = useState<"client" | "equipament">("equipament");

    const [transactionTarget, setTransactionTarget] = useState<TransactionTarget>("income");
    const [transactionSearch, setTransactionSearch] = useState("");
    const [transactionFilterYear, setTransactionFilterYear] = useState(String(new Date().getFullYear()));
    const [transactionFilterMonth, setTransactionFilterMonth] = useState("");
    const [transactionFilterDate, setTransactionFilterDate] = useState("");
    const [transactionFilterCategoryId, setTransactionFilterCategoryId] = useState("");
    const [transactionFilterValue, setTransactionFilterValue] = useState("");
    const [transactionPage, setTransactionPage] = useState(1);
    const [transactionSelectorOpen, setTransactionSelectorOpen] = useState(false);
    const [transactionFormMode, setTransactionFormMode] = useState<"create" | "edit" | null>(null);
    const [editingTransaction, setEditingTransaction] = useState<FinancialTransactionListItem | null>(null);
    const [transactionDescription, setTransactionDescription] = useState("");
    const [transactionValue, setTransactionValue] = useState("");
    const [transactionCategoryId, setTransactionCategoryId] = useState("");
    const [transactionReferenceDate, setTransactionReferenceDate] = useState(localToday());
    const [transactionFormType, setTransactionFormType] = useState<FinancialType>("expense");

    const categories = useCategories({ type: transactionFormType });
    const filterCategories = useCategories();
    const availableTransactions = useAvailableFinancialTransactions({
        year: transactionFilterYear.trim() ? Number(transactionFilterYear) : undefined,
        month: transactionFilterMonth ? Number(transactionFilterMonth) : undefined,
        referenceDate: transactionFilterDate || undefined,
        page: transactionPage,
        limit: 8,
        categoryId: transactionFilterCategoryId || undefined,
        value: transactionFilterValue.trim() ? Number(transactionFilterValue) : undefined,
        type: transactionTarget === "income" ? "income" : "expense",
        search: transactionSearch.trim() || undefined
    }, transactionSelectorOpen);
    const [transactionPendingDelete, setTransactionPendingDelete] = useState<FinancialTransactionListItem | null>(null);

    const [activityFormMode, setActivityFormMode] = useState<"create" | "edit" | null>(null);
    const [editingActivity, setEditingActivity] = useState<ServiceActivity | null>(null);
    const [activityTitle, setActivityTitle] = useState("");
    const [activityDescription, setActivityDescription] = useState("");
    const [activityStatus, setActivityStatus] = useState<ServiceActivityStatus>("pendente");
    const [activityStartAt, setActivityStartAt] = useState("");
    const [activityEndAt, setActivityEndAt] = useState("");
    const [activityPendingDelete, setActivityPendingDelete] = useState<ServiceActivity | null>(null);

    const availableCategories = categories.data ?? [];
    const activeCategories = availableCategories.filter(category => category.active);
    const transactionCategoryOptions = availableCategories.filter(category => category.active || category.id === editingTransaction?.categoryId);
    const filterCategoryOptions = (filterCategories.data ?? [])
        .filter(category => category.type === (transactionTarget === "income" ? "income" : "expense"))
        .sort((first, second) => first.name.localeCompare(second.name, "pt-BR"));

    function open(next: Dialog) {
        setError(null);
        setDialog(next);
    }

    async function refreshAndClose() {
        await onUpdated();
        setDialog(null);
        setError(null);
    }

    async function saveDates(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!entryDate) return setError("Informe a data de entrada.");
        if (exitDate && exitDate < entryDate) return setError("A data de saída não pode ser anterior à entrada.");
        setIsSaving(true);
        setError(null);
        try {
            await updateService.mutateAsync({
                id: serviceId,
                data: {
                    entryDate: toIsoDate(entryDate),
                    exitDate: exitDate ? toIsoDate(exitDate) : null,
                    description: "Datas de entrada e saída atualizadas"
                }
            });
            await refreshAndClose();
        } catch (caught) {
            setError(getErrorMessage(caught, "Não foi possível atualizar as datas."));
        } finally {
            setIsSaving(false);
        }
    }

    async function startRelationshipChange(mode: "client" | "equipament") {
        setRelationshipMode(mode);
        setError(null);
        if (mode === "client") {
            setSelectedClient(null);
            await clients.loadClients();
            setClientSelectOpen(true);
            return;
        }
        setSelectedClient({
            id: details.service.clientId,
            name: details.client.name,
            document: details.client.document,
            address: null,
            createdAt: "",
            updatedAt: ""
        });
        await equipaments.loadEquipaments(details.service.clientId);
        setEquipamentSelectOpen(true);
    }

    async function selectNewClient(client: Client) {
        setSelectedClient(client);
        setClientSelectOpen(false);
        await equipaments.loadEquipaments(client.id);
        setEquipamentSelectOpen(true);
    }

    async function createAndSelectEquipament(data: CreateEquipamentRequest) {
        if (!selectedClient) return;
        const equipament = await equipaments.addEquipament(selectedClient.id, data);
        setEquipamentCreateOpen(false);
        await selectNewEquipament(equipament);
    }

    async function selectNewEquipament(equipament: Equipament) {
        if (!selectedClient) return;
        setIsSaving(true);
        setError(null);
        try {
            await updateService.mutateAsync({
                id: serviceId,
                data: {
                    clientId: selectedClient.id,
                    equipamentId: equipament.id,
                    description: relationshipMode === "client"
                        ? "Cliente e equipamento do serviço atualizados"
                        : "Equipamento do serviço atualizado"
                }
            });
            setEquipamentSelectOpen(false);
            setSelectedClient(null);
            await refreshAndClose();
        } catch (caught) {
            setError(getErrorMessage(caught, "Não foi possível atualizar o cliente e o equipamento."));
        } finally {
            setIsSaving(false);
        }
    }

    async function saveServiceData(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsSaving(true);
        setError(null);
        try {
            await updateStatus.mutateAsync({
                id: serviceId,
                data: { status, description: serviceDescription.trim() || "Dados do serviço atualizados" }
            });
            await refreshAndClose();
        } catch (caught) {
            setError(getErrorMessage(caught, "Não foi possível atualizar os dados do serviço."));
        } finally {
            setIsSaving(false);
        }
    }

    async function saveOperationalCost(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (hoursWorked.trim() !== "" && (!Number.isFinite(Number(hoursWorked)) || Number(hoursWorked) < 0)) {
            return setError("Informe uma quantidade de horas válida.");
        }
        if (costAction === "manual" && (costPerHourInput.trim() === "" || !Number.isFinite(Number(costPerHourInput)) || Number(costPerHourInput) < 0)) {
            return setError("Informe um custo por hora válido.");
        }
        setIsSaving(true);
        setError(null);
        try {
            await updateService.mutateAsync({
                id: serviceId,
                data: {
                    hoursWorked: hoursWorked.trim() === "" ? null : Number(hoursWorked),
                    ...(costAction === "recalculate" ? { costPerHour: true } : {}),
                    ...(costAction === "manual" ? { costPerHour: Number(costPerHourInput) } : {}),
                    ...(costAction === "clear" ? { costPerHour: null } : {}),
                    description: costAction === "recalculate"
                        ? "Horas trabalhadas atualizadas e custo por hora recalculado"
                        : costAction === "manual"
                            ? "Horas trabalhadas e custo por hora definidos manualmente"
                            : costAction === "clear"
                                ? "Horas trabalhadas atualizadas e custo por hora removido"
                                : "Horas trabalhadas atualizadas"
                }
            });
            await refreshAndClose();
        } catch (caught) {
            setError(getErrorMessage(caught, "Não foi possível atualizar o custo operacional."));
        } finally {
            setIsSaving(false);
        }
    }

    function openTransactionSelector(target: TransactionTarget) {
        setTransactionTarget(target);
        setTransactionSearch("");
        setTransactionFilterYear(String(new Date().getFullYear()));
        setTransactionFilterMonth("");
        setTransactionFilterDate("");
        setTransactionFilterCategoryId("");
        setTransactionFilterValue("");
        setTransactionPage(1);
        setTransactionPendingDelete(null);
        setTransactionSelectorOpen(true);
        open(target === "tithe" ? "tithe" : "transactions");
    }

    async function selectTransaction(transaction: FinancialTransactionListItem) {
        setIsSaving(true);
        setError(null);
        try {
            if (transactionTarget === "tithe") {
                await linkTithe.mutateAsync({ transactionId: transaction.id, serviceId });
            } else {
                await linkTransaction.mutateAsync({ serviceId, data: { id: transaction.id } });
            }
            setTransactionSelectorOpen(false);
            await refreshAndClose();
        } catch (caught) {
            setError(getErrorMessage(caught, "Não foi possível vincular a transação."));
        } finally {
            setIsSaving(false);
        }
    }

    function openCreateTransaction(target: TransactionTarget) {
        setTransactionSelectorOpen(false);
        setTransactionTarget(target);
        setTransactionFormMode("create");
        setEditingTransaction(null);
        setTransactionFormType(target === "income" ? "income" : "expense");
        setTransactionDescription(target === "tithe" ? "Dízimo do serviço" : "");
        setTransactionValue(target === "tithe" ? String(details.financial.tithe.value) : "");
        setTransactionCategoryId("");
        setTransactionReferenceDate(localToday());
        setError(null);
    }

    function openEditTransaction(transaction: ServiceDetailsResponse["financial"]["tithe"]["transaction"] | ServiceDetailsResponse["financial"]["transactions"][number]) {
        if (!transaction) return;
        setTransactionSelectorOpen(false);
        const type = transaction.type as FinancialType;
        setTransactionTarget(transaction.originType === "service_tithe" ? "tithe" : type);
        setTransactionFormMode("edit");
        setEditingTransaction({
            ...transaction,
            categoryName: transaction.categoryName
        });
        setTransactionFormType(type);
        setTransactionDescription(transaction.description);
        setTransactionValue(String(transaction.value));
        setTransactionCategoryId(transaction.categoryId);
        setTransactionReferenceDate(dateInput(transaction.referenceDate));
        setError(null);
    }

    async function saveTransaction(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!transactionDescription.trim()) return setError("Informe a descrição do lançamento.");
        if (!transactionCategoryId) return setError("Selecione uma categoria ativa.");
        if (!transactionReferenceDate) return setError("Informe a data de referência.");
        const value = Number(transactionValue);
        if (!Number.isFinite(value) || value <= 0) return setError("Informe um valor maior que zero.");
        setIsSaving(true);
        setError(null);
        try {
            if (transactionFormMode === "create") {
                const created = await transactions.create.mutateAsync({
                    categoryId: transactionCategoryId,
                    description: transactionDescription.trim(),
                    value,
                    referenceDate: toIsoDate(transactionReferenceDate)
                });
                try {
                    if (transactionTarget === "tithe") {
                        await linkTithe.mutateAsync({ transactionId: created.id, serviceId });
                    } else {
                        await linkTransaction.mutateAsync({ serviceId, data: { id: created.id } });
                    }
                } catch (linkError) {
                    await availableTransactions.refetch();
                    setTransactionFormMode(null);
                    setEditingTransaction(null);
                    setError(`O lançamento foi criado no financeiro, mas não foi vinculado ao serviço. ID: ${created.id}. ${getErrorMessage(linkError, "Tente vinculá-lo pela consulta de lançamentos.")}`);
                    return;
                }
            } else if (editingTransaction) {
                await transactions.update.mutateAsync({
                    id: editingTransaction.id,
                    data: {
                        ...(transactionCategoryId !== editingTransaction.categoryId ? { categoryId: transactionCategoryId } : {}),
                        description: transactionDescription.trim(),
                        value,
                        referenceDate: toIsoDate(transactionReferenceDate)
                    }
                });
            }
            setTransactionFormMode(null);
            setEditingTransaction(null);
            await onUpdated();
            setDialog(null);
        } catch (caught) {
            setError(getErrorMessage(caught, "Não foi possível salvar o lançamento."));
        } finally {
            setIsSaving(false);
        }
    }

    async function unlinkTransaction(transactionId: string, isTithe = false) {
        setIsSaving(true);
        setError(null);
        try {
            if (isTithe) {
                await unlinkTithe.mutateAsync({ transactionId, serviceId });
            } else {
                await unlinkTransactionMutation.mutateAsync({ transactionId });
            }
            await refreshAndClose();
        } catch (caught) {
            setError(getErrorMessage(caught, "Não foi possível desvincular o lançamento."));
        } finally {
            setIsSaving(false);
        }
    }

    async function deleteLinkedTransaction(transaction: FinancialTransactionListItem, isTithe = false) {
        setIsSaving(true);
        setError(null);
        try {
            if (isTithe) {
                await unlinkTithe.mutateAsync({ transactionId: transaction.id, serviceId });
            } else {
                await unlinkTransactionMutation.mutateAsync({ transactionId: transaction.id });
            }
            await transactions.remove.mutateAsync(transaction.id);
            setTransactionPendingDelete(null);
            await onUpdated();
            setDialog(null);
        } catch (caught) {
            setError(getErrorMessage(caught, "Não foi possível excluir o lançamento. Se a desvinculação já ocorreu, ele foi preservado sem vínculo."));
        } finally {
            setIsSaving(false);
        }
    }

    function openActivityForm(activity?: ServiceActivity) {
        setActivityFormMode(activity ? "edit" : "create");
        setEditingActivity(activity ?? null);
        setActivityTitle(activity?.title ?? "");
        setActivityDescription(activity?.description ?? "");
        setActivityStatus(activity?.status ?? "pendente");
        setActivityStartAt(activity?.startAt ? dateInput(activity.startAt) : "");
        setActivityEndAt(activity?.endAt ? dateInput(activity.endAt) : "");
        setError(null);
    }

    async function saveActivity(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!activityTitle.trim()) return setError("Informe o título da atividade.");
        if (activityStartAt && activityEndAt && activityEndAt < activityStartAt) {
            return setError("O fim da atividade não pode ser anterior ao início.");
        }
        setIsSaving(true);
        setError(null);
        const payload = {
            title: activityTitle.trim(),
            description: activityDescription.trim() || null,
            status: activityStatus,
            startAt: activityStartAt ? toIsoDate(activityStartAt) : null,
            endAt: activityEndAt ? toIsoDate(activityEndAt) : null
        };
        try {
            if (activityFormMode === "create") {
                await addActivity.mutateAsync({ serviceId, data: payload as CreateServiceActivityRequest });
            } else if (editingActivity) {
                await updateActivity.mutateAsync({ activityId: editingActivity.id, data: payload as UpdateServiceActivityRequest });
            }
            setActivityFormMode(null);
            setEditingActivity(null);
            await refreshAndClose();
        } catch (caught) {
            setError(getErrorMessage(caught, "Não foi possível salvar a atividade."));
        } finally {
            setIsSaving(false);
        }
    }

    async function removeActivity(activity: ServiceActivity) {
        setIsSaving(true);
        setError(null);
        try {
            await deleteActivity.mutateAsync(activity.id);
            setActivityPendingDelete(null);
            await refreshAndClose();
        } catch (caught) {
            setError(getErrorMessage(caught, "Não foi possível excluir a atividade."));
        } finally {
            setIsSaving(false);
        }
    }

    const linkedTithe = details.financial.tithe.transaction;
    const linkedTransactions = details.financial.transactions;
    const contextualActions: Record<ServiceDetailsActionName, () => void> = {
        dates:()=>{setEntryDate(dateInput(details.service.entryDate));setExitDate(dateInput(details.service.exitDate));open("dates");},
        client:()=>{open("relationship");void startRelationshipChange("client");},
        equipament:()=>{open("relationship");void startRelationshipChange("equipament");},
        service:()=>{setStatus(details.service.status);setServiceDescription("Dados do serviço atualizados");open("service");},
        cost:()=>{setHoursWorked(details.service.hoursWorked==null?"":String(details.service.hoursWorked));setCostPerHourInput(details.service.costPerHour==null?"":String(details.service.costPerHour));setCostAction("keep");open("cost");},
        tithe:()=>open("tithe"),transactions:()=>open("transactions"),activities:()=>open("activities")
    };
    return (
        <ServiceDetailsActionsContext.Provider value={contextualActions}>
            <>
                {children}
            <Modal isOpen={dialog === "dates"} title="Atualizar datas do serviço" onClose={() => setDialog(null)}>
                <form className="service-details-management-form" onSubmit={saveDates}>
                    <p>Altere o período do atendimento. A data de saída pode ficar vazia enquanto o serviço estiver em andamento.</p>
                    <label>Data de entrada<input type="date" required value={entryDate} onChange={event => setEntryDate(event.target.value)} /></label>
                    <label>Data de saída<input type="date" min={entryDate} value={exitDate} onChange={event => setExitDate(event.target.value)} /></label>
                    {error && <p className="service-details-management__error" role="alert">{error}</p>}
                    <div className="service-details-management__actions"><button type="button" onClick={() => setDialog(null)}>Cancelar</button><button type="submit" disabled={isSaving}>{isSaving ? "Salvando..." : "Salvar datas"}</button></div>
                </form>
            </Modal>

            <ClientSelectModal
                isOpen={clientSelectOpen}
                title="Selecionar novo cliente"
                clients={clients.clients}
                isLoading={clients.isLoading}
                error={clients.error}
                onClose={() => { setClientSelectOpen(false); setSelectedClient(null); setDialog(null); }}
                onSelect={client => void selectNewClient(client)}
            />
            <EquipamentSelectModal
                isOpen={equipamentSelectOpen && !equipamentCreateOpen}
                title={relationshipMode === "client" ? "Selecionar equipamento do novo cliente" : "Selecionar equipamento"}
                equipaments={equipaments.equipaments}
                isLoading={equipaments.isLoading}
                error={equipaments.error}
                onClose={() => { setEquipamentSelectOpen(false); setSelectedClient(null); setDialog(null); }}
                onSelect={equipament => void selectNewEquipament(equipament)}
                onCreate={() => setEquipamentCreateOpen(true)}
            />
            {selectedClient && (
                <EquipamentCreateModal
                    clientId={selectedClient.id}
                    isOpen={equipamentCreateOpen}
                    isSubmitting={equipaments.isCreating}
                    error={equipaments.createError}
                    onClose={() => setEquipamentCreateOpen(false)}
                    onSubmit={createAndSelectEquipament}
                />
            )}

            <Modal isOpen={dialog === "service"} title="Dados e status do serviço" onClose={() => setDialog(null)}>
                <form className="service-details-management-form" onSubmit={saveServiceData}>
                    <p>O status é controlado manualmente. A alteração será registrada no histórico do serviço.</p>
                    <label>Status<select value={status} onChange={event => setStatus(event.target.value as ServiceStatus)}>{statusOptions.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
                    <label>Descrição do histórico<textarea rows={3} maxLength={500} value={serviceDescription} onChange={event => setServiceDescription(event.target.value)} /></label>
                    {error && <p className="service-details-management__error" role="alert">{error}</p>}
                    <div className="service-details-management__actions"><button type="button" onClick={() => setDialog(null)}>Cancelar</button><button type="submit" disabled={isSaving}>{isSaving ? "Salvando..." : "Salvar informações"}</button></div>
                </form>
            </Modal>

            <Modal isOpen={dialog === "cost"} title="Custo operacional e horas" onClose={() => setDialog(null)}>
                <form className="service-details-management-form" onSubmit={saveOperationalCost}>
                    <p>O custo operacional é calculado multiplicando as horas trabalhadas pelo custo por hora salvo neste serviço.</p>
                    <label>Horas trabalhadas<input type="number" min="0" step="0.25" value={hoursWorked} onChange={event => setHoursWorked(event.target.value)} placeholder="Deixe vazio se ainda não souber" /></label>
                    <label>Configuração do custo por hora<select value={costAction} onChange={event => setCostAction(event.target.value as typeof costAction)}><option value="keep">Manter valor atual ({details.service.costPerHour == null ? "não definido" : currency.format(Number(details.service.costPerHour))})</option><option value="recalculate">Recalcular pelas despesas mensais ativas</option><option value="manual">Definir valor manualmente</option><option value="clear">Remover custo por hora</option></select></label>
                    {costAction === "manual" && <label>Novo custo por hora<input type="number" min="0" step="0.01" value={costPerHourInput} onChange={event => setCostPerHourInput(event.target.value)} placeholder="Ex.: 85,00" required /></label>}
                    {error && <p className="service-details-management__error" role="alert">{error}</p>}
                    <div className="service-details-management__actions"><button type="button" onClick={() => setDialog(null)}>Cancelar</button><button type="submit" disabled={isSaving}>{isSaving ? "Salvando..." : "Atualizar custo"}</button></div>
                </form>
            </Modal>

            <Modal isOpen={dialog === "tithe" && !transactionSelectorOpen && !transactionFormMode} title="Controle do dízimo" onClose={() => setDialog(null)} size="wide">
                <div className="service-details-management-stack">
                    <div className="service-details-management-summary">
                        <span>Valor calculado</span><strong>{currency.format(details.financial.tithe.value)}</strong>
                        <small>{linkedTithe ? "Há um lançamento vinculado como dízimo." : "Nenhum lançamento está vinculado ao dízimo."}</small>
                    </div>
                    {linkedTithe ? (
                        <div className="service-details-management-record">
                            <strong>{linkedTithe.description}</strong>
                            <span>{linkedTithe.categoryName} · {currency.format(Number(linkedTithe.value))} · {new Date(`${linkedTithe.referenceDate.slice(0, 10)}T12:00:00`).toLocaleDateString("pt-BR")}</span>
                            <small>ID: {linkedTithe.id}</small>
                            <div className="service-details-management__actions">
                                <button type="button" onClick={() => openEditTransaction(linkedTithe)}><FontAwesomeIcon icon={faPenToSquare} /> Editar</button>
                                <button type="button" onClick={() => void unlinkTransaction(linkedTithe.id, true)} disabled={isSaving}><FontAwesomeIcon icon={faUnlink} /> Desvincular</button>
                                <button type="button" className="is-danger" onClick={() => setTransactionPendingDelete({ ...linkedTithe, categoryName: linkedTithe.categoryName })}><FontAwesomeIcon icon={faTrash} /> Excluir</button>
                            </div>
                        </div>
                    ) : (
                        <div className="service-details-management-empty">
                            <strong>Dízimo ainda não registrado</strong>
                            <p>Você pode selecionar uma despesa existente sem origem ou criar um novo lançamento de dízimo.</p>
                            <div className="service-details-management__actions">
                                <button type="button" onClick={() => openTransactionSelector("tithe")}><FontAwesomeIcon icon={faRightLeft} /> Consultar transactions</button>
                                <button type="button" onClick={() => openCreateTransaction("tithe")}><FontAwesomeIcon icon={faPlus} /> Criar transaction</button>
                            </div>
                        </div>
                    )}
                    {transactionPendingDelete && <div className="service-details-management-confirm"><p>Excluir esta transaction? Ela será primeiro desvinculada do dízimo e depois excluída do financeiro.</p><div className="service-details-management__actions"><button type="button" onClick={() => setTransactionPendingDelete(null)}>Cancelar</button><button type="button" className="is-danger" disabled={isSaving} onClick={() => void deleteLinkedTransaction(transactionPendingDelete, true)}>{isSaving ? "Excluindo..." : "Desvincular e excluir"}</button></div></div>}
                    {error && <p className="service-details-management__error" role="alert">{error}</p>}
                </div>
            </Modal>

            <Modal isOpen={dialog === "transactions" && !transactionSelectorOpen && !transactionFormMode} title="Entradas e saídas do serviço" onClose={() => setDialog(null)} size="wide">
                <div className="service-details-management-stack">
                    <p>Os lançamentos abaixo estão vinculados ao serviço. O dízimo é gerenciado separadamente.</p>
                    <div className="service-details-management__actions service-details-management__actions--wrap">
                        <button type="button" onClick={() => openTransactionSelector("income")}><FontAwesomeIcon icon={faRightLeft} /> Vincular entrada</button>
                        <button type="button" onClick={() => openTransactionSelector("expense")}><FontAwesomeIcon icon={faRightLeft} /> Vincular saída</button>
                        <button type="button" onClick={() => openCreateTransaction("income")}><FontAwesomeIcon icon={faPlus} /> Criar entrada</button>
                        <button type="button" onClick={() => openCreateTransaction("expense")}><FontAwesomeIcon icon={faPlus} /> Criar saída</button>
                    </div>
                    {linkedTransactions.length === 0 ? <div className="service-details-management-empty"><strong>Nenhum lançamento vinculado</strong><p>Consulte o financeiro para vincular uma transaction ou crie um novo lançamento.</p></div> : linkedTransactions.map(transaction => (
                        <div className="service-details-management-record" key={transaction.id}>
                            <strong>{transaction.description}</strong>
                            <span>{transaction.type === "income" ? "Entrada" : "Saída"} · {transaction.categoryName} · {currency.format(Number(transaction.value))} · {new Date(`${transaction.referenceDate.slice(0, 10)}T12:00:00`).toLocaleDateString("pt-BR")}</span>
                            <small>ID: {transaction.id}</small>
                            <div className="service-details-management__actions">
                                <button type="button" onClick={() => openEditTransaction(transaction)}><FontAwesomeIcon icon={faPenToSquare} /> Editar</button>
                                <button type="button" onClick={() => void unlinkTransaction(transaction.id)} disabled={isSaving}><FontAwesomeIcon icon={faUnlink} /> Desvincular</button>
                                <button type="button" className="is-danger" onClick={() => setTransactionPendingDelete({ ...transaction, categoryName: transaction.categoryName })}><FontAwesomeIcon icon={faTrash} /> Excluir</button>
                            </div>
                        </div>
                    ))}
                    {transactionPendingDelete && <div className="service-details-management-confirm"><p>Excluir esta transaction? Ela será desvinculada do serviço antes da exclusão. Se a exclusão falhar, o lançamento permanecerá no financeiro sem vínculo com este serviço.</p><div className="service-details-management__actions"><button type="button" onClick={() => setTransactionPendingDelete(null)}>Cancelar</button><button type="button" className="is-danger" disabled={isSaving} onClick={() => void deleteLinkedTransaction(transactionPendingDelete)}>{isSaving ? "Excluindo..." : "Desvincular e excluir"}</button></div></div>}
                    {error && <p className="service-details-management__error" role="alert">{error}</p>}
                </div>
            </Modal>

            <Modal isOpen={transactionSelectorOpen} title={transactionTarget === "tithe" ? "Consultar despesas para o dízimo" : `Consultar ${transactionTarget === "income" ? "entradas" : "saídas"} disponíveis`} onClose={() => setTransactionSelectorOpen(false)} size="wide">
                <div className="service-details-management-stack">
                    <p>Somente lançamentos sem vínculo com outra origem podem ser associados a este serviço. Os resultados são ordenados pelos mais recentes e a seleção não altera o lançamento original.</p>

                    <div className="service-details-management-selector">
                        <fieldset className="service-details-management-selector__group service-details-management-selector__group--period">
                            <legend>Período</legend>
                            <div className="service-details-management-selector__fields">
                                <label>Ano
                                    <input type="number" min="1" max="9999" inputMode="numeric" value={transactionFilterYear} onChange={event => { setTransactionFilterYear(event.target.value); setTransactionFilterDate(""); if (!event.target.value) setTransactionFilterMonth(""); setTransactionPage(1); }} placeholder="Todos" />
                                </label>
                                <label>Mês
                                    <select value={transactionFilterMonth} disabled={!transactionFilterYear.trim()} onChange={event => { setTransactionFilterMonth(event.target.value); setTransactionFilterDate(""); setTransactionPage(1); }}>
                                        <option value="">Todos</option>
                                        <option value="1">Janeiro</option><option value="2">Fevereiro</option><option value="3">Março</option><option value="4">Abril</option>
                                        <option value="5">Maio</option><option value="6">Junho</option><option value="7">Julho</option><option value="8">Agosto</option>
                                        <option value="9">Setembro</option><option value="10">Outubro</option><option value="11">Novembro</option><option value="12">Dezembro</option>
                                    </select>
                                </label>
                            </div>
                            <label>Data específica
                                <input type="date" value={transactionFilterDate} onChange={event => { const date = event.target.value; setTransactionFilterDate(date); if (date) { setTransactionFilterYear(date.slice(0, 4)); setTransactionFilterMonth(String(Number(date.slice(5, 7)))); } setTransactionPage(1); }} />
                            </label>
                        </fieldset>

                        <fieldset className="service-details-management-selector__group service-details-management-selector__group--classification">
                            <legend>Classificação</legend>
                            <label>Tipo de lançamento
                                <select value={transactionTarget === "income" ? "income" : "expense"} disabled>
                                    <option value="income">Entrada</option>
                                    <option value="expense">Saída</option>
                                </select>
                            </label>
                            <label>Categoria
                                <select value={transactionFilterCategoryId} onChange={event => { setTransactionFilterCategoryId(event.target.value); setTransactionPage(1); }} disabled={filterCategories.isPending || filterCategories.isError}>
                                    <option value="">Todas as categorias</option>
                                    {filterCategoryOptions.map(category => <option key={category.id} value={category.id}>{category.name}{category.active ? "" : " (inativa)"}</option>)}
                                </select>
                            </label>
                        </fieldset>

                        <fieldset className="service-details-management-selector__group service-details-management-selector__group--search">
                            <legend>Pesquisa</legend>
                            <label>Descrição ou identificador
                                <input type="search" value={transactionSearch} onChange={event => { setTransactionSearch(event.target.value); setTransactionPage(1); }} placeholder="Digite parte da descrição ou ID" />
                            </label>
                            <label>Valor exato
                                <input type="number" min="1" step="0.01" value={transactionFilterValue} onChange={event => { setTransactionFilterValue(event.target.value); setTransactionPage(1); }} placeholder="Ex.: 250.00" />
                            </label>
                        </fieldset>
                    </div>

                    {filterCategories.isError && <p className="service-details-management__error" role="alert">Não foi possível carregar as categorias para o filtro.</p>}

                    {availableTransactions.isPending ? <div className="service-details-management-empty"><strong>Carregando lançamentos...</strong></div> : availableTransactions.isError ? <div className="service-details-management-empty" role="alert"><strong>Não foi possível consultar o financeiro</strong><p>Tente novamente em instantes.</p><button type="button" onClick={() => void availableTransactions.refetch()}>Tentar novamente</button></div> : (availableTransactions.data?.transactions.length ?? 0) === 0 ? <div className="service-details-management-empty"><strong>Nenhum lançamento disponível</strong><p>Não encontramos lançamentos livres que correspondam aos filtros selecionados.</p></div> : (
                        <>
                            <div className="service-details-management-selector__results" aria-live="polite">
                                {availableTransactions.data!.transactions.map(transaction => (
                                    <div className="service-details-management-record" key={transaction.id}>
                                        <strong>{transaction.description}</strong>
                                        <span>{transaction.type === "income" ? "Entrada" : "Saída"} · {transaction.categoryName} · {currency.format(Number(transaction.value))} · {new Date(`${transaction.referenceDate.slice(0, 10)}T12:00:00`).toLocaleDateString("pt-BR")}</span>
                                        <small>ID: {transaction.id}</small>
                                        <div className="service-details-management__actions"><button type="button" onClick={() => void selectTransaction(transaction)} disabled={isSaving}>{isSaving ? "Vinculando..." : transactionTarget === "tithe" ? "Vincular como dízimo" : "Vincular ao serviço"}</button></div>
                                    </div>
                                ))}
                            </div>
                            <div className="service-details-management-selector__pagination">
                                <span>Exibindo {(availableTransactions.data!.page - 1) * availableTransactions.data!.limit + 1}–{Math.min(availableTransactions.data!.page * availableTransactions.data!.limit, availableTransactions.data!.total)} de {availableTransactions.data!.total}</span>
                                <div>
                                    <button type="button" onClick={() => setTransactionPage(currentPage => Math.max(1, currentPage - 1))} disabled={availableTransactions.data!.page <= 1 || availableTransactions.isFetching}>Anterior</button>
                                    <span>Página {availableTransactions.data!.page} de {availableTransactions.data!.totalPages}</span>
                                    <button type="button" onClick={() => setTransactionPage(currentPage => currentPage + 1)} disabled={availableTransactions.data!.page >= availableTransactions.data!.totalPages || availableTransactions.isFetching}>Próxima</button>
                                </div>
                            </div>
                        </>
                    )}
                    {error && <p className="service-details-management__error" role="alert">{error}</p>}
                </div>
            </Modal>

            {transactionFormMode && (
                <Modal isOpen title={transactionFormMode === "create" ? "Criar lançamento e vincular ao serviço" : "Editar lançamento"} onClose={() => { setTransactionFormMode(null); setEditingTransaction(null); }}>
                    <form className="service-details-management-form" onSubmit={saveTransaction}>
                        <p>{transactionFormMode === "create" ? "O lançamento será criado no financeiro e vinculado a este serviço em seguida." : "A edição preserva o vínculo atual com o serviço."}</p>
                        <label>Tipo<select value={transactionFormType} disabled onChange={event => { setTransactionFormType(event.target.value as FinancialType); setTransactionCategoryId(""); }}>{transactionTarget === "tithe" ? <option value="expense">Saída</option> : <><option value="income">Entrada</option><option value="expense">Saída</option></>}</select></label>
                        <label>Descrição<input value={transactionDescription} onChange={event => setTransactionDescription(event.target.value)} maxLength={160} required /></label>
                        <label>Valor<input type="number" min="0.01" step="0.01" value={transactionValue} onChange={event => setTransactionValue(event.target.value)} required /></label>
                        {categories.isPending && <p>Carregando categorias...</p>}
                        {categories.isError && <p className="service-details-management__error" role="alert">Não foi possível carregar as categorias financeiras.</p>}
                        {transactionFormMode === "create" && !categories.isPending && !categories.isError && activeCategories.length === 0 && <p className="service-details-management__error" role="alert">Não há categorias ativas para este tipo de lançamento. Cadastre uma categoria no módulo financeiro antes de continuar.</p>}
                        <label>Categoria<select value={transactionCategoryId} onChange={event => setTransactionCategoryId(event.target.value)} required disabled={categories.isPending || categories.isError}><option value="">Selecione uma categoria ativa</option>{(transactionFormMode === "edit" ? transactionCategoryOptions : activeCategories).map(category => <option key={category.id} value={category.id}>{category.name}{category.active ? "" : " (inativa)"}</option>)}</select></label>
                        <label>Data de referência<input type="date" value={transactionReferenceDate} onChange={event => setTransactionReferenceDate(event.target.value)} required /></label>
                        {error && <p className="service-details-management__error" role="alert">{error}</p>}
                        <div className="service-details-management__actions"><button type="button" onClick={() => { setTransactionFormMode(null); setEditingTransaction(null); }}>Cancelar</button><button type="submit" disabled={isSaving}>{isSaving ? "Salvando..." : transactionFormMode === "create" ? "Criar e vincular" : "Salvar alterações"}</button></div>
                    </form>
                </Modal>
            )}


            <Modal isOpen={dialog === "activities" && !activityFormMode} title="Gerenciar atividades" onClose={() => setDialog(null)} size="wide">
                <div className="service-details-management-stack">
                    <div className="service-details-management__actions"><button type="button" onClick={() => openActivityForm()}><FontAwesomeIcon icon={faPlus} /> Nova atividade</button></div>
                    {details.activities.list.length === 0 ? <div className="service-details-management-empty"><strong>Nenhuma atividade registrada</strong><p>Crie a primeira atividade para acompanhar a execução do serviço.</p></div> : details.activities.list.map(activity => (
                        <div className="service-details-management-record" key={activity.id}>
                            <strong>{activity.title}</strong><span>{activityStatusOptions.find(option => option.value === activity.status)?.label} · {activity.startAt ? dateInput(activity.startAt) : "Sem início"} · {activity.endAt ? dateInput(activity.endAt) : "Sem fim"}</span>
                            {activity.description && <p>{activity.description}</p>}<small>ID: {activity.id}</small>
                            <div className="service-details-management__actions"><button type="button" onClick={() => openActivityForm(activity)}><FontAwesomeIcon icon={faPenToSquare} /> Editar</button><button type="button" className="is-danger" onClick={() => setActivityPendingDelete(activity)}><FontAwesomeIcon icon={faTrash} /> Excluir</button></div>
                        </div>
                    ))}
                    {activityPendingDelete && <div className="service-details-management-confirm"><p>Excluir a atividade “{activityPendingDelete.title}”? Essa ação não poderá ser desfeita.</p><div className="service-details-management__actions"><button type="button" onClick={() => setActivityPendingDelete(null)}>Cancelar</button><button type="button" className="is-danger" disabled={isSaving} onClick={() => void removeActivity(activityPendingDelete)}>{isSaving ? "Excluindo..." : "Confirmar exclusão"}</button></div></div>}
                    {error && <p className="service-details-management__error" role="alert">{error}</p>}
                </div>
            </Modal>

            {activityFormMode && (
                <Modal isOpen title={activityFormMode === "create" ? "Criar atividade" : "Editar atividade"} onClose={() => setActivityFormMode(null)}>
                    <form className="service-details-management-form" onSubmit={saveActivity}>
                        <label>Título<input value={activityTitle} onChange={event => setActivityTitle(event.target.value)} maxLength={160} required /></label>
                        <label>Descrição<textarea rows={3} value={activityDescription} onChange={event => setActivityDescription(event.target.value)} maxLength={1000} /></label>
                        <label>Status<select value={activityStatus} onChange={event => setActivityStatus(event.target.value as ServiceActivityStatus)}>{activityStatusOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
                        <label>Data de início<input type="date" value={activityStartAt} onChange={event => setActivityStartAt(event.target.value)} /></label>
                        <label>Data de conclusão<input type="date" min={activityStartAt || undefined} value={activityEndAt} onChange={event => setActivityEndAt(event.target.value)} /></label>
                        {error && <p className="service-details-management__error" role="alert">{error}</p>}
                        <div className="service-details-management__actions"><button type="button" onClick={() => setActivityFormMode(null)}>Cancelar</button><button type="submit" disabled={isSaving}>{isSaving ? "Salvando..." : "Salvar atividade"}</button></div>
                    </form>
                </Modal>
            )}
            </>
        </ServiceDetailsActionsContext.Provider>
    );
}
