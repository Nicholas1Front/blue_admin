import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faPenToSquare, faTrash, faMagnifyingGlass, faArrowRight } from "@fortawesome/free-solid-svg-icons";

import { Modal } from "../../../components/Modal/Modal";
import { useClients } from "../../../modules/clients/useClients";
import type { Client } from "../../../modules/clients/clients.types";
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
    const [searchDraft, setSearchDraft] = useState({
        search: "",
        clientName: "",
        equipamentSearch: "",
        serviceId: "",
        serviceStatus: "" as ServiceStatus | "",
        entryDateFrom: "",
        entryDateTo: "",
        exitDateIsNull: "" as "" | "true" | "false"
    });
    const [appliedFilters, setAppliedFilters] = useState<FindServicesByAdvancedFilters | null>(null);
    const [selectedService, setSelectedService] = useState<ServiceSummary | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    const serviceSearchQuery = useServicesByFilters(
        appliedFilters ?? { page: 1, limit: 10 },
        managementMode !== null && appliedFilters !== null
    );

    useEffect(() => {
        if (isClientSelectOpen) void clients.loadClients();
    }, [isClientSelectOpen]);

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
        setIsClientSelectOpen(true);
    }

    async function handleCreateClient(data: import("../../../modules/clients/clients.types").CreateClientRequest) {
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
        setSearchDraft({
            search: "",
            clientName: "",
            equipamentSearch: "",
            serviceId: "",
            serviceStatus: "",
            entryDateFrom: "",
            entryDateTo: "",
            exitDateIsNull: ""
        });
    }

    function submitServiceSearch(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const filters: FindServicesByAdvancedFilters = {
            page: 1,
            limit: 10,
            ...(searchDraft.search.trim() && { search: searchDraft.search.trim() }),
            ...(searchDraft.clientName.trim() && { clientName: searchDraft.clientName.trim() }),
            ...(searchDraft.equipamentSearch.trim() && { equipamentSearch: searchDraft.equipamentSearch.trim() }),
            ...(searchDraft.serviceId.trim() && { serviceId: searchDraft.serviceId.trim() }),
            ...(searchDraft.serviceStatus && { serviceStatus: searchDraft.serviceStatus }),
            ...(searchDraft.entryDateFrom && { entryDateFrom: searchDraft.entryDateFrom }),
            ...(searchDraft.entryDateTo && { entryDateTo: searchDraft.entryDateTo }),
            ...(searchDraft.exitDateIsNull && { exitDateIsNull: searchDraft.exitDateIsNull === "true" })
        };
        setAppliedFilters(filters);
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
                onCreate={() => { setIsClientSelectOpen(false); setIsClientCreateOpen(true); }}
            />

            <ClientCreateModal
                isOpen={isClientCreateOpen}
                isSubmitting={clients.isCreating}
                error={clients.createError}
                onClose={() => setIsClientCreateOpen(false)}
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
                    onCreate={() => { setIsEquipamentSelectOpen(false); setIsEquipamentCreateOpen(true); }}
                />
            )}

            {selectedClient && (
                <EquipamentCreateModal
                    clientId={selectedClient.id}
                    isOpen={isEquipamentCreateOpen}
                    isSubmitting={equipaments.isCreating}
                    error={equipaments.createError}
                    onClose={() => setIsEquipamentCreateOpen(false)}
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
                isOpen={managementMode !== null}
                title={managementMode === "edit" ? "Selecionar serviço para editar" : "Selecionar serviço para excluir"}
                onClose={() => { setManagementMode(null); setAppliedFilters(null); }}
            >
                <div className="service-management-search">
                    <p>Use os filtros para localizar o serviço. A edição abre a página de detalhes; a exclusão pede confirmação antes de remover o registro.</p>
                    <form onSubmit={submitServiceSearch}>
                        <label><span>Busca geral</span><input value={searchDraft.search} onChange={event => setSearchDraft(current => ({ ...current, search: event.target.value }))} placeholder="Cliente, documento, equipamento, atividade ou código" /></label>
                        <div className="service-management-search__grid">
                            <label><span>Nome do cliente</span><input value={searchDraft.clientName} onChange={event => setSearchDraft(current => ({ ...current, clientName: event.target.value }))} /></label>
                            <label><span>Equipamento</span><input value={searchDraft.equipamentSearch} onChange={event => setSearchDraft(current => ({ ...current, equipamentSearch: event.target.value }))} /></label>
                            <label><span>ID do serviço</span><input value={searchDraft.serviceId} onChange={event => setSearchDraft(current => ({ ...current, serviceId: event.target.value }))} /></label>
                            <label><span>Status</span><select value={searchDraft.serviceStatus} onChange={event => setSearchDraft(current => ({ ...current, serviceStatus: event.target.value as ServiceStatus | "" }))}><option value="">Todos</option>{statuses.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
                            <label><span>Entrada a partir de</span><input type="date" value={searchDraft.entryDateFrom} onChange={event => setSearchDraft(current => ({ ...current, entryDateFrom: event.target.value }))} /></label>
                            <label><span>Entrada até</span><input type="date" value={searchDraft.entryDateTo} onChange={event => setSearchDraft(current => ({ ...current, entryDateTo: event.target.value }))} /></label>
                            <label><span>Saída</span><select value={searchDraft.exitDateIsNull} onChange={event => setSearchDraft(current => ({ ...current, exitDateIsNull: event.target.value as "" | "true" | "false" }))}><option value="">Todas</option><option value="true">Ainda sem saída</option><option value="false">Já saiu</option></select></label>
                        </div>
                        <button className="service-management__button service-management__button--create" type="submit"><FontAwesomeIcon icon={faMagnifyingGlass} aria-hidden="true" /> Pesquisar</button>
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
                            {serviceSearchQuery.data && serviceSearchQuery.data.pagination.totalPages > 1 && <p className="service-management-search__pagination">Exibindo a primeira página de {serviceSearchQuery.data.pagination.total} resultados. Refine os filtros para localizar o serviço.</p>}
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
