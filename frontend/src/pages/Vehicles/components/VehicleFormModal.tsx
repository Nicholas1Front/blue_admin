import { useEffect, useState, type FormEvent } from "react";

import { Modal } from "../../../components/Modal/Modal";
import type {
    CreateVehicleRequest,
    VehicleRecord
} from "../../../modules/vehicles/vehicles.types";

import "./VehicleFormModal.css";

interface Props {
    isOpen: boolean;
    vehicle?: VehicleRecord | null;
    isSaving: boolean;
    onClose: () => void;
    onSave: (data: CreateVehicleRequest) => Promise<void>;
}

export function VehicleFormModal({
    isOpen,
    vehicle,
    isSaving,
    onClose,
    onSave
}: Props) {
    const [title, setTitle] = useState("");
    const [plate, setPlate] = useState("");
    const [renavam, setRenavam] = useState("");
    const [crlv, setCrlv] = useState("");
    const [crv, setCrv] = useState("");
    const [currentKilometer, setCurrentKilometer] = useState("");
    const [observations, setObservations] = useState("");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) return;
        setTitle(vehicle?.title ?? "");
        setPlate(vehicle?.plate ?? "");
        setRenavam(vehicle?.renavam ?? "");
        setCrlv(vehicle?.crlv ?? "");
        setCrv(vehicle?.crv ?? "");
        setCurrentKilometer(
            vehicle?.currentKilometer == null ? "" : String(vehicle.currentKilometer)
        );
        setObservations(vehicle?.observations ?? "");
        setError(null);
    }, [isOpen, vehicle]);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const normalizedTitle = title.trim();

        if (!normalizedTitle) {
            setError("Informe a identificação do veículo.");
            return;
        }

        const kilometer = currentKilometer.trim() === ""
            ? null
            : Number(currentKilometer);

        if (
            !vehicle
            && kilometer !== null
            && (!Number.isInteger(kilometer) || kilometer < 0)
        ) {
            setError("Informe um hodômetro válido, em quilômetros inteiros.");
            return;
        }

        setError(null);
        try {
            await onSave({
                title: normalizedTitle,
                plate: plate.trim() || null,
                renavam: renavam.trim() || null,
                crlv: crlv.trim() || null,
                crv: crv.trim() || null,
                ...(vehicle ? {} : { currentKilometer: kilometer }),
                observations: observations.trim() || null
            });
        } catch (caught) {
            setError(caught instanceof Error
                ? caught.message
                : "Não foi possível salvar o veículo.");
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            title={vehicle ? "Editar veículo" : "Cadastrar veículo"}
            onClose={onClose}
            size="wide"
        >
            <form className="vehicle-form" onSubmit={handleSubmit}>
                <p className="vehicle-form__intro">
                    {vehicle
                        ? "Atualize os dados de identificação e documentação. O hodômetro é atualizado separadamente para manter o histórico correto."
                        : "Cadastre a identificação do veículo e, se desejar, informe a leitura atual do hodômetro."}
                </p>

                <div className="vehicle-form__grid">
                    <label className="vehicle-form__field vehicle-form__field--wide">
                        <span>Nome / identificação do veículo <i>*</i></span>
                        <input
                            value={title}
                            onChange={event => setTitle(event.target.value)}
                            maxLength={180}
                            placeholder="Ex.: Caminhão Mercedes-Benz Actros 2651"
                            required
                            autoFocus
                        />
                    </label>

                    <label className="vehicle-form__field">
                        <span>Placa</span>
                        <input
                            value={plate}
                            onChange={event => setPlate(event.target.value.toUpperCase())}
                            maxLength={12}
                            placeholder="ABC1D23"
                        />
                    </label>

                    <label className="vehicle-form__field">
                        <span>RENAVAM</span>
                        <input
                            value={renavam}
                            onChange={event => setRenavam(event.target.value)}
                            maxLength={30}
                            placeholder="Número do RENAVAM"
                        />
                    </label>

                    <label className="vehicle-form__field">
                        <span>CRLV</span>
                        <input
                            value={crlv}
                            onChange={event => setCrlv(event.target.value)}
                            maxLength={120}
                            placeholder="Identificação do CRLV"
                        />
                    </label>

                    <label className="vehicle-form__field">
                        <span>CRV</span>
                        <input
                            value={crv}
                            onChange={event => setCrv(event.target.value)}
                            maxLength={120}
                            placeholder="Identificação do CRV"
                        />
                    </label>

                    {!vehicle && (
                        <label className="vehicle-form__field">
                            <span>Hodômetro atual (km)</span>
                            <input
                                type="number"
                                min="0"
                                step="1"
                                value={currentKilometer}
                                onChange={event => setCurrentKilometer(event.target.value)}
                                placeholder="Não informado"
                            />
                        </label>
                    )}

                    <label className="vehicle-form__field vehicle-form__field--wide">
                        <span>Observações</span>
                        <textarea
                            value={observations}
                            onChange={event => setObservations(event.target.value)}
                            rows={3}
                            maxLength={3000}
                            placeholder="Informações adicionais sobre o veículo…"
                        />
                    </label>
                </div>

                {error && <p className="vehicle-form__error" role="alert">{error}</p>}

                <footer className="vehicle-form__actions">
                    <button type="button" onClick={onClose} disabled={isSaving}>Cancelar</button>
                    <button className="vehicle-form__submit" type="submit" disabled={isSaving}>
                        {isSaving ? "Salvando…" : vehicle ? "Salvar alterações" : "Cadastrar veículo"}
                    </button>
                </footer>
            </form>
        </Modal>
    );
}
