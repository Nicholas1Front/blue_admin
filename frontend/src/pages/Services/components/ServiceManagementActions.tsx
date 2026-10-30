import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faPenToSquare, faTrash, faMagnifyingGlass, faArrowRight } from "@fortawesome/free-solid-svg-icons";

import { Modal } from "../../../components/Modal/Modal";
import { useClients } from "../../../modules/clients/useClients";
import type { Client, CreateClientRequest } from "../../../modules/clients/clients.types";
import { useEquipaments } from "../../../modules/equipaments/useEquipaments";
import type { CreateEquipamentRequest, Equipament } from "../../../modules/equipaments/equipaments.types";
import {
    useCreateService,
    useDeleteService,
    useServicesByFilters
} from "../../../modules/services";
import type {
    CreateServiceRequest,
    FindServicesByAdvancedFilters,
    ServiceStatus,
    ServiceSummary
} from "../../../modules/services";
import { ClientCreateModal } from "../../Clients/components/ClientCreateModal/ClientCreateModal";
import { ClientSelectModal } from "../../Clients/components/ClientSelectModal/ClientSelectModal";
import { EquipamentCreateModal } from "../../Clients/components/EquipamentCreateModal/EquipamentCreateModal";
import { EquipamentSelectModal } from "../../Clients/components/EquipamentSelectModal/EquipamentSelectModal";

import "./ServiceManagementActions.css";

type ManagementMode = "edit" | "delete" | null;
type CreateStep = "client" | "equipament" | "details";

const statuses: Array<{ value: ServiceStatus; label: string }> = [
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

type SearchFilterGroup = "general" | "client" | "activities" | "financial" | "history" | "operational";

const searchFilterGroups: Array<{ value: SearchFilterGroup; label: string }> = [
    { value: "general", label: "Geral" },
    { value: "client", label: "Cliente e equipamento" },
    { value: "activities", label: "Atividades" },
    { value: "financial", label: "Financeiro" },
    { value: "history", label: "Histórico" },
    { value: "operational", label: "Operacional" }
];

const searchFilterGroupByField: Record<string, SearchFilterGroup> = {
    search: "general", serviceStatus: "general", serviceId: "general",
    entryDateFrom: "general", entryDateTo: "general", exitDateFrom: "general",
    exitDateTo: "general", exitDateIsNull: "general",
    clientName: "client", clientDocument: "client", clientId: "client",
    equipamentId: "client", equipamentSearch: "client",
    activityId: "activities", activityTitle: "activities", activityDescription: "activities",
    activityStatus: "activities", activityStartFrom: "activities", activityStartTo: "activities",
    activityEndFrom: "activities", activityEndTo: "activities",
    titheStatus: "financial", titheTransactionId: "financial", transactionType: "financial",
    transactionCategoryId: "financial", transactionCategoryName: "financial",
    transactionDescription: "financial", transactionValueMin: "financial", transactionValueMax: "financial",
    transactionReferenceDateFrom: "financial", transactionReferenceDateTo: "financial",
    historyId: "history", historyEventType: "history", historyDescription: "history",
    historyDateFrom: "history", historyDateTo: "history",
    hoursWorkedMin: "operational", hoursWorkedMax: "operational"
};

const managementSearchFields: Array<{
    key: Exclude<keyof FindServicesByAdvancedFilters, "page" | "limit">;
    label: string;
    type?: "text" | "date" | "number";
    options?: Array<{ value: string; label: string }>;
}> = [
    { key: "search", label: "Busca geral", type: "text" },
    { key: "serviceStatus", label: "Status do serviço", options: statuses },
    { key: "entryDateFrom", label: "Entrada a partir de", type: "date" },
    { key: "entryDateTo", label: "Entrada até", type: "date" },
    { key: "clientName", label: "Nome do cliente", type: "text" },
    { key: "clientDocument", label: "Documento do cliente", type: "text" },
    { key: "clientId", label: "ID do cliente", type: "text" },
    { key: "equipamentId", label: "ID do equipamento", type: "text" },
    { key: "equipamentSearch", label: "Buscar equipamento", type: "text" },
    { key: "serviceId", label: "ID do serviço", type: "text" },
    { key: "exitDateFrom", label: "Saída a partir de", type: "date" },
    { key: "exitDateTo", label: "Saída até", type: "date" },
    { key: "exitDateIsNull", label: "Situação da saída", options: [{ value: "true", label: "Ainda sem saída" }, { value: "false", label: "Já saiu" }] },
    { key: "hoursWorkedMin", label: "Horas mínimas", type: "number" },
    { key: "hoursWorkedMax", label: "Horas máximas", type: "number" },
    { key: "titheStatus", label: "Status do dízimo", options: [{ value: "aguardando", label: "Aguardando" }, { value: "não concluído", label: "Não concluído" }, { value: "concluído", label: "Concluído" }] },
    { key: "titheTransactionId", label: "ID da transação do dízimo", type: "text" },
    { key: "activityId", label: "ID da atividade", type: "text" },
    { key: "activityTitle", label: "Título da atividade", type: "text" },
    { key: "activityDescription", label: "Descrição da atividade", type: "text" },
    { key: "activityStatus", label: "Status da atividade", options: [{ value: "pendente", label: "Pendente" }, { value: "em_execução", label: "Em execução" }, { value: "concluida", label: "Concluída" }, { value: "cancelada", label: "Cancelada" }] },
    { key: "activityStartFrom", label: "Atividade iniciada a partir de", type: "date" },
    { key: "activityStartTo", label: "Atividade iniciada até", type: "date" },
    { key: "activityEndFrom", label: "Atividade encerrada a partir de", type: "date" },
    { key: "activityEndTo", label: "Atividade encerrada até", type: "date" },
    { key: "transactionType", label: "Tipo de lançamento", options: [{ value: "income", label: "Entrada" }, { value: "expense", label: "Saída" }] },
    { key: "transactionCategoryId", label: "ID da categoria", type: "text" },
    { key: "transactionCategoryName", label: "Nome da categoria", type: "text" },
    { key: "transactionDescription", label: "Descrição do lançamento", type: "text" },
    { key: "transactionValueMin", label: "Valor mínimo", type: "number" },
    { key: "transactionValueMax", label: "Valor máximo", type: "number" },
    { key: "transactionReferenceDateFrom", label: "Lançamento a partir de", type: "date" },
    { key: "transactionReferenceDateTo", label: "Lançamento até", type: "date" },
    { key: "historyId", label: "ID do evento", type: "text" },
    { key: "historyEventType", label: "Tipo do evento", type: "text" },
    { key: "historyDescription", label: "Descrição do evento", type: "text" },
    { key: "historyDateFrom", label: "Evento a partir de", type: "date" },
    { key: "historyDateTo", label: "Evento até", type: "date" }
];

function emptyManagementSearch(): Record<string, string> {
    return Object.fromEntries(managementSearchFields.map(field => [field.key, ""]));
}

function getLocalDateInputValue() {
    const date = new Date();
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
    return localDate.toISOString().slice(0, 10);
}

function formatEquipment(equipment: Pick<Equipament, "type" | "brand" | "model" | "mainIdentification" | "additionalIdentification">) {
    return [
        equipment.type,
        [equipment.brand, equipment.model].filter(Boolean).join(" "),
        equipment.mainIdentification,
        equipment.additionalIdentification
    ].filter(Boolean).join(" · ");
}

function formatServiceLabel(service: ServiceSummary) {
    return `${service.client.name} — ${formatEquipment(service.equipament)} — #${service.id.slice(0, 8)}`;
}

export function ServiceManagementActions() {
    const navigate = useNavigate();
    const clients = useClients();
    const equipaments = useEquipaments();
    const createMutation = useCreateService();
    const deleteMutation = useDeleteService();

    const [createStep, setCreateStep] = useState<CreateStep>("client");
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [selectedEquipament, setSelectedEquipament] = useState<Equipament | null>(null);
    const [isClientSelectOpen, setIsClientSelectOpen] = useState(false);
    const [isClientCreateOpen, setIsClientCreateOpen] = useState(false);
    const [isEquipamentSelectOpen, setIsEquipamentSelectOpen] = useState(false);
    const [isEquipamentCreateOpen, setIsEquipamentCreateOpen] = useState(false);
    const [entryDate, setEntryDate] = useState(getLocalDateInputValue());
    const [exitDate, setExitDate] = useState("");
    const [status, setStatus] = useState<ServiceStatus>("pendente");
    const [hoursWorked, setHoursWorked] = useState("8");
    const [historyDescription, setHistoryDescription] = useState("Serviço criado");
    const [createError, setCreateError] = useState<string | null>(null);

    const [managementMode, setManagementMode] = useState<ManagementMode>(null);
    const [searchDraft, setSearchDraft] = useState<Record<string, string>>(emptyManagementSearch());
    const [activeFilterGroup, setActiveFilterGroup] = useState<SearchFilterGroup>("general");
    const [appliedFilters, setAppliedFilters] = useState<FindServicesByAdvancedFilters | null>(null);
    const [selectedService, setSelectedService] = useState<ServiceSummary | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    const serviceSearchQuery = useServicesByFilters(
        appliedFilters ?? { page: 1, limit: 10 },
        managementMode !== null && appliedFilters !== null
    );

    function resetCreateFlow() {
        setCreateStep("client");
        setSelectedClient(null);
        setSelectedEquipament(null);
        setEntryDate(getLocalDateInputValue());
        setExitDate("");
        setStatus("pendente");
        setHoursWorked("8");
        setHistoryDescription("Serviço criado");
        setCreateError(null);
        setIsClientSelectOpen(false);
        setIsClientCreateOpen(false);
        setIsEquipamentSelectOpen(false);
        setIsEquipamentCreateOpen(false);
    }

    function startCreateFlow() {
        resetCreateFlow();
        void clients.loadClients();
        setIsClientSelectOpen(true);
    }

    async function handleCreateClient(data: CreateClientRequest) {
        const client = await clients.addClient(data);
        setSelectedClient(client);
        setIsClientCreateOpen(false);
        setCreateStep("equipament");
        await equipaments.loadEquipaments(client.id);
        setIsEquipamentSelectOpen(true);
    }

    async function handleCreateEquipament(data: CreateEquipamentRequest) {
        if (!selectedClient) return;
        const equipament = await equipaments.addEquipament(selectedClient.id, data);
        setSelectedEquipament(equipament);
        setIsEquipamentCreateOpen(false);
        setCreateStep("details");
    }

    async function handleCreateService(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!selectedClient || !selectedEquipament) return;
        setCreateError(null);

        const payload: CreateServiceRequest = {
            clientId: selectedClient.id,
            equipamentId: selectedEquipament.id,
            entryDate: new Date(`${entryDate}T12:00:00`).toISOString(),
            exitDate: exitDate ? new Date(`${exitDate}T12:00:00`).toISOString() : null,
            status,
            hoursWorked: hoursWorked.trim() === "" ? null : Number(hoursWorked),
            description: historyDescription.trim() || "Serviço criado"
        };

        try {
            const result = await createMutation.mutateAsync(payload);
            resetCreateFlow();
            navigate(`/services/${encodeURIComponent(result.service.id)}?created=1`);
        } catch (error) {
            setCreateError(error instanceof Error ? error.message : "Não foi possível criar o serviço.");
        }
    }

    function startManagement(mode: Exclude<ManagementMode, null>) {
        setManagementMode(mode);
        setSelectedService(null);
        setAppliedFilters(null);
        setDeleteError(null);
        setSearchDraft(emptyManagementSearch());
        setActiveFilterGroup("general");
    }

    function submitServiceSearch(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const values: Record<string, unknown> = { page: 1, limit: 10 };
        Object.entries(searchDraft).forEach(([key, rawValue]) => {
            const value = rawValue.trim();
            if (!value) return;
            if (key === "exitDateIsNull") {
                values[key] = value === "true";
            } else if (["hoursWorkedMin", "hoursWorkedMax", "transactionValueMin", "transactionValueMax"].includes(key)) {
                values[key] = Number(value);
            } else {
                values[key] = value;
            }
        });
        setAppliedFilters(values as unknown as FindServicesByAdvancedFilters);
    }

    function chooseService(service: ServiceSummary) {
        if (managementMode === "edit") {
            setManagementMode(null);
            navigate(`/services/${encodeURIComponent(service.id)}`);
            return;
        }
        setSelectedService(service);
    }

    async function confirmDeleteService() {
        if (!selectedService) return;
        setDeleteError(null);
        try {
            await deleteMutation.mutateAsync(selectedService.id);
            setSelectedService(null);
            setManagementMode(null);
            setAppliedFilters(null);
        } catch (error) {
            setDeleteError(error instanceof Error ? error.message : "Não foi possível excluir o serviço.");
        }
    }

    return (
        <>
            <section className="service-management" aria-label="Ações de serviços">
                <button className="service-management__button service-management__button--create" type="button" onClick={startCreateFlow}>
                    <FontAwesomeIcon icon={faPlus} aria-hidden="true" /> Criar serviço
                </button>
                <button className="service-management__button" type="button" onClick={() => startManagement("edit")}>
                    <FontAwesomeIcon icon={faPenToSquare} aria-hidden="true" /> Editar serviço
                </button>
                <button className="service-management__button service-management__button--delete" type="button" onClick={() => startManagement("delete")}>
                    <FontAwesomeIcon icon={faTrash} aria-hidden="true" /> Excluir serviço
                </button>
            </section>

            <ClientSelectModal
                isOpen={isClientSelectOpen}
                title="Etapa 1 de 3 — Selecionar cliente"
                clients={clients.clients}
                isLoading={clients.isLoading}
                error={clients.error}
                onClose={() => { setIsClientSelectOpen(false); resetCreateFlow(); }}
                onSelect={async client => {
                    setSelectedClient(client);
                    setIsClientSelectOpen(false);
                    setCreateStep("equipament");
                    await equipaments.loadEquipaments(client.id);
                    setIsEquipamentSelectOpen(true);
                }}
                onCreate={() => { clients.clearCreateError(); setIsClientSelectOpen(false); setIsClientCreateOpen(true); }}
            />

            <ClientCreateModal
                isOpen={isClientCreateOpen}
                isSubmitting={clients.isCreating}
                error={clients.createError}
                onClose={() => { setIsClientCreateOpen(false); setIsClientSelectOpen(true); }}
                onSubmit={handleCreateClient}
            />

            {selectedClient && (
                <EquipamentSelectModal
                    isOpen={isEquipamentSelectOpen}
                    title="Etapa 2 de 3 — Selecionar equipamento"
                    equipaments={equipaments.equipaments}
                    isLoading={equipaments.isLoading}
                    error={equipaments.error}
                    onClose={() => { setIsEquipamentSelectOpen(false); resetCreateFlow(); }}
                    onSelect={equipment => {
                        setSelectedEquipament(equipment);
                        setIsEquipamentSelectOpen(false);
                        setCreateStep("details");
                    }}
                    onCreate={() => { equipaments.clearCreateError(); setIsEquipamentSelectOpen(false); setIsEquipamentCreateOpen(true); }}
                />
            )}

            {selectedClient && (
                <EquipamentCreateModal
                    clientId={selectedClient.id}
                    isOpen={isEquipamentCreateOpen}
                    isSubmitting={equipaments.isCreating}
                    error={equipaments.createError}
                    onClose={() => { setIsEquipamentCreateOpen(false); setIsEquipamentSelectOpen(true); }}
                    onSubmit={handleCreateEquipament}
                />
            )}

            <Modal
                isOpen={createStep === "details" && Boolean(selectedClient && selectedEquipament)}
                title="Etapa 3 de 3 — Dados do serviço"
                onClose={resetCreateFlow}
            >
                <form className="service-management-form" onSubmit={handleCreateService}>
                    <div className="service-management-form__context">
                        <strong>{selectedClient?.name}</strong>
                        <span>{selectedEquipament ? formatEquipment(selectedEquipament) : ""}</span>
                    </div>
                    <label><span>Data de entrada</span><input type="date" required value={entryDate} onChange={event => setEntryDate(event.target.value)} /></label>
                    <label><span>Data de saída (opcional)</span><input type="date" min={entryDate} value={exitDate} onChange={event => setExitDate(event.target.value)} /></label>
                    <label><span>Status</span><select value={status} onChange={event => setStatus(event.target.value as ServiceStatus)}>{statuses.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
                    <label><span>Horas trabalhadas (opcional)</span><input type="number" min="0" step="0.25" value={hoursWorked} onChange={event => setHoursWorked(event.target.value)} placeholder="Deixe vazio se ainda não souber" /></label>
                    <label><span>Descrição do histórico</span><textarea rows={3} value={historyDescription} onChange={event => setHistoryDescription(event.target.value)} maxLength={500} /><small>O padrão é “Serviço criado”. Você pode registrar mais detalhes.</small></label>
                    {createError && <p className="service-management-form__error" role="alert">{createError}</p>}
                    <p className="service-management-form__note">O custo por hora ficará sem valor até você optar por calculá-lo após a criação.</p>
                    <div className="service-management-form__actions">
                        <button type="button" className="service-management__secondary" onClick={() => { setCreateStep("equipament"); setIsEquipamentSelectOpen(true); }}>Voltar</button>
                        <button type="submit" className="service-management__button service-management__button--create" disabled={createMutation.isPending}>{createMutation.isPending ? "Criando serviço..." : "Criar serviço"}</button>
                    </div>
                </form>
            </Modal>

            <Modal
                size="wide"
                isOpen={managementMode !== null && !(managementMode === "delete" && selectedService !== null)}
                title={managementMode === "edit" ? "Selecionar serviço para editar" : "Selecionar serviço para excluir"}
                onClose={() => { setManagementMode(null); setAppliedFilters(null); }}
            >
                <div className="service-management-search">
                    <p>Use os filtros para localizar o serviço. A edição abre a página de detalhes; a exclusão pede confirmação antes de remover o registro.</p>
                    <form className="service-management-search__form" onSubmit={submitServiceSearch}>
                        <div className="service-management-search__filter-groups" role="group" aria-label="Grupos de filtros">
                            {searchFilterGroups.map(group => {
                                const filledCount = managementSearchFields.filter(field => searchFilterGroupByField[field.key] === group.value && Boolean(searchDraft[field.key]?.trim())).length;
                                return (
                                    <button key={group.value} type="button"
                                        className={"service-management-search__group" + (activeFilterGroup === group.value ? " is-active" : "")}
                                        aria-pressed={activeFilterGroup === group.value}
                                        onClick={() => setActiveFilterGroup(group.value)}>
                                        <span>{group.label}</span>
                                        {filledCount > 0 && <small>{filledCount}</small>}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="service-management-search__group-heading">
                            <strong>{searchFilterGroups.find(group => group.value === activeFilterGroup)?.label}</strong>
                            <span>{managementSearchFields.filter(field => searchFilterGroupByField[field.key] === activeFilterGroup).length} filtros disponíveis</span>
                        </div>
                        <div className="service-management-search__grid">
                            {managementSearchFields.filter(field => searchFilterGroupByField[field.key] === activeFilterGroup).map(field => (
                                <label key={field.key}>
                                    <span>{field.label}</span>
                                    {field.options ? (
                                        <select value={searchDraft[field.key] ?? ""} onChange={event => setSearchDraft(current => ({ ...current, [field.key]: event.target.value }))}>
                                            <option value="">Todos</option>
                                            {field.options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                                        </select>
                                    ) : (
                                        <input type={field.type ?? "text"} min={field.type === "number" ? "0" : undefined}
                                            step={field.type === "number" ? "any" : undefined} value={searchDraft[field.key] ?? ""}
                                            onChange={event => setSearchDraft(current => ({ ...current, [field.key]: event.target.value }))} />
                                    )}
                                </label>
                            ))}
                        </div>
                        <div className="service-management-search__form-actions">
                            <button type="button" className="service-management__secondary" onClick={() => { setSearchDraft(emptyManagementSearch()); setAppliedFilters(null); }}>Limpar filtros</button>
                            <button className="service-management__button service-management__button--create" type="submit">
                                <FontAwesomeIcon icon={faMagnifyingGlass} aria-hidden="true" /> Pesquisar serviços
                            </button>
                        </div>
                    </form>
                    {serviceSearchQuery.isError && <p className="service-management-form__error" role="alert">Não foi possível pesquisar serviços.</p>}
                    {appliedFilters && (
                        <div className="service-management-search__results">
                            {serviceSearchQuery.isPending ? <p>Pesquisando serviços…</p> : serviceSearchQuery.data?.services.length ? serviceSearchQuery.data.services.map(service => (
                                <button key={service.id} type="button" onClick={() => chooseService(service)}>
                                    <span><strong>{service.client.name}</strong><small>{formatServiceLabel(service)}</small></span>
                                    <FontAwesomeIcon icon={faArrowRight} aria-hidden="true" />
                                </button>
                            )) : <p>Nenhum serviço encontrado com esses filtros.</p>}
                            {serviceSearchQuery.data && serviceSearchQuery.data.pagination.totalPages > 1 && (
                                <div className="service-management-search__pagination">
                                    <span>Página {serviceSearchQuery.data.pagination.page} de {serviceSearchQuery.data.pagination.totalPages} · {serviceSearchQuery.data.pagination.total} resultados</span>
                                    <div>
                                        <button type="button" disabled={serviceSearchQuery.data.pagination.page <= 1} onClick={() => setAppliedFilters(current => current ? { ...current, page: Math.max(1, (current.page ?? 1) - 1) } : current)}>Anterior</button>
                                        <button type="button" disabled={serviceSearchQuery.data.pagination.page >= serviceSearchQuery.data.pagination.totalPages} onClick={() => setAppliedFilters(current => current ? { ...current, page: (current.page ?? 1) + 1 } : current)}>Próxima</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </Modal>

            <Modal isOpen={managementMode === "delete" && selectedService !== null} title="Confirmar exclusão do serviço" onClose={() => setSelectedService(null)}>
                <div className="service-management-confirm">
                    <p>Você está prestes a excluir este serviço e seu histórico:</p>
                    <strong>{selectedService ? formatServiceLabel(selectedService) : ""}</strong>
                    <p>Os lançamentos financeiros serão preservados, mas perderão a referência a este serviço.</p>
                    {deleteError && <p className="service-management-form__error" role="alert">{deleteError}</p>}
                    <div className="service-management-form__actions">
                        <button type="button" className="service-management__secondary" onClick={() => setSelectedService(null)}>Cancelar</button>
                        <button type="button" className="service-management__button service-management__button--delete" onClick={() => void confirmDeleteService()} disabled={deleteMutation.isPending}>{deleteMutation.isPending ? "Excluindo..." : "Confirmar exclusão"}</button>
                    </div>
                </div>
            </Modal>
        </>
    );
}
