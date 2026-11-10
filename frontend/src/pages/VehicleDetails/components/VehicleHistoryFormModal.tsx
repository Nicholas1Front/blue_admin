import { useEffect, useState, type FormEvent } from "react";
import { Modal } from "../../../components/Modal/Modal";
import type { CreateVehicleHistoryRequest, VehicleHistoryCreatableEventType, VehicleHistoryEvent } from "../../../modules/vehicles/vehicles.types";
import "./VehicleHistoryFormModal.css";

const options: Array<{ value: VehicleHistoryCreatableEventType; label: string }> = [
    { value: "maintenance", label: "Manutenção" },
    { value: "issue", label: "Problema identificado" },
    { value: "observation", label: "Observação" },
    { value: "problem_solved", label: "Problema resolvido" }
];

function dateInput(value?: string) {
    if (!value) return new Date().toLocaleDateString("en-CA");
    return value.slice(0, 10);
}

interface Props {
    isOpen: boolean;
    event?: VehicleHistoryEvent | null;
    currentKilometer: number | null;
    isSaving: boolean;
    onClose: () => void;
    onSave: (data: CreateVehicleHistoryRequest) => Promise<void>;
}

export function VehicleHistoryFormModal({ isOpen, event, currentKilometer, isSaving, onClose, onSave }: Props) {
    const [eventType, setEventType] = useState<VehicleHistoryCreatableEventType>("maintenance");
    const [description, setDescription] = useState("");
    const [kilometer, setKilometer] = useState("");
    const [eventDate, setEventDate] = useState(dateInput());
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) return;
        setEventType(event && event.eventType !== "odometer_reset" ? event.eventType : "maintenance");
        setDescription(event?.description ?? "");
        setKilometer(event?.kilometerSnapshot == null
            ? currentKilometer == null ? "" : String(currentKilometer)
            : String(event.kilometerSnapshot));
        setEventDate(dateInput(event?.eventDate));
        setError(null);
    }, [isOpen, event, currentKilometer]);

    async function submit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const kmValue = kilometer.trim() === "" ? null : Number(kilometer);
        if (!description.trim()) {
            setError("Descreva o evento registrado.");
            return;
        }
        if (kmValue !== null && (!Number.isInteger(kmValue) || kmValue < 0)) {
            setError("Informe uma quilometragem inteira e não negativa.");
            return;
        }
        try {
            setError(null);
            await onSave({
                eventType,
                description: description.trim(),
                kilometerSnapshot: kmValue,
                eventDate: new Date(eventDate + "T12:00:00").toISOString()
            });
        } catch (caught) {
            setError(caught instanceof Error ? caught.message : "Não foi possível salvar o evento.");
        }
    }

    return <Modal isOpen={isOpen} title={event ? "Editar evento do histórico" : "Registrar evento no histórico"} onClose={onClose} size="wide">
        <form className="vehicle-history-form" onSubmit={submit}>
            <p>Registre manutenções, problemas, observações ou a solução de uma ocorrência. Reinicializações do hodômetro são registradas pelo fluxo próprio de atualização.</p>
            <div className="vehicle-history-form__grid">
                <label><span>Tipo de evento</span><select value={eventType} onChange={e => setEventType(e.target.value as VehicleHistoryCreatableEventType)}>{options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
                <label><span>Data do evento</span><input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} required /></label>
                <label><span>Hodômetro no evento (km)</span><input type="number" min="0" step="1" value={kilometer} onChange={e => setKilometer(e.target.value)} placeholder="Não informado" /></label>
                <label className="vehicle-history-form__wide"><span>Descrição</span><textarea rows={4} maxLength={4000} value={description} onChange={e => setDescription(e.target.value)} placeholder="Descreva o que aconteceu, o serviço realizado ou a observação…" required /></label>
            </div>
            {error && <p className="vehicle-history-form__error" role="alert">{error}</p>}
            <footer><button type="button" onClick={onClose} disabled={isSaving}>Cancelar</button><button className="vehicle-history-form__submit" type="submit" disabled={isSaving}>{isSaving ? "Salvando…" : event ? "Salvar evento" : "Registrar evento"}</button></footer>
        </form>
    </Modal>;
}
