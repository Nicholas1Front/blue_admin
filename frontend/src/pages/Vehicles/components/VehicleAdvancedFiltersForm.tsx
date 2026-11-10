import type { FormEventHandler } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass, faRotateLeft } from "@fortawesome/free-solid-svg-icons";

import type { FindVehiclesByFilters } from "../../../modules/vehicles/vehicles.types";

import "./VehicleAdvancedFiltersForm.css";

type FilterDraft = Omit<FindVehiclesByFilters, "page" | "limit">;

interface Props {
    values: FilterDraft;
    onChange: (key: keyof FilterDraft, value: string | number | undefined) => void;
    onSubmit: FormEventHandler<HTMLFormElement>;
    onClear: () => void;
}

export function VehicleAdvancedFiltersForm({
    values,
    onChange,
    onSubmit,
    onClear
}: Props) {
    function textField(label: string, key: keyof FilterDraft, placeholder?: string) {
        return (
            <label className="vehicle-filter-field" key={key}>
                <span>{label}</span>
                <input
                    value={String(values[key] ?? "")}
                    onChange={event => onChange(key, event.target.value)}
                    placeholder={placeholder ?? label}
                />
            </label>
        );
    }

    function dateField(label: string, key: keyof FilterDraft) {
        return (
            <label className="vehicle-filter-field" key={key}>
                <span>{label}</span>
                <input
                    type="date"
                    value={String(values[key] ?? "")}
                    onChange={event => onChange(key, event.target.value)}
                />
            </label>
        );
    }

    function numberField(label: string, key: keyof FilterDraft) {
        return (
            <label className="vehicle-filter-field" key={key}>
                <span>{label}</span>
                <input
                    type="number"
                    min="0"
                    step="1"
                    value={String(values[key] ?? "")}
                    onChange={event => onChange(
                        key,
                        event.target.value === "" ? undefined : Number(event.target.value)
                    )}
                />
            </label>
        );
    }

    function selectField(
        label: string,
        key: keyof FilterDraft,
        options: Array<{ value: string; label: string }>
    ) {
        return (
            <label className="vehicle-filter-field" key={key}>
                <span>{label}</span>
                <select
                    value={String(values[key] ?? "")}
                    onChange={event => onChange(key, event.target.value || undefined)}
                >
                    <option value="">Todos</option>
                    {options.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                </select>
            </label>
        );
    }

    return (
        <form className="vehicle-filter-form" onSubmit={onSubmit}>
            <div className="vehicle-filter-form__primary">
                <label className="vehicle-filter-field vehicle-filter-field--search">
                    <span>Busca geral</span>
                    <input
                        type="search"
                        value={values.search ?? ""}
                        onChange={event => onChange("search", event.target.value)}
                        placeholder="Nome, placa, RENAVAM ou descrição do histórico…"
                    />
                </label>
                {textField("Placa", "plate")}
                {textField("RENAVAM", "renavam")}
            </div>

            <details className="vehicle-filter-advanced">
                <summary>
                    <span>Mais filtros</span>
                    <small>Identificação, documentação, hodômetro e histórico</small>
                </summary>

                <section className="vehicle-filter-group">
                    <h3>Identificação e documentação</h3>
                    <div className="vehicle-filter-grid">
                        {textField("ID do veículo", "vehicleId")}
                        {textField("Nome / identificação", "title")}
                        {textField("CRLV", "crlv")}
                        {textField("CRV", "crv")}
                        {textField("Observações", "observations")}
                    </div>
                </section>

                <section className="vehicle-filter-group">
                    <h3>Hodômetro atual</h3>
                    <div className="vehicle-filter-grid">
                        {numberField("Quilometragem mínima", "currentKilometerMin")}
                        {numberField("Quilometragem máxima", "currentKilometerMax")}
                    </div>
                </section>

                <section className="vehicle-filter-group">
                    <h3>Datas do cadastro</h3>
                    <div className="vehicle-filter-grid">
                        {dateField("Cadastro a partir de", "vehicleCreatedAtFrom")}
                        {dateField("Cadastro até", "vehicleCreatedAtTo")}
                        {dateField("Atualização a partir de", "vehicleUpdatedAtFrom")}
                        {dateField("Atualização até", "vehicleUpdatedAtTo")}
                    </div>
                </section>

                <section className="vehicle-filter-group">
                    <h3>Histórico do veículo</h3>
                    <div className="vehicle-filter-grid">
                        {textField("ID do evento", "historyId")}
                        {selectField("Tipo do evento", "historyEventType", [
                            { value: "maintenance", label: "Manutenção" },
                            { value: "issue", label: "Problema identificado" },
                            { value: "observation", label: "Observação" },
                            { value: "problem_solved", label: "Problema resolvido" },
                            { value: "odometer_reset", label: "Reinicialização do hodômetro" }
                        ])}
                        {textField("Descrição do evento", "historyDescription")}
                        {numberField("Quilometragem mínima do evento", "historyKilometerMin")}
                        {numberField("Quilometragem máxima do evento", "historyKilometerMax")}
                        {dateField("Evento a partir de", "historyDateFrom")}
                        {dateField("Evento até", "historyDateTo")}
                    </div>
                </section>
            </details>

            <footer className="vehicle-filter-actions">
                <button className="vehicle-filter-actions__submit" type="submit">
                    <FontAwesomeIcon icon={faMagnifyingGlass} aria-hidden="true" />
                    Pesquisar
                </button>
                <button type="button" onClick={onClear}>
                    <FontAwesomeIcon icon={faRotateLeft} aria-hidden="true" />
                    Limpar filtros
                </button>
            </footer>
        </form>
    );
}
