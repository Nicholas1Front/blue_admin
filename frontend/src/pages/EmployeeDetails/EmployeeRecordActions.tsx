import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faPen, faTrash, faWandMagicSparkles, faUserPlus } from "@fortawesome/free-solid-svg-icons";
import {
    useEmployees,
    useEngagementsByFilters,
    useObligationsByFilters,
    useMovementsByFilters,
    useEmployeeMutations,
    useObligationMutations,
    useMovementMutations
} from "../../modules/employees";
import type {
    EmployeeMovementType,
    EmployeeAmount, ObligationType, ObligationStatus, ObligationListItem,
    MovementListItem, CreateObligationRequest, CreateMovementRequest,
    CreatePaymentRequest
} from "../../modules/employees";
import "./EmployeeRecordActions.css";

type ActionMode = "employee" | "obligation" | "movement" | "edit-obligation" | "edit-movement" | "suggestions" | "delete";
type Props = { engagementId?: string; employeeId?: string; obligationId?: string; initialObligationId?: string; showEmployee?: boolean; showObligation?: boolean; showMovement?: boolean; showEdit?: boolean; showEditObligation?: boolean; showEditMovement?: boolean; showSuggestions?: boolean; showDelete?: boolean; compact?: boolean };

const obligationTypes: { value: ObligationType; label: string }[] = [
    { value: "salario", label: "Salário" }, { value: "ferias", label: "Férias" }, { value: "decimo_terceiro", label: "13º salário" },
    { value: "bonificacao", label: "Bonificação" }, { value: "rescisao", label: "Rescisão" }, { value: "ajuste", label: "Ajuste" }, { value: "outros", label: "Outros" }
];
const obligationStatuses: { value: ObligationStatus; label: string }[] = [
    { value: "em_revisao", label: "Em revisão" }, { value: "pendente", label: "Pendente" }, { value: "parcial", label: "Parcial" }, { value: "pago", label: "Pago" }, { value: "cancelado", label: "Cancelado" }
];
const movementTypes: { value: EmployeeMovementType; label: string }[] = [
    { value: "falta", label: "Falta" }, { value: "atraso", label: "Atraso" }, { value: "saida_antecipada", label: "Saída antecipada" },
    { value: "bonificacao", label: "Bonificação" }, { value: "decimo_terceiro", label: "13º salário" }, { value: "ferias", label: "Férias" },
    { value: "rescisao", label: "Rescisão" }, { value: "ajuste", label: "Ajuste" }, { value: "anotacao", label: "Anotação" }, { value: "pagamento", label: "Pagamento" }
];
const needsObligation = new Set<EmployeeMovementType>(["bonificacao", "decimo_terceiro", "ferias", "rescisao", "ajuste", "pagamento"]);
function dateValue(value?: string | null) { return value ? value.slice(0, 10) : ""; }
function isoDate(value: string) { return value ? `${value}T12:00:00` : null; }
function money(value: EmployeeAmount | null | undefined) { return value == null ? "" : String(value); }

export function EmployeeRecordActions(props: Props) {
    const navigate = useNavigate();
    const [mode, setMode] = useState<ActionMode | null>(null);
    const [engagementId, setEngagementId] = useState(props.engagementId ?? "");
    const [employeeId, setEmployeeId] = useState(props.employeeId ?? "");
    const [selectedObligationId, setSelectedObligationId] = useState("");
    const [selectedMovementId, setSelectedMovementId] = useState("");
    const [employeeName, setEmployeeName] = useState("");
    const [document, setDocument] = useState("");
    const [employeeBirthDate, setEmployeeBirthDate] = useState("");
    const [employeeAddress, setEmployeeAddress] = useState("");
    const [employeeObservations, setEmployeeObservations] = useState("");
    const [obligationType, setObligationType] = useState<ObligationType>("salario");
    const [obligationTitle, setObligationTitle] = useState("");
    const [obligationDescription, setObligationDescription] = useState("");
    const [referenceStart, setReferenceStart] = useState("");
    const [referenceEnd, setReferenceEnd] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [originalValue, setOriginalValue] = useState("");
    const [finalValue, setFinalValue] = useState("");
    const [obligationStatus, setObligationStatus] = useState<ObligationStatus>("pendente");
    const [obligationObservations, setObligationObservations] = useState("");
    const [movementType, setMovementType] = useState<EmployeeMovementType>("anotacao");
    const [movementDescription, setMovementDescription] = useState("");
    const [eventDate, setEventDate] = useState(new Date().toISOString().slice(0, 10));
    const [movementReferenceStart, setMovementReferenceStart] = useState("");
    const [movementReferenceEnd, setMovementReferenceEnd] = useState("");
    const [movementValue, setMovementValue] = useState("");
    const [movementObligationId, setMovementObligationId] = useState("");
    const [movementObservations, setMovementObservations] = useState("");
    const [error, setError] = useState("");

    const employeesQuery = useEmployees({ limit: 100 }, Boolean(mode === "employee" || (mode && mode !== "employee" && !props.employeeId && !props.engagementId)));
    const engagementsQuery = useEngagementsByFilters({ employeeId: employeeId || undefined, limit: 100 }, Boolean(mode && mode !== "employee" && !props.engagementId));
    const obligationsQuery = useObligationsByFilters({ engagementId: engagementId || undefined, limit: 100 }, Boolean(mode && engagementId));
    const movementsQuery = useMovementsByFilters({ engagementId: engagementId || undefined, obligationId: props.obligationId, limit: 100, order: "desc" }, Boolean(mode && engagementId));
    const employees = employeesQuery.data?.data ?? [];
    const engagements = engagementsQuery.data?.data ?? [];
    const obligations = obligationsQuery.data?.data ?? [];
    const movements = movementsQuery.data?.data ?? [];
    const selectedObligation = obligations.find(item => item.id === selectedObligationId);
    const selectedMovement = movements.find(item => item.id === selectedMovementId);

    const open = (next: ActionMode) => {
        setError(""); setMode(next);
        setEngagementId(props.engagementId ?? "");
        setEmployeeId(props.employeeId ?? "");
        setEmployeeBirthDate(""); setEmployeeAddress(""); setEmployeeObservations("");
        setSelectedObligationId(""); setSelectedMovementId("");
        setObligationType("salario"); setObligationTitle(""); setObligationDescription(""); setReferenceStart(""); setReferenceEnd(""); setDueDate("");
        setOriginalValue(""); setFinalValue(""); setObligationStatus("pendente"); setObligationObservations("");
        setMovementType("anotacao"); setMovementDescription(""); setEventDate(new Date().toISOString().slice(0, 10));
        setMovementReferenceStart(""); setMovementReferenceEnd(""); setMovementValue(""); setMovementObligationId(""); setMovementObservations("");
    };

    const fillObligation = (item?: ObligationListItem) => {
        if (!item) return;
        setObligationType(item.type); setObligationTitle(item.title); setObligationDescription(item.description ?? "");
        setReferenceStart(dateValue(item.referenceStart)); setReferenceEnd(dateValue(item.referenceEnd)); setDueDate(dateValue(item.dueDate));
        setOriginalValue(money(item.originalValue)); setFinalValue(money(item.finalValue)); setObligationStatus(item.status); setObligationObservations(item.observations ?? "");
    };
    const fillMovement = (item?: MovementListItem) => {
        if (!item) return;
        setMovementType(item.type); setMovementDescription(item.description); setEventDate(dateValue(item.eventDate));
        setMovementReferenceStart(dateValue(item.referenceStart)); setMovementReferenceEnd(dateValue(item.referenceEnd));
        setMovementValue(money(item.value)); setMovementObligationId(item.obligationId ?? ""); setMovementObservations(item.observations ?? "");
    };

    useEffect(() => {
        if (mode !== "edit-obligation" || !props.initialObligationId || selectedObligationId === props.initialObligationId) return;
        const initial = obligations.find(item => item.id === props.initialObligationId);
        if (initial) {
            setSelectedObligationId(initial.id);
            fillObligation(initial);
        }
    }, [mode, props.initialObligationId, selectedObligationId, obligations]);

    const { create: createEmployee } = useEmployeeMutations();
    const obligationMutations = useObligationMutations();
    const movementMutations = useMovementMutations();

    async function submitEmployee(event: FormEvent<HTMLFormElement>) {
        event.preventDefault(); setError("");
        try { const result = await createEmployee.mutateAsync({ name: employeeName.trim(), document: document.trim() || null, birthDate: isoDate(employeeBirthDate), address: employeeAddress.trim() || null, observations: employeeObservations.trim() || null }); close(); navigate(`/employees/${encodeURIComponent(result.employee.id)}`); }
        catch { setError("Não foi possível cadastrar o funcionário. Confira os dados e tente novamente."); }
    }
    async function submitObligation(event: FormEvent<HTMLFormElement>) {
        event.preventDefault(); setError("");
        if (!engagementId) { setError("Selecione o vínculo para continuar."); return; }
        if (mode === "edit-obligation" && selectedObligation) {
            const paidValue = Number(selectedObligation.paidValue ?? 0);
            const nextValue = Number(finalValue);
            if (obligationStatus === "pago" && Math.abs(paidValue - nextValue) > 0.01 && !window.confirm("Os movimentos vinculados não correspondem ao valor final. Deseja marcar a obrigação como paga mesmo assim?")) return;
            if (paidValue > nextValue && !window.confirm("Os movimentos vinculados ultrapassam o valor final da obrigação. Deseja continuar?")) return;
        }
        const data: CreateObligationRequest = { type: obligationType, title: obligationTitle.trim(), description: obligationDescription.trim() || null,
            referenceStart: isoDate(referenceStart), referenceEnd: isoDate(referenceEnd), dueDate: isoDate(dueDate),
            originalValue: Number(originalValue), finalValue: Number(finalValue), status: obligationStatus, observations: obligationObservations.trim() || null };
        try {
            if (mode === "edit-obligation" && selectedObligation) await obligationMutations.update.mutateAsync({ engagementId, obligationId: selectedObligation.id, data });
            else await obligationMutations.create.mutateAsync({ engagementId, data });
            close();
        } catch { setError("Não foi possível salvar a obrigação. Confira os valores e tente novamente."); }
    }
    async function submitMovement(event: FormEvent<HTMLFormElement>) {
        event.preventDefault(); setError("");
        if (!engagementId) { setError("Selecione o vínculo para continuar."); return; }
        if (needsObligation.has(movementType) && !movementObligationId) { setError("Este tipo de lançamento precisa estar ligado a uma obrigação."); return; }
        if (movementType === "pagamento" && (!movementValue.trim() || !Number.isFinite(Number(movementValue)))) { setError("Informe o valor do pagamento."); return; }
        try {
            const data = { description: movementDescription.trim(), eventDate: isoDate(eventDate), referenceStart: isoDate(movementReferenceStart), referenceEnd: isoDate(movementReferenceEnd), value: movementValue === "" ? null : Number(movementValue), obligationId: movementObligationId || null, observations: movementObservations.trim() || null };
            if (movementType === "pagamento") {
                const payment = { obligationId: movementObligationId, description: data.description, value: Number(movementValue), eventDate: data.eventDate, observations: data.observations } as CreatePaymentRequest;
                if (mode === "edit-movement" && selectedMovement) await movementMutations.updatePayment.mutateAsync({ engagementId, movementId: selectedMovement.id, data: payment });
                else await movementMutations.createPayment.mutateAsync({ engagementId, data: payment });
                if (window.confirm("Pagamento salvo. Deseja revisar agora o status e os valores da obrigação relacionada?")) {
                    const linkedObligation = obligations.find(item => item.id === movementObligationId);
                    setSelectedObligationId(movementObligationId);
                    fillObligation(linkedObligation);
                    setMode("edit-obligation");
                    setError("");
                    return;
                }
            } else {
                const movement = { ...data, type: movementType } as CreateMovementRequest;
                if (mode === "edit-movement" && selectedMovement) await movementMutations.update.mutateAsync({ engagementId, movementId: selectedMovement.id, data: movement });
                else await movementMutations.create.mutateAsync({ engagementId, data: movement });
            }
            close();
        } catch { setError("Não foi possível salvar o lançamento. Confira os dados e tente novamente."); }
    }
    function close() { setMode(null); setError(""); }

    const title = mode === "employee" ? "Adicionar funcionário" : mode === "obligation" ? "Adicionar obrigação" : mode === "edit-obligation" ? "Editar obrigação" : mode === "movement" ? "Adicionar lançamento" : mode === "edit-movement" ? "Editar lançamento" : mode === "suggestions" ? "Analisar competências" : "Excluir registro";
    const needsContext = Boolean(mode && mode !== "employee" && mode !== "suggestions" && mode !== "delete" && !props.engagementId);
    const showObligationForm = mode === "obligation" || mode === "edit-obligation";
    const showMovementForm = mode === "movement" || mode === "edit-movement";

    return (
        <div className={`employee-record-actions ${props.compact ? "employee-record-actions--compact" : ""}`}>
            {props.showEmployee && <button type="button" className="employee-record-action employee-record-action--primary" onClick={() => open("employee")}><FontAwesomeIcon icon={faUserPlus} /> Adicionar funcionário</button>}
            {props.showObligation && <button type="button" className="employee-record-action" onClick={() => open("obligation")}><FontAwesomeIcon icon={faPlus} /> Adicionar obrigação</button>}
            {props.showMovement && <button type="button" className="employee-record-action" onClick={() => open("movement")}><FontAwesomeIcon icon={faPlus} /> Adicionar lançamento</button>}
            {(props.showEdit || props.showEditObligation) && <button type="button" className="employee-record-action" onClick={() => open("edit-obligation")}><FontAwesomeIcon icon={faPen} /> Editar obrigação</button>}{(props.showEdit || props.showEditMovement) && <button type="button" className="employee-record-action" onClick={() => open("edit-movement")}><FontAwesomeIcon icon={faPen} /> Editar lançamento</button>}
            {props.showSuggestions && <button type="button" className="employee-record-action" onClick={() => open("suggestions")}><FontAwesomeIcon icon={faWandMagicSparkles} /> Sugestões</button>}
            {props.showDelete && <button type="button" className="employee-record-action employee-record-action--danger" disabled><FontAwesomeIcon icon={faTrash} /> Excluir</button>}
            {mode && <div className="employee-record-modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) close(); }}>
                <section className="employee-record-modal" role="dialog" aria-modal="true" aria-label={title}>
                    <header><div><span className="employee-record-modal__eyebrow">Gestão de funcionários</span><h2>{title}</h2><p>Os dados são salvos somente após confirmar o formulário.</p></div><button type="button" onClick={close} aria-label="Fechar">×</button></header>
                    {mode === "employee" ? <form onSubmit={event => void submitEmployee(event)} className="employee-record-form">
                        <label>Nome completo<input required value={employeeName} onChange={event => setEmployeeName(event.target.value)} /></label>
                        <label>CPF / CNPJ<input value={document} onChange={event => setDocument(event.target.value)} /></label>
                        <label>Data de nascimento<input type="date" value={employeeBirthDate} onChange={event => setEmployeeBirthDate(event.target.value)} /></label>
                        <label>Endereço<input value={employeeAddress} onChange={event => setEmployeeAddress(event.target.value)} /></label>
                        <label className="employee-record-form__full">Observações<textarea rows={2} value={employeeObservations} onChange={event => setEmployeeObservations(event.target.value)} /></label>
                        {error && <p className="employee-record-form__error" role="alert">{error}</p>}
                        <div className="employee-record-form__actions"><button type="button" onClick={close}>Cancelar</button><button type="submit" disabled={createEmployee.isPending}>{createEmployee.isPending ? "Salvando…" : "Cadastrar funcionário"}</button></div>
                    </form> : mode === "suggestions" ? <div className="employee-record-placeholder"><FontAwesomeIcon icon={faWandMagicSparkles} /><p>A análise de competências será conectada em uma etapa posterior. Nenhuma obrigação será criada automaticamente.</p><button type="button" onClick={close}>Entendi</button></div> : mode === "delete" ? <div className="employee-record-placeholder"><FontAwesomeIcon icon={faTrash} /><p>As ações de exclusão estão planejadas, mas ainda não estão habilitadas nesta interface.</p><button type="button" onClick={close}>Fechar</button></div> : <>
                        {needsContext && <div className="employee-record-context">
                            {!props.employeeId && <label>Funcionário<select value={employeeId} onChange={event => { setEmployeeId(event.target.value); setEngagementId(""); }} required><option value="">Selecione</option>{employees.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}
                            <label>Vínculo<select value={engagementId} onChange={event => { setEngagementId(event.target.value); setSelectedObligationId(""); setSelectedMovementId(""); }} required><option value="">Selecione</option>{engagements.map(item => <option key={item.id} value={item.id}>{item.employee.name} · {item.modality} · {item.status}</option>)}</select></label>
                        </div>}
                        {mode === "edit-obligation" && <label className="employee-record-select">Obrigação<select value={selectedObligationId} onChange={event => { setSelectedObligationId(event.target.value); fillObligation(obligations.find(item => item.id === event.target.value)); }}><option value="">Selecione a obrigação</option>{obligations.map(item => <option key={item.id} value={item.id}>{item.title} · {item.dueDate ? dateValue(item.dueDate) : "sem vencimento"}</option>)}</select></label>}
                        {mode === "edit-movement" && <label className="employee-record-select">Lançamento<select value={selectedMovementId} onChange={event => { setSelectedMovementId(event.target.value); fillMovement(movements.find(item => item.id === event.target.value)); }}><option value="">Selecione o lançamento</option>{movements.map(item => <option key={item.id} value={item.id}>{item.type} · {item.description}</option>)}</select></label>}
                        {showObligationForm && <form className="employee-record-form" onSubmit={event => void submitObligation(event)}>
                            <div className="employee-record-form__grid">
                                <label>Tipo<select value={obligationType} onChange={event => setObligationType(event.target.value as ObligationType)}>{obligationTypes.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
                                <label>Status<select value={obligationStatus} onChange={event => setObligationStatus(event.target.value as ObligationStatus)}>{obligationStatuses.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
                                <label className="employee-record-form__full">Título<input required value={obligationTitle} onChange={event => setObligationTitle(event.target.value)} /></label>
                                <label>Referência inicial<input type="date" value={referenceStart} onChange={event => setReferenceStart(event.target.value)} /></label>
                                <label>Referência final<input type="date" value={referenceEnd} onChange={event => setReferenceEnd(event.target.value)} /></label>
                                <label>Vencimento<input type="date" value={dueDate} onChange={event => setDueDate(event.target.value)} /></label>
                                <label>Valor original<input required type="number" min="0" step="0.01" value={originalValue} onChange={event => setOriginalValue(event.target.value)} /></label>
                                <label>Valor final<input required type="number" min="0" step="0.01" value={finalValue} onChange={event => setFinalValue(event.target.value)} /></label>
                                <label className="employee-record-form__full">Descrição<textarea rows={2} value={obligationDescription} onChange={event => setObligationDescription(event.target.value)} /></label>
                                <label className="employee-record-form__full">Observações<textarea rows={2} value={obligationObservations} onChange={event => setObligationObservations(event.target.value)} /></label>
                            </div>
                            {error && <p className="employee-record-form__error" role="alert">{error}</p>}
                            <div className="employee-record-form__actions"><button type="button" onClick={close}>Cancelar</button><button type="submit" disabled={obligationMutations.create.isPending || obligationMutations.update.isPending}>{obligationMutations.create.isPending || obligationMutations.update.isPending ? "Salvando…" : "Salvar obrigação"}</button></div>
                        </form>}
                        {showMovementForm && <form className="employee-record-form" onSubmit={event => void submitMovement(event)}>
                            <div className="employee-record-form__grid">
                                <label>Tipo<select value={movementType} onChange={event => setMovementType(event.target.value as EmployeeMovementType)}>{movementTypes.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
                                <label>Data<input type="date" value={eventDate} onChange={event => setEventDate(event.target.value)} /></label>
                                <label className="employee-record-form__full">Descrição<input required value={movementDescription} onChange={event => setMovementDescription(event.target.value)} /></label>
                                <label>Referência inicial<input type="date" value={movementReferenceStart} onChange={event => setMovementReferenceStart(event.target.value)} /></label>
                                <label>Referência final<input type="date" value={movementReferenceEnd} onChange={event => setMovementReferenceEnd(event.target.value)} /></label>
                                <label>Valor<input type="number" min="0" step="0.01" value={movementValue} onChange={event => setMovementValue(event.target.value)} /></label>
                                <label className="employee-record-form__full">Obrigação {needsObligation.has(movementType) ? "(obrigatória para este tipo)" : "(opcional)"}<select value={movementObligationId} onChange={event => setMovementObligationId(event.target.value)}><option value="">Sem obrigação vinculada</option>{obligations.map(item => <option key={item.id} value={item.id}>{item.title} · {item.status}</option>)}</select></label>
                                <label className="employee-record-form__full">Observações<textarea rows={2} value={movementObservations} onChange={event => setMovementObservations(event.target.value)} /></label>
                            </div>
                            {error && <p className="employee-record-form__error" role="alert">{error}</p>}
                            <div className="employee-record-form__actions"><button type="button" onClick={close}>Cancelar</button><button type="submit" disabled={movementMutations.create.isPending || movementMutations.update.isPending || movementMutations.createPayment.isPending || movementMutations.updatePayment.isPending}>{movementMutations.create.isPending || movementMutations.update.isPending || movementMutations.createPayment.isPending || movementMutations.updatePayment.isPending ? "Salvando…" : "Salvar lançamento"}</button></div>
                        </form>}
                    </>}
                </section>
            </div>}
        </div>
    );
}
