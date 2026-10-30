import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faArrowDown,
    faArrowUp,
    faCalendarDays,
    faClock,
    faCoins,
    faFileInvoiceDollar,
    faGaugeHigh,
    faClockRotateLeft,
    faListCheck,
    faScrewdriverWrench,
    faUser,
    faTruck
} from "@fortawesome/free-solid-svg-icons";
import { useParams, useSearchParams } from "react-router-dom";
import { useState } from "react";

import { AppHeader } from "../../components/AppHeader/AppHeader";
import { BackLink } from "../../components/BackLink/BackLink";
import { Modal } from "../../components/Modal/Modal";
import { ServiceDetailsManagement } from "./ServiceDetailsManagement";
import { useServiceById, useUpdateService } from "../../modules/services";
import type {
    ServiceActivityStatus,
    ServiceStatus,
    ServiceTitheStatus,
    ServiceFinancialTransaction
} from "../../modules/services";
import "./ServiceDetails.css";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric"
});

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
});

const serviceStatusLabels: Record<ServiceStatus, string> = {
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

const serviceStatusTones: Record<ServiceStatus, string> = {
    pendente: "neutral",
    aguardando_resposta_cliente: "info",
    cancelado: "danger",
    "aguardando_peças": "warning",
    "em_execução": "info",
    finalizado: "success",
    equipamento_saiu: "success",
    aguardando_pagamento: "warning",
    pagamento_atrasado: "danger",
    pagamento_recebido: "success"
};

const activityStatusLabels: Record<ServiceActivityStatus, string> = {
    pendente: "Pendente",
    "em_execução": "Em execução",
    concluida: "Concluída",
    cancelada: "Cancelada"
};

const titheStatusLabels: Record<ServiceTitheStatus, string> = {
    aguardando: "Aguardando",
    "não concluído": "Não concluído",
    "concluído": "Concluído"
};

function formatCurrency(value: number | string | null | undefined) {
    return currencyFormatter.format(Number(value ?? 0));
}

function formatDate(value: string | null | undefined) {
    if (!value) return "Não informado";
    const dateOnly = value.slice(0, 10);
    const date = new Date(`${dateOnly}T12:00:00`);
    return Number.isNaN(date.getTime()) ? "Não informado" : dateFormatter.format(date);
}

function formatDateTime(value: string | null | undefined) {
    if (!value) return "Não informado";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "Não informado" : dateTimeFormatter.format(date);
}

function formatId(value: string | null | undefined) {
    return value ? value : "Não vinculado";
}

function InfoField({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="service-details-field">
            <span>{label}</span>
            <strong>{value || "Não informado"}</strong>
        </div>
    );
}

function SectionHeading({
    icon,
    eyebrow,
    title,
    description,
    count
}: {
    icon: typeof faUser;
    eyebrow: string;
    title: string;
    description: string;
    count?: string;
}) {
    return (
        <header className="service-details-section__heading">
            <span className="service-details-section__icon" aria-hidden="true">
                <FontAwesomeIcon icon={icon} />
            </span>
            <div className="service-details-section__heading-copy">
                <span className="service-details-eyebrow">{eyebrow}</span>
                <h2>{title}</h2>
                <p>{description}</p>
            </div>
            {count && <span className="service-details-section__count">{count}</span>}
        </header>
    );
}

function TransactionRow({ transaction }: { transaction: ServiceFinancialTransaction }) {
    const isIncome = transaction.type === "income";

    return (
        <article className="service-details-transaction">
            <span className={`service-details-transaction__icon service-details-transaction__icon--${isIncome ? "income" : "expense"}`}>
                <FontAwesomeIcon icon={isIncome ? faArrowDown : faArrowUp} aria-hidden="true" />
            </span>
            <div className="service-details-transaction__main">
                <strong>{transaction.description}</strong>
                <span>{transaction.categoryName} · {formatDate(transaction.referenceDate)}</span>
                <small>ID: {transaction.id}</small>
            </div>
            <strong className={`service-details-transaction__value service-details-transaction__value--${isIncome ? "income" : "expense"}`}>
                {isIncome ? "+" : "−"} {formatCurrency(transaction.value)}
            </strong>
        </article>
    );
}

export function ServiceDetails() {
    const { serviceId } = useParams<{ serviceId: string }>();
    const [searchParams, setSearchParams] = useSearchParams();
    const [showCreatedModal, setShowCreatedModal] = useState(() => searchParams.get("created") === "1");
    const [isCalculatingCost, setIsCalculatingCost] = useState(false);
    const [costCalculationError, setCostCalculationError] = useState<string | null>(null);
    const [costCalculationSuccess, setCostCalculationSuccess] = useState(false);
    const [costDialogRequest, setCostDialogRequest] = useState(0);
    const detailsQuery = useServiceById(serviceId);
    const updateServiceMutation = useUpdateService();
    const details = detailsQuery.data;

    function closeCreatedModal() {
        setShowCreatedModal(false);
        const nextParams = new URLSearchParams(searchParams);
        nextParams.delete("created");
        setSearchParams(nextParams, { replace: true });
    }

    async function calculateOperationalCost() {
        if (!details) return;
        setIsCalculatingCost(true);
        setCostCalculationError(null);
        setCostCalculationSuccess(false);
        try {
            await updateServiceMutation.mutateAsync({
                id: details.service.id,
                data: {
                    costPerHour: true,
                    description: "Custo operacional calculado após a criação do serviço"
                }
            });
            await detailsQuery.refetch();
            setCostCalculationSuccess(true);
        } catch (error) {
            setCostCalculationError(error instanceof Error ? error.message : "Não foi possível calcular o custo operacional.");
        } finally {
            setIsCalculatingCost(false);
        }
    }

    function scrollToSection(sectionId: string) {
        closeCreatedModal();
        window.setTimeout(() => document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
    }

    return (
        <main className="service-details-page">
            <title>{details ? `Serviço #${details.service.id.slice(0, 8)} | Blue Admin` : "Detalhes do serviço | Blue Admin"}</title>
            <AppHeader />
            <nav className="page-back-row" aria-label="Navegação da página">
                <BackLink to="/services" label="Voltar aos serviços" />
            </nav>

                {details && (
                    <Modal isOpen={showCreatedModal} title="Serviço criado com sucesso" onClose={closeCreatedModal}>
                        <div className="service-created-next-steps">
                            <p>O serviço já está registrado e seu histórico foi criado. Você pode complementar as informações agora ou voltar a isso depois.</p>
                            <div className="service-created-next-steps__actions">
                                <button type="button" onClick={() => scrollToSection("service-transactions")}>Ver transações</button>
                                <button type="button" onClick={() => scrollToSection("service-activities")}>Ver atividades</button>
                                <button type="button" onClick={() => scrollToSection("service-tithe")}>Ver dízimo</button>
                            </div>
                            <div className="service-created-next-steps__cost">
                                <strong>Custo operacional</strong>
                                <p>O custo por hora ficou em branco conforme a regra de negócio. Se quiser, você pode calcular agora usando as despesas mensais ativas.</p>
                                {costCalculationError && <p className="service-created-next-steps__error" role="alert">{costCalculationError}</p>}
                                {costCalculationSuccess && <p className="service-created-next-steps__success" role="status">Custo por hora calculado e serviço atualizado. O custo operacional considera as horas informadas.</p>}
                                <button type="button" onClick={() => void calculateOperationalCost()} disabled={isCalculatingCost || costCalculationSuccess}>
                                    {isCalculatingCost ? "Calculando..." : costCalculationSuccess ? "Custo por hora calculado" : "Calcular custo operacional"}
                                </button>
                            </div>
                            <div className="service-created-next-steps__footer">
                                <button type="button" onClick={closeCreatedModal}>Continuar para os detalhes</button>
                            </div>
                        </div>
                    </Modal>
                )}

            <div className="service-details-content">
                {detailsQuery.isPending && (
                    <div className="service-details-state" role="status">
                        <span className="service-details-state__spinner" aria-hidden="true" />
                        <strong>Carregando detalhes do serviço…</strong>
                        <p>Estamos reunindo as informações operacionais e financeiras.</p>
                    </div>
                )}

                {detailsQuery.isError && (
                    <div className="service-details-state service-details-state--error" role="alert">
                        <span className="service-details-state__symbol" aria-hidden="true">!</span>
                        <strong>Não foi possível carregar este serviço.</strong>
                        <p>O serviço pode não existir ou houve um problema de conexão.</p>
                        <button type="button" onClick={() => detailsQuery.refetch()}>
                            Tentar novamente
                        </button>
                    </div>
                )}

                {details && (
                    <>
                        <header className="service-details-hero">
                            <div className="service-details-hero__copy">
                                <span className="service-details-eyebrow">Gestão da oficina · Detalhes</span>
                                <div className="service-details-hero__title-row">
                                    <h1>Serviço <span>#{details.service.id.slice(0, 8)}</span></h1>
                                    <span className={`service-details-status service-details-status--${serviceStatusTones[details.service.status]}`}>
                                        {serviceStatusLabels[details.service.status]}
                                    </span>
                                </div>
                                <p>Consulte as informações do atendimento, do equipamento e dos registros relacionados.</p>
                            </div>
                            <div className="service-details-hero__dates">
                                <div>
                                    <span><FontAwesomeIcon icon={faCalendarDays} aria-hidden="true" /> Entrada</span>
                                    <strong>{formatDate(details.service.entryDate)}</strong>
                                </div>
                                <div>
                                    <span><FontAwesomeIcon icon={faCalendarDays} aria-hidden="true" /> Saída</span>
                                    <strong>{details.service.exitDate ? formatDate(details.service.exitDate) : "Em andamento"}</strong>
                                </div>
                            </div>
                        </header>

                        <ServiceDetailsManagement
                            details={details}
                            onUpdated={() => detailsQuery.refetch()}
                            costDialogRequest={costDialogRequest}
                        />

                        <section className="service-details-metrics" aria-label="Resumo financeiro e operacional">
                            <article className="service-details-metric">
                                <span className="service-details-metric__label"><FontAwesomeIcon icon={faArrowDown} aria-hidden="true" /> Recebimentos vinculados</span>
                                <strong className="service-details-metric__value service-details-metric__value--income">{formatCurrency(details.financial.incomeTotal)}</strong>
                                <p>Transações de entrada associadas ao serviço</p>
                            </article>
                            <article className="service-details-metric">
                                <span className="service-details-metric__label"><FontAwesomeIcon icon={faArrowUp} aria-hidden="true" /> Custos diretos</span>
                                <strong className="service-details-metric__value service-details-metric__value--expense">{formatCurrency(details.financial.expenseTotal)}</strong>
                                <p>Despesas financeiras vinculadas</p>
                            </article>
                            <article className="service-details-metric">
                                <span className="service-details-metric__label"><FontAwesomeIcon icon={faGaugeHigh} aria-hidden="true" /> Custo operacional</span>
                                <strong className="service-details-metric__value">{formatCurrency(details.financial.operationalCost)}</strong>
                                <p>{details.service.hoursWorked == null ? "Horas trabalhadas não informadas" : `${details.service.hoursWorked} h × ${formatCurrency(details.service.costPerHour)} por hora`}</p>
                                <button type="button" className="service-details-metric__action" onClick={() => setCostDialogRequest(current => current + 1)}>Editar custo e horas</button>
                            </article>
                            <article className="service-details-metric">
                                <span className="service-details-metric__label"><FontAwesomeIcon icon={faCoins} aria-hidden="true" /> Saldo financeiro</span>
                                <strong className={`service-details-metric__value ${details.financial.incomeTotal - details.financial.expenseTotal - details.financial.operationalCost >= 0 ? "service-details-metric__value--income" : "service-details-metric__value--expense"}`}>
                                    {formatCurrency(details.financial.incomeTotal - details.financial.expenseTotal - details.financial.operationalCost)}
                                </strong>
                                <p>Recebimentos menos custos diretos e operacional</p>
                            </article>
                        </section>

                        <div className="service-details-grid">
                            <section className="service-details-section">
                                <SectionHeading
                                    icon={faUser}
                                    eyebrow="Responsável pelo atendimento"
                                    title="Cliente"
                                    description="Dados do cliente associado ao serviço."
                                />
                                <div className="service-details-fields">
                                    <InfoField label="Nome" value={details.client.name} />
                                    <InfoField label="Documento" value={details.client.document ?? "Não informado"} />
                                    <InfoField label="ID do cliente" value={details.service.clientId} />
                                </div>
                            </section>

                            <section className="service-details-section">
                                <SectionHeading
                                    icon={faTruck}
                                    eyebrow="Bem recebido na oficina"
                                    title="Equipamento"
                                    description="Identificação do equipamento vinculado."
                                />
                                <div className="service-details-fields">
                                    <InfoField label="Tipo" value={details.equipament.type} />
                                    <InfoField label="Marca" value={details.equipament.brand} />
                                    <InfoField label="Modelo" value={details.equipament.model ?? "Não informado"} />
                                    <InfoField label="Identificação principal" value={details.equipament.mainIdentification ?? "Não informada"} />
                                    <InfoField label="Identificação adicional" value={details.equipament.additionalIdentification ?? "Não informada"} />
                                    <InfoField label="ID do equipamento" value={details.equipament.id} />
                                </div>
                            </section>

                            <section className="service-details-section">
                                <SectionHeading
                                    icon={faScrewdriverWrench}
                                    eyebrow="Informações do atendimento"
                                    title="Dados do serviço"
                                    description="Datas, horas e informações de controle."
                                />
                                <div className="service-details-fields">
                                    <InfoField label="Status atual" value={serviceStatusLabels[details.service.status]} />
                                    <InfoField label="Data de entrada" value={formatDate(details.service.entryDate)} />
                                    <InfoField label="Data de saída" value={formatDate(details.service.exitDate)} />
                                    <InfoField label="Horas trabalhadas" value={details.service.hoursWorked == null ? "Não informadas" : `${details.service.hoursWorked} h`} />
                                    <InfoField label="Custo por hora (snapshot)" value={details.service.costPerHour == null ? "Não definido" : formatCurrency(details.service.costPerHour)} />
                                    <InfoField label="Criado em" value={formatDateTime(details.service.createdAt)} />
                                    <InfoField label="Atualizado em" value={formatDateTime(details.service.updatedAt)} />
                                    <InfoField label="ID completo do serviço" value={details.service.id} />
                                </div>
                            </section>

                            <section id="service-tithe" className="service-details-section">
                                <SectionHeading
                                    icon={faCoins}
                                    eyebrow="Controle do dízimo"
                                    title="Dízimo do serviço"
                                    description="Situação calculada a partir dos dados financeiros retornados pela consulta."
                                />
                                <div className="service-details-tithe">
                                    <div className="service-details-tithe__top">
                                        <div>
                                            <span>Valor calculado</span>
                                            <strong>{formatCurrency(details.financial.tithe.value)}</strong>
                                        </div>
                                        <span className={`service-details-status service-details-status--${details.financial.tithe.isPaid ? "success" : "warning"}`}>
                                            {titheStatusLabels[details.financial.tithe.status]}
                                        </span>
                                    </div>
                                    <div className="service-details-fields">
                                        <InfoField label="ID da transação do dízimo" value={formatId(details.service.titheTransactionId)} />
                                        <InfoField label="Categoria" value={details.financial.tithe.transaction?.categoryName ?? "Sem categoria vinculada"} />
                                        <InfoField label="Descrição da transação" value={details.financial.tithe.transaction?.description ?? "Nenhuma transação vinculada"} />
                                        <InfoField label="Data de referência" value={formatDate(details.financial.tithe.transaction?.referenceDate)} />
                                        <InfoField label="Valor registrado" value={details.financial.tithe.transaction ? formatCurrency(details.financial.tithe.transaction.value) : "Não registrado"} />
                                    </div>
                                </div>
                            </section>
                        </div>

                        <section id="service-transactions" className="service-details-section service-details-section--wide">
                            <SectionHeading
                                icon={faFileInvoiceDollar}
                                eyebrow="Entradas e saídas"
                                title="Lançamentos financeiros"
                                description="Transações vinculadas diretamente a este serviço. O dízimo é apresentado separadamente."
                                count={`${details.financial.transactions.length} ${details.financial.transactions.length === 1 ? "lançamento" : "lançamentos"}`}
                            />
                            {details.financial.transactions.length === 0 ? (
                                <div className="service-details-empty">
                                    <FontAwesomeIcon icon={faFileInvoiceDollar} aria-hidden="true" />
                                    <strong>Nenhum lançamento vinculado</strong>
                                    <p>Quando houver transações associadas ao serviço, elas aparecerão nesta seção.</p>
                                </div>
                            ) : (
                                <div className="service-details-transactions">
                                    {details.financial.transactions.map(transaction => (
                                        <TransactionRow transaction={transaction} key={transaction.id} />
                                    ))}
                                </div>
                            )}
                        </section>

                        <section id="service-activities" className="service-details-section service-details-section--wide">
                            <SectionHeading
                                icon={faListCheck}
                                eyebrow="Execução do trabalho"
                                title="Atividades"
                                description="Etapas e tarefas registradas para este atendimento."
                                count={`${details.activities.total} ${details.activities.total === 1 ? "atividade" : "atividades"}`}
                            />
                            <div className="service-details-activity-summary">
                                {(Object.entries(activityStatusLabels) as [ServiceActivityStatus, string][]).map(([status, label]) => (
                                    <div className="service-details-activity-summary__item" key={status}>
                                        <span>{label}</span>
                                        <strong>{details.activities.byStatus[status] ?? 0}</strong>
                                    </div>
                                ))}
                            </div>
                            {details.activities.list.length === 0 ? (
                                <div className="service-details-empty">
                                    <FontAwesomeIcon icon={faListCheck} aria-hidden="true" />
                                    <strong>Nenhuma atividade registrada</strong>
                                    <p>As atividades realizadas poderão ser acompanhadas aqui.</p>
                                </div>
                            ) : (
                                <div className="service-details-activities">
                                    {details.activities.list.map(activity => (
                                        <article className="service-details-activity" key={activity.id}>
                                            <div className="service-details-activity__top">
                                                <div>
                                                    <h3>{activity.title}</h3>
                                                    <span>ID: {activity.id}</span>
                                                </div>
                                                <span className={`service-details-status service-details-status--${activity.status === "concluida" ? "success" : activity.status === "cancelada" ? "danger" : activity.status === "em_execução" ? "info" : "warning"}`}>
                                                    {activityStatusLabels[activity.status]}
                                                </span>
                                            </div>
                                            {activity.description && <p>{activity.description}</p>}
                                            <div className="service-details-activity__dates">
                                                <span><FontAwesomeIcon icon={faCalendarDays} aria-hidden="true" /> Início: {formatDateTime(activity.startAt)}</span>
                                                <span><FontAwesomeIcon icon={faClock} aria-hidden="true" /> Fim: {formatDateTime(activity.endAt)}</span>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            )}
                        </section>

                        <section className="service-details-section service-details-section--wide">
                            <SectionHeading
                                icon={faClockRotateLeft}
                                eyebrow="Rastreabilidade"
                                title="Histórico do serviço"
                                description="Registro cronológico das alterações e eventos gerados pelo sistema."
                                count={`${details.history.length} ${details.history.length === 1 ? "registro" : "registros"}`}
                            />
                            {details.history.length === 0 ? (
                                <div className="service-details-empty">
                                    <FontAwesomeIcon icon={faClockRotateLeft} aria-hidden="true" />
                                    <strong>Nenhum evento no histórico</strong>
                                    <p>Os registros de auditoria aparecerão aqui conforme o serviço evoluir.</p>
                                </div>
                            ) : (
                                <ol className="service-details-history">
                                    {details.history.map(event => (
                                        <li className="service-details-history__item" key={event.id}>
                                            <span className="service-details-history__marker" aria-hidden="true" />
                                            <div className="service-details-history__body">
                                                <div className="service-details-history__top">
                                                    <strong>{event.eventType.replaceAll("_", " ")}</strong>
                                                    <time dateTime={event.createdAt}>{formatDateTime(event.createdAt)}</time>
                                                </div>
                                                <p>{event.description}</p>
                                                <small>ID do evento: {event.id}</small>
                                            </div>
                                        </li>
                                    ))}
                                </ol>
                            )}
                        </section>
                    </>
                )}
            </div>
        </main>
    );
}
