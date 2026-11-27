import { useState, type FormEvent } from "react";
import { useEmployeeMutations, useEngagementMutations } from "../../modules/employees";
import type { EmployeeRecord, EmployeeEngagement, EngagementModality, EngagementStatus } from "../../modules/employees";
import "./EmployeeDetailsEdit.css";

function dateInput(value?: string | null) {
    return value ? value.slice(0, 10) : "";
}

function todayInput() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function EmployeeProfileEditForm({ employee, onCancel }: { employee: EmployeeRecord; onCancel: () => void }) {
    const { update } = useEmployeeMutations();
    const [name, setName] = useState(employee.name);
    const [document, setDocument] = useState(employee.document ?? "");
    const [birthDate, setBirthDate] = useState(dateInput(employee.birthDate));
    const [address, setAddress] = useState(employee.address ?? "");
    const [observations, setObservations] = useState(employee.observations ?? "");

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        try {
            await update.mutateAsync({
                id: employee.id,
                data: {
                    name: name.trim(),
                    document: document.trim() || null,
                    birthDate: birthDate || null,
                    address: address.trim() || null,
                    observations: observations.trim() || null
                }
            });
            onCancel();
        } catch {
            // The mutation state displays the error beside the form.
        }
    }

    return (
        <form className="employee-detail-edit-form" onSubmit={event => void handleSubmit(event)}>
            <div className="employee-detail-edit-grid">
                <label>Nome completo<input required value={name} onChange={event => setName(event.target.value)} /></label>
                <label>CPF / CNPJ<input value={document} onChange={event => setDocument(event.target.value)} /></label>
                <label>Data de nascimento<input type="date" value={birthDate} onChange={event => setBirthDate(event.target.value)} /></label>
                <label className="employee-detail-edit-grid__full">Endereço<input value={address} onChange={event => setAddress(event.target.value)} /></label>
                <label className="employee-detail-edit-grid__full">Observações<textarea rows={3} value={observations} onChange={event => setObservations(event.target.value)} /></label>
            </div>
            {update.isError && <p className="employee-detail-edit-error">Não foi possível salvar os dados cadastrais. Confira as informações e tente novamente.</p>}
            <div className="employee-detail-edit-actions">
                <button type="button" className="employee-detail-edit-button employee-detail-edit-button--secondary" onClick={onCancel} disabled={update.isPending}>Cancelar</button>
                <button type="submit" className="employee-detail-edit-button" disabled={update.isPending}>{update.isPending ? "Salvando…" : "Salvar cadastro"}</button>
            </div>
        </form>
    );
}

const modalityOptions: { value: EngagementModality; label: string }[] = [
    { value: "CLT", label: "CLT" },
    { value: "PJ", label: "PJ" },
    { value: "Informal", label: "Informal" },
    { value: "outros", label: "Outros" }
];
const statusOptions: { value: EngagementStatus; label: string }[] = [
    { value: "trabalhando", label: "Trabalhando" },
    { value: "afastado", label: "Afastado" },
    { value: "demitiu-se", label: "Pediu desligamento" },
    { value: "demitido", label: "Desligado" }
];

export function EmployeeEngagementEditModal({ engagement, onClose }: { engagement: EmployeeEngagement; onClose: () => void }) {
    const { update } = useEngagementMutations();
    const [entryDate, setEntryDate] = useState(dateInput(engagement.entryDate));
    const [exitDate, setExitDate] = useState(dateInput(engagement.exitDate));
    const [status, setStatus] = useState<EngagementStatus>(engagement.status);
    const [modality, setModality] = useState<EngagementModality>(engagement.modality);
    const [salary, setSalary] = useState(engagement.currentSalary == null ? "" : String(engagement.currentSalary));
    const [effectiveDate, setEffectiveDate] = useState(todayInput());
    const [observations, setObservations] = useState(engagement.observations ?? "");

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const currentSalary = engagement.currentSalary == null ? null : Number(engagement.currentSalary);
        const nextSalary = salary.trim() === "" ? null : Number(salary);
        const salaryChanged = currentSalary !== nextSalary;
        try {
            await update.mutateAsync({
                employeeId: engagement.employeeId,
                engagementId: engagement.id,
                data: {
                    entryDate: entryDate || null,
                    exitDate: exitDate || null,
                    status,
                    modality,
                    observations: observations.trim() || null,
                    ...(salaryChanged ? {
                        currentSalary: nextSalary,
                        effectiveDate: effectiveDate || todayInput()
                    } : {})
                }
            });
            onClose();
        } catch {
            // The mutation state displays the error beside the form.
        }
    }

    return (
        <div className="employee-detail-edit-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
            <section className="employee-detail-edit-modal" role="dialog" aria-modal="true" aria-label="Editar vínculo">
                <header className="employee-detail-edit-modal__header">
                    <div><span className="employee-detail-eyebrow">Informações profissionais</span><h2>Editar vínculo</h2><p>As alterações serão registradas no histórico do funcionário.</p></div>
                    <button type="button" onClick={onClose} aria-label="Fechar edição do vínculo" disabled={update.isPending}>×</button>
                </header>
                <form className="employee-detail-edit-form" onSubmit={event => void handleSubmit(event)}>
                    <div className="employee-detail-edit-grid">
                        <label>Modalidade<select value={modality} onChange={event => setModality(event.target.value as EngagementModality)}>{modalityOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
                        <label>Status<select value={status} onChange={event => setStatus(event.target.value as EngagementStatus)}>{statusOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
                        <label>Data de admissão<input type="date" value={entryDate} onChange={event => setEntryDate(event.target.value)} /></label>
                        <label>Data de desligamento<input type="date" value={exitDate} onChange={event => setExitDate(event.target.value)} /></label>
                        <label>Salário / remuneração mensal<input type="number" min="0" step="0.01" value={salary} onChange={event => setSalary(event.target.value)} /></label>
                        {String(engagement.currentSalary ?? "") !== salary && <label>Data efetiva da alteração salarial<input type="date" value={effectiveDate} onChange={event => setEffectiveDate(event.target.value)} /></label>}
                        <label className="employee-detail-edit-grid__full">Observações<textarea rows={3} value={observations} onChange={event => setObservations(event.target.value)} /></label>
                    </div>
                    {update.isError && <p className="employee-detail-edit-error">Não foi possível atualizar o vínculo. Verifique as datas e os valores e tente novamente.</p>}
                    <div className="employee-detail-edit-actions">
                        <button type="button" className="employee-detail-edit-button employee-detail-edit-button--secondary" onClick={onClose} disabled={update.isPending}>Cancelar</button>
                        <button type="submit" className="employee-detail-edit-button" disabled={update.isPending}>{update.isPending ? "Salvando…" : "Salvar vínculo"}</button>
                    </div>
                </form>
            </section>
        </div>
    );
}
