type NumericValue = number | string | { toString(): string } | null

type PaymentMovement = {
    type: string
    value: NumericValue
}

export type ObligationBalanceInput = {
    id: string
    finalValue: NumericValue
    referenceStart: Date | null
    dueDate: Date | null
    createdAt: Date
    movements: PaymentMovement[]
}

export type ObligationBalance = {
    directPaidValue: number
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

export const compareObligationsByCompetence = (
    left: ObligationBalanceInput,
    right: ObligationBalanceInput
) =>
    compareNullableDates(left.referenceStart, right.referenceStart) ||
    compareNullableDates(left.dueDate, right.dueDate) ||
    left.createdAt.getTime() - right.createdAt.getTime() ||
    left.id.localeCompare(right.id)

export const calculateObligationBalances = (obligations: ObligationBalanceInput[]) => {
    const balances = new Map<string, ObligationBalance>()

    for (const obligation of obligations) {
        const directPaidCents = obligation.movements
            .filter(movement => movement.type === 'pagamento')
            .reduce((total, movement) => total + toCents(movement.value), 0)
        const finalValueCents = toCents(obligation.finalValue)
        const paidCents = Math.min(directPaidCents, finalValueCents)

        balances.set(obligation.id, {
            directPaidValue: fromCents(directPaidCents),
            paidValue: fromCents(paidCents),
            outstandingValue: fromCents(Math.max(0, finalValueCents - paidCents))
        })
    }

    return balances
}
