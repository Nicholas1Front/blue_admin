import { useEffect, useState, type FormEvent } from "react";
import { Modal } from "../../../components/Modal/Modal";
import type { UpdateVehicleOdometerRequest } from "../../../modules/vehicles/vehicles.types";
import "./VehicleOdometerModal.css";

interface Props {
    isOpen: boolean;
    currentKilometer: number | null;
    isSaving: boolean;
    onClose: () => void;
    onSave: (data: UpdateVehicleOdometerRequest) => Promise<void>;
}

export function VehicleOdometerModal({ isOpen, currentKilometer, isSaving, onClose, onSave }: Props) {
    const [kilometer, setKilometer] = useState("");
    const [isReset, setIsReset] = useState(false);
    const [description, setDescription] = useState("");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) return;
        setKilometer(currentKilometer == null ? "" : String(currentKilometer));
        setIsReset(false);
        setDescription("");
        setError(null);
    }, [isOpen, currentKilometer]);

    async function submit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const next = Number(kilometer);
        if (!Number.isInteger(next) || next < 0) {
            setError("Informe uma leitura inteira e não negativa.");
            return;
        }
        if (isReset && currentKilometer == null) {
            setError("Não é possível registrar uma reinicialização sem uma leitura anterior conhecida.");
            return;
        }
        if (currentKilometer != null && next < currentKilometer && !isReset) {
            setError("A nova leitura é menor que a atual. Marque a opção de reinicialização para registrar essa mudança no histórico.");
            return;
        }
        if (isReset && (currentKilometer == null || next >= currentKilometer || !description.trim())) {
            setError("A reinicialização exige uma leitura menor que a atual e uma descrição do motivo.");
            return;
        }
        try {
            setError(null);
            await onSave({ kilometer: next, isReset, ...(isReset ? { description: description.trim() } : {}) });
        } catch (caught) {
            setError(caught instanceof Error ? caught.message : "Não foi possível atualizar o hodômetro.");
        }
    }

    return <Modal isOpen={isOpen} title="Atualizar hodômetro" onClose={onClose}>
        <form className="vehicle-odometer-form" onSubmit={submit}>
            <div className="vehicle-odometer-current"><span>Leitura atual</span><strong>{currentKilometer == null ? "Não informada" : new Intl.NumberFormat("pt-BR").format(currentKilometer) + " km"}</strong></div>
            <label><span>Nova leitura (km)</span><input type="number" min="0" step="1" value={kilometer} onChange={e => setKilometer(e.target.value)} required /></label>
            <label className="vehicle-odometer-reset"><input type="checkbox" checked={isReset} onChange={e => setIsReset(e.target.checked)} /><span><strong>Registrar reinicialização do hodômetro</strong><small>Use somente quando o hodômetro tiver sido reiniciado ou substituído. Um evento será criado automaticamente no histórico.</small></span></label>
            {isReset && <label><span>Motivo da reinicialização</span><textarea rows={3} maxLength={2000} value={description} onChange={e => setDescription(e.target.value)} placeholder="Explique por que a leitura foi reiniciada…" required /></label>}
            {error && <p className="vehicle-odometer-error" role="alert">{error}</p>}
            <footer><button type="button" onClick={onClose} disabled={isSaving}>Cancelar</button><button className="vehicle-odometer-submit" type="submit" disabled={isSaving}>{isSaving ? "Atualizando…" : "Atualizar leitura"}</button></footer>
        </form>
    </Modal>;
}
