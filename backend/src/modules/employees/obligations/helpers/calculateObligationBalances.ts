type NumericValue = number | string | { toString(): string } | null

type PaymentMovement = {
    type: string
    value: NumericValue
}

type ObligationBalanceInput = {
    id: string
    status: string
    finalValue: NumericValue
    referenceStart: Date | null
    dueDate: Date | null
    createdAt: Date
    movements: PaymentMovement[]
}

type GenericPayment = {
    value: NumericValue
}

export type ObligationBalance = {
    directPaidValue: number
    genericPaidValue: number
    paidValue: number
    outstandingValue: number
}

const toCents = (value: NumericValue) => {
    const amount = Number(value ?? 0)
    return Number.isFinite(amount) ? Math.max(0, Math.round(amount * 100)) : 0
}

const fromCents = (value: number) => Number((value / 100).toFixed(2))

const compareNullableDates = (left: Date | null, right: Date | null) => {
    if (!left && !right) return 0
    if (!left) return 1
    if (!right) return -1
    return left.getTime() - right.getTime()
}

export const calculateObligationBalances = (
    obligations: ObligationBalanceInput[],
    genericPayments: GenericPayment[]
) => {
    const balances = new Map<string, ObligationBalance>()
    const eligible = obligations
        .filter(obligation => ['pendente', 'parcial'].includes(obligation.status))
        .sort((left, right) =>
            compareNullableDates(left.referenceStart, right.referenceStart) ||
            compareNullableDates(left.dueDate, right.dueDate) ||
            left.createdAt.getTime() - right.createdAt.getTime() ||
            left.id.localeCompare(right.id)
        )

    let genericBalance = genericPayments.reduce(
        (total, payment) => total + toCents(payment.value),
        0
    )

    for (const obligation of obligations) {
        const directPaidCents = obligation.movements
            .filter(movement => movement.type === 'pagamento')
            .reduce((total, movement) => total + toCents(movement.value), 0)
        const finalValueCents = toCents(obligation.finalValue)
        const directAppliedCents = Math.min(directPaidCents, finalValueCents)

        balances.set(obligation.id, {
            directPaidValue: fromCents(directPaidCents),
            genericPaidValue: 0,
            paidValue: fromCents(directAppliedCents),
            outstandingValue: fromCents(finalValueCents - directAppliedCents)
        })
    }

    for (const obligation of eligible) {
        if (genericBalance <= 0) break

        const balance = balances.get(obligation.id)
        if (!balance) continue

        const outstandingCents = toCents(balance.outstandingValue)
        const allocatedCents = Math.min(genericBalance, outstandingCents)
        if (allocatedCents <= 0) continue

        const genericPaidValue = fromCents(allocatedCents)
        const paidValue = fromCents(toCents(balance.paidValue) + allocatedCents)

        balances.set(obligation.id, {
            ...balance,
            genericPaidValue,
            paidValue,
            outstandingValue: fromCents(outstandingCents - allocatedCents)
        })
        genericBalance -= allocatedCents
    }

    return balances
}
