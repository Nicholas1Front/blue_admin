import { Prisma } from '../../../generated/prisma/client.js'

type AllocationRecord = {
    value: Prisma.Decimal
}

export type AllocatableObligation = {
    id: string
    finalValue: Prisma.Decimal
    referenceStart: Date | null
    dueDate: Date | null
    createdAt: Date
    allocations: AllocationRecord[]
}

export class PaymentAllocationError extends Error {
    constructor(public readonly code: 'INVALID_ALLOCATION_OBLIGATION' | 'ALLOCATION_EXCEEDS_OUTSTANDING_VALUE' | 'PAYMENT_ALLOCATIONS_EXCEED_VALUE' | 'DUPLICATE_ALLOCATION_OBLIGATION') {
        super(code)
        this.name = 'PaymentAllocationError'
    }
}

export type PaymentAllocation = {
    obligationId: string
    value: Prisma.Decimal
    type: 'fifo' | 'manual'
}

export const getOutstandingValue = (obligation: AllocatableObligation) => {
    const allocatedValue = obligation.allocations.reduce(
        (total, allocation) => total.plus(allocation.value),
        new Prisma.Decimal(0)
    )

    const outstandingValue = obligation.finalValue.minus(allocatedValue)
    return outstandingValue.gt(0) ? outstandingValue : new Prisma.Decimal(0)
}

const compareDates = (first: Date | null, second: Date | null) => {
    if (first === null && second === null) return 0
    if (first === null) return 1
    if (second === null) return -1
    return first.getTime() - second.getTime()
}

export const allocatePaymentFIFO = (
    paymentValue: Prisma.Decimal,
    obligations: AllocatableObligation[]
) => {
    let remainingValue = new Prisma.Decimal(paymentValue)
    const allocations: PaymentAllocation[] = []

    const orderedObligations = [...obligations].sort((first, second) =>
        compareDates(first.referenceStart ?? first.dueDate, second.referenceStart ?? second.dueDate) ||
        compareDates(first.dueDate, second.dueDate) ||
        first.createdAt.getTime() - second.createdAt.getTime() ||
        first.id.localeCompare(second.id)
    )

    for (const obligation of orderedObligations) {
        if (remainingValue.lte(0)) break

        const outstandingValue = getOutstandingValue(obligation)
        if (outstandingValue.lte(0)) continue

        const allocatedValue = remainingValue.lt(outstandingValue) ? remainingValue : outstandingValue

        allocations.push({
            obligationId: obligation.id,
            value: allocatedValue,
            type: 'fifo'
        })

        remainingValue = remainingValue.minus(allocatedValue)
    }

    return {
        allocations,
        allocatedValue: new Prisma.Decimal(paymentValue).minus(remainingValue),
        unallocatedValue: remainingValue
    }
}

export const validateManualAllocations = (
    requestedAllocations: { obligationId: string; value: number }[],
    obligations: AllocatableObligation[]
) => {
    const obligationIds = requestedAllocations.map(request => request.obligationId)
    if (new Set(obligationIds).size !== obligationIds.length) {
        throw new PaymentAllocationError('DUPLICATE_ALLOCATION_OBLIGATION')
    }

    const availableObligations = new Map(
        obligations.map(obligation => [obligation.id, obligation])
    )

    const allocations: PaymentAllocation[] = requestedAllocations.map(request => {
        const obligation = availableObligations.get(request.obligationId)

        if (!obligation) {
            throw new PaymentAllocationError('INVALID_ALLOCATION_OBLIGATION')
        }

        const requestedValue = new Prisma.Decimal(request.value)
        const outstandingValue = getOutstandingValue(obligation)

        if (requestedValue.gt(outstandingValue)) {
            throw new PaymentAllocationError('ALLOCATION_EXCEEDS_OUTSTANDING_VALUE')
        }

        return {
            obligationId: obligation.id,
            value: requestedValue,
            type: 'manual'
        }
    })

    const allocatedValue = allocations.reduce(
        (total, allocation) => total.plus(allocation.value),
        new Prisma.Decimal(0)
    )

    return { allocations, allocatedValue }
}
