import { useState, type FormEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWrench } from "@fortawesome/free-solid-svg-icons";

import { Modal } from "../../../components/Modal/Modal";
import { useServicesByFilters } from "../../../modules/services";
import type {
    FindServicesByAdvancedFilters,
    ServiceStatus,
    ServiceSummary
} from "../../../modules/services";
import { ServiceAdvancedFiltersForm } from "./ServiceAdvancedFiltersForm";
import "./ServiceBudgetConversionSearchModal.css";

const PAGE_SIZE = 10;
type ServiceSearchForm = Omit<FindServicesByAdvancedFilters, "page" | "limit">;

const statusLabels: Record<ServiceStatus, string> = {
    pendente: "Pendente",
    aguardando_resposta_cliente: "Aguardando cliente",
    cancelado: "Cancelado",
    "aguardando_peças": "Aguardando peças",
    "em_execução": "Em execução",
    finalizado: "Finalizado",
    equipamento_saiu: "Equipamento saiu",
    aguardando_pagamento: "Aguardando pagamento",
    pagamento_atrasado: "Pagamento atrasado",
    pagamento_recebido: "Pagamento recebido"
};

function getCurrentMonthRange(): ServiceSearchForm {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const lastDay = new Date(year, month, 0).getDate();
    const pad = (value: number) => String(value).padStart(2, "0");

    return {
        entryDateFrom: year + "-" + pad(month) + "-01",
        entryDateTo: year + "-" + pad(month) + "-" + lastDay
    };
}

function formatDate(value: string) {
    const date = new Date(value.slice(0, 10) + "T12:00:00");
    return Number.isNaN(date.getTime()) ? "Não informada" : date.toLocaleDateString("pt-BR");
}

function formatEquipment(service: ServiceSummary) {
    return [
        service.equipament.type,
        [service.equipament.brand, service.equipament.model].filter(Boolean).join(" "),
        service.equipament.mainIdentification,
        service.equipament.additionalIdentification
    ].filter(Boolean).join(" · ");
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (serviceId: string) => void;
}

export function ServiceBudgetConversionSearchModal({ isOpen, onClose, onSelect }: Props) {
    const [filterDraft, setFilterDraft] = useState<ServiceSearchForm>(() => getCurrentMonthRange());
    const [page, setPage] = useState(1);
    const [appliedFilters, setAppliedFilters] = useState<FindServicesByAdvancedFilters>(() => ({
        ...getCurrentMonthRange(),
        page: 1,
        limit: PAGE_SIZE
    }));

    const query = useServicesByFilters({ ...appliedFilters, page, limit: PAGE_SIZE }, isOpen);

    function updateFilter(key: keyof ServiceSearchForm, value: string | number | boolean | undefined) {
        setFilterDraft(current => ({ ...current, [key]: value === "" ? undefined : value }));
    }

    function applyFilters(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const normalized = Object.fromEntries(
            Object.entries(filterDraft).filter(([, value]) =>
                value !== undefined && value !== null && value !== ""
            )
        ) as ServiceSearchForm;

        setPage(1);
        setAppliedFilters({ ...normalized, page: 1, limit: PAGE_SIZE });
    }

    function clearFilters() {
        const period = getCurrentMonthRange();
        setFilterDraft(period);
        setAppliedFilters({ ...period, page: 1, limit: PAGE_SIZE });
        setPage(1);
    }

    function changePage(nextPage: number) {
        if (nextPage < 1 || nextPage > (query.data?.pagination.totalPages ?? 0)) return;
        setPage(nextPage);
    }

    return (
        <Modal isOpen={isOpen} title="Criar orçamento a partir de serviço" onClose={onClose} size="wide">
            <div className="service-budget-search">
                <header className="service-budget-search__intro">
                    <span><FontAwesomeIcon icon={faWrench} aria-hidden="true" /> Conversão de serviço</span>
                    <p>
                        Localize o serviço que dará origem ao orçamento. A consulta começa pelos
                        serviços com data de entrada no mês atual; você pode ajustar qualquer filtro.
                    </p>
                </header>

                <section className="service-budget-search__filters">
                    <ServiceAdvancedFiltersForm
                        values={filterDraft}
                        onChange={updateFilter}
                        onSubmit={applyFilters}
                        onClear={clearFilters}
                    />
                </section>

                <section className="service-budget-search__results" aria-live="polite">
                    <header>
                        <div>
                            <span>Seleção</span>
                            <h3>Serviços encontrados</h3>
                        </div>
                        <strong>{query.data?.pagination.total ?? 0} registro(s)</strong>
                    </header>

                    {query.isPending ? (
                        <div className="service-budget-search__state">Carregando serviços…</div>
                    ) : query.isError ? (
                        <div className="service-budget-search__state" role="alert">
                            <strong>Não foi possível consultar os serviços.</strong>
                            <button type="button" onClick={() => void query.refetch()}>Tentar novamente</button>
                        </div>
                    ) : query.data?.services.length ? (
                        <>
                            <div className="service-budget-search__list">
                                {query.data.services.map(service => (
                                    <button
                                        type="button"
                                        className="service-budget-search__item"
                                        key={service.id}
                                        onClick={() => onSelect(service.id)}
                                    >
                                        <span className="service-budget-search__item-main">
                                            <span className="service-budget-search__item-heading">
                                                <strong>{service.client.name}</strong>
                                                <span>{statusLabels[service.status]}</span>
                                            </span>
                                            <small>{formatEquipment(service) || "Equipamento não identificado"}</small>
                                            <small>Entrada em {formatDate(service.entryDate)} · {service.activityCount} atividade(s)</small>
                                            <small className="service-budget-search__id">Serviço #{service.id}</small>
                                        </span>
                                        <span className="service-budget-search__select">Selecionar serviço →</span>
                                    </button>
                                ))}
                            </div>

                            <nav className="service-budget-search__pagination" aria-label="Paginação dos serviços encontrados">
                                <span>
                                    Página <strong>{query.data.pagination.page}</strong> de{" "}
                                    <strong>{Math.max(query.data.pagination.totalPages, 1)}</strong>
                                    {" · "}{query.data.pagination.total} serviço(s)
                                </span>
                                <div>
                                    <button type="button" disabled={page <= 1 || query.isFetching} onClick={() => changePage(page - 1)}>Anterior</button>
                                    <button type="button" disabled={page >= query.data.pagination.totalPages || query.isFetching} onClick={() => changePage(page + 1)}>Próxima</button>
                                </div>
                            </nav>
                        </>
                    ) : (
                        <div className="service-budget-search__state">
                            <strong>Nenhum serviço encontrado</strong>
                            <p>Altere os filtros para ampliar a pesquisa.</p>
                        </div>
                    )}
                </section>
            </div>
        </Modal>
    );
}
