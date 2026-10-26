import type { ReactNode } from "react";

import { Modal } from "../../components/Modal/Modal";
import type { FinancialTransactionListItem } from "../../modules/financial/transactions/transactions.types";

interface FinancialTransactionDetailsModalProps {
    isOpen: boolean;
    transaction: FinancialTransactionListItem;
    onClose: () => void;
}

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR");
const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
});

function formatReferenceDate(value: string) {
    return dateFormatter.format(new Date(`${value.slice(0, 10)}T12:00:00`));
}

function formatTimestamp(value: string) {
    return dateTimeFormatter.format(new Date(value));
}

function DetailField({ label, children, wide = false }: {
    label: string;
    children: ReactNode;
    wide?: boolean;
}) {
    return (
        <div className={`financial-transaction-details__field${wide ? " financial-transaction-details__field--wide" : ""}`}>
            <span>{label}</span>
            <div>{children}</div>
        </div>
    );
}

export function FinancialTransactionDetailsModal({
    isOpen,
    transaction,
    onClose
}: FinancialTransactionDetailsModalProps) {
    return (
        <Modal isOpen={isOpen} title="Consultar lançamento" onClose={onClose}>
            <div className="financial-transaction-details">
                <p className="financial-transaction-details__intro">
                    Consulte os dados do lançamento e seu vínculo de origem. Os vínculos são gerenciados pelo módulo de origem.
                </p>

                <div className="financial-transaction-details__grid">
                    <DetailField label="Descrição" wide>
                        <strong>{transaction.description}</strong>
                    </DetailField>
                    <DetailField label="ID do lançamento" wide>
                        <code>{transaction.id}</code>
                    </DetailField>
                    <DetailField label="Tipo">
                        <span className={`financial-transaction-details__type financial-transaction-details__type--${transaction.type}`}>
                            {transaction.type === "income" ? "Entrada" : "Saída"}
                        </span>
                    </DetailField>
                    <DetailField label="Categoria">
                        {transaction.categoryName}
                    </DetailField>
                    <DetailField label="Valor">
                        <strong>{currencyFormatter.format(Number(transaction.value))}</strong>
                    </DetailField>
                    <DetailField label="Data de referência">
                        {formatReferenceDate(transaction.referenceDate)}
                    </DetailField>
                    <DetailField label="originType">
                        {transaction.originType ? <code>{transaction.originType}</code> : <span className="financial-transaction-details__empty">Sem vínculo</span>}
                    </DetailField>
                    <DetailField label="originId" wide>
                        {transaction.originId ? <code>{transaction.originId}</code> : <span className="financial-transaction-details__empty">Sem vínculo</span>}
                    </DetailField>
                    <DetailField label="Criado em">
                        {formatTimestamp(transaction.createdAt)}
                    </DetailField>
                    <DetailField label="Atualizado em">
                        {formatTimestamp(transaction.updatedAt)}
                    </DetailField>
                </div>

                <footer className="financial-transaction-details__actions">
                    <button type="button" onClick={onClose}>
                        Fechar
                    </button>
                </footer>
            </div>
        </Modal>
    );
}
