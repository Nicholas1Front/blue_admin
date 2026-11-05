import type { FormEventHandler } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass, faRotateLeft } from "@fortawesome/free-solid-svg-icons";

import type { FindServicesByAdvancedFilters } from "../../../modules/services";
import "../Services.css";

type ServiceSearchForm = Omit<FindServicesByAdvancedFilters, "page" | "limit">;
type FilterValue = string | number | boolean | undefined;

const serviceStatuses = [
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

const activityStatuses = [
    { value: "pendente", label: "Pendente" },
    { value: "em_execução", label: "Em execução" },
    { value: "concluida", label: "Concluída" },
    { value: "cancelada", label: "Cancelada" }
];

const titheStatuses = [
    { value: "aguardando", label: "Aguardando" },
    { value: "não concluído", label: "Não concluído" },
    { value: "concluído", label: "Concluído" }
];

interface Props {
    values: ServiceSearchForm;
    onChange: (key: keyof ServiceSearchForm, value: FilterValue) => void;
    onSubmit: FormEventHandler<HTMLFormElement>;
    onClear: () => void;
}

export function ServiceAdvancedFiltersForm({ values, onChange, onSubmit, onClear }: Props) {
    function renderTextField(label: string, key: keyof ServiceSearchForm, placeholder?: string) {
        return (
            <label className="services-filter-field" key={key}>
                <span>{label}</span>
                <input
                    type="text"
                    value={String(values[key] ?? "")}
                    placeholder={placeholder ?? label}
                    onChange={event => onChange(key, event.target.value)}
                />
            </label>
        );
    }

    function renderDateField(label: string, key: keyof ServiceSearchForm) {
        return (
            <label className="services-filter-field" key={key}>
                <span>{label}</span>
                <input
                    type="date"
                    value={String(values[key] ?? "")}
                    onChange={event => onChange(key, event.target.value)}
                />
            </label>
        );
    }

    function renderNumberField(label: string, key: keyof ServiceSearchForm) {
        return (
            <label className="services-filter-field" key={key}>
                <span>{label}</span>
                <input
                    type="number"
                    min="0"
                    step="any"
                    value={String(values[key] ?? "")}
                    onChange={event => onChange(
                        key,
                        event.target.value === "" ? undefined : Number(event.target.value)
                    )}
                />
            </label>
        );
    }

    function renderSelectField(
        label: string,
        key: keyof ServiceSearchForm,
        options: Array<{ value: string; label: string }>
    ) {
        return (
            <label className="services-filter-field" key={key}>
                <span>{label}</span>
                <select
                    value={String(values[key] ?? "")}
                    onChange={event => onChange(
                        key,
                        event.target.value === ""
                            ? undefined
                            : key === "exitDateIsNull"
                                ? event.target.value === "true"
                                : event.target.value
                    )}
                >
                    <option value="">Todos</option>
                    {options.map(option => (
                        <option value={option.value} key={option.value}>{option.label}</option>
                    ))}
                </select>
            </label>
        );
    }

    return (
        <form className="services-search-form" onSubmit={onSubmit}>
            <div className="services-search-primary">
                <label className="services-filter-field services-filter-field--search">
                    <span>Busca geral</span>
                    <input
                        type="search"
                        value={values.search ?? ""}
                        placeholder="Cliente, documento, equipamento, atividade ou código…"
                        onChange={event => onChange("search", event.target.value)}
                    />
                </label>
                {renderSelectField("Status do serviço", "serviceStatus", serviceStatuses)}
                {renderDateField("Entrada a partir de", "entryDateFrom")}
                {renderDateField("Entrada até", "entryDateTo")}
            </div>

            <details className="services-search-advanced">
                <summary>
                    <span>Mais filtros</span>
                    <span className="services-search-advanced__hint">Cliente, equipamento, atividades, financeiro e histórico</span>
                </summary>

                <div className="services-filter-group">
                    <h3>Cliente e equipamento</h3>
                    <div className="services-filter-grid">
                        {renderTextField("Nome do cliente", "clientName")}
                        {renderTextField("Documento do cliente", "clientDocument")}
                        {renderTextField("ID do cliente", "clientId")}
                        {renderTextField("ID do equipamento", "equipamentId")}
                        {renderTextField("Buscar equipamento", "equipamentSearch", "Tipo, marca, modelo ou identificação")}
                        {renderTextField("ID do serviço", "serviceId")}
                    </div>
                </div>

                <div className="services-filter-group">
                    <h3>Datas, horas e dízimo</h3>
                    <div className="services-filter-grid">
                        {renderDateField("Saída a partir de", "exitDateFrom")}
                        {renderDateField("Saída até", "exitDateTo")}
                        {renderSelectField("Situação da saída", "exitDateIsNull", [
                            { value: "true", label: "Ainda sem saída" },
                            { value: "false", label: "Já saiu" }
                        ])}
                        {renderNumberField("Horas mínimas", "hoursWorkedMin")}
                        {renderNumberField("Horas máximas", "hoursWorkedMax")}
                        {renderSelectField("Status do dízimo", "titheStatus", titheStatuses)}
                        {renderTextField("ID da transação do dízimo", "titheTransactionId")}
                    </div>
                </div>

                <div className="services-filter-group">
                    <h3>Atividades</h3>
                    <div className="services-filter-grid">
                        {renderTextField("ID da atividade", "activityId")}
                        {renderTextField("Título da atividade", "activityTitle")}
                        {renderTextField("Descrição da atividade", "activityDescription")}
                        {renderSelectField("Status da atividade", "activityStatus", activityStatuses)}
                        {renderDateField("Atividade iniciada a partir de", "activityStartFrom")}
                        {renderDateField("Atividade iniciada até", "activityStartTo")}
                        {renderDateField("Atividade encerrada a partir de", "activityEndFrom")}
                        {renderDateField("Atividade encerrada até", "activityEndTo")}
                    </div>
                </div>

                <div className="services-filter-group">
                    <h3>Lançamentos financeiros</h3>
                    <div className="services-filter-grid">
                        {renderSelectField("Tipo de lançamento", "transactionType", [
                            { value: "income", label: "Entrada" },
                            { value: "expense", label: "Saída" }
                        ])}
                        {renderTextField("ID da categoria", "transactionCategoryId")}
                        {renderTextField("Nome da categoria", "transactionCategoryName")}
                        {renderTextField("Descrição do lançamento", "transactionDescription")}
                        {renderNumberField("Valor mínimo", "transactionValueMin")}
                        {renderNumberField("Valor máximo", "transactionValueMax")}
                        {renderDateField("Lançamento a partir de", "transactionReferenceDateFrom")}
                        {renderDateField("Lançamento até", "transactionReferenceDateTo")}
                    </div>
                </div>

                <div className="services-filter-group">
                    <h3>Histórico do serviço</h3>
                    <div className="services-filter-grid">
                        {renderTextField("ID do evento", "historyId")}
                        {renderTextField("Tipo do evento", "historyEventType")}
                        {renderTextField("Descrição do evento", "historyDescription")}
                        {renderDateField("Evento a partir de", "historyDateFrom")}
                        {renderDateField("Evento até", "historyDateTo")}
                    </div>
                </div>
            </details>

            <div className="services-search-actions">
                <button className="services-search-submit" type="submit">
                    <FontAwesomeIcon icon={faMagnifyingGlass} aria-hidden="true" />
                    Pesquisar
                </button>
                <button className="services-search-reset" type="button" onClick={onClear}>
                    <FontAwesomeIcon icon={faRotateLeft} aria-hidden="true" />
                    Limpar filtros
                </button>
            </div>
        </form>
    );
}
