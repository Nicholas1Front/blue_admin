import { Prisma } from '../../../../generated/prisma/client.js'

type AllocationAdjustment = {
    allocationId: string
    movementId: string
    previousValue: string
    currentValue: string
    releasedValue: string
}

type ReconciliationResult = {
    status: string
    totalAllocated: string
    allocationAdjustments: AllocationAdjustment[]
}

type ReconciliationOptions = {
    releaseExcess?: boolean
    forceStatus?: boolean
}

export const reconcileObligation = async (
    tx: Prisma.TransactionClient,
    obligationId: string,
    options: ReconciliationOptions = {}
): Promise<ReconciliationResult> => {
    const obligation = await tx.employeeObligation.findUniqueOrThrow({
        where: { id: obligationId },
        select: {
            finalValue: true,
            status: true
        }
    })

    const allocations = await tx.employeePaymentAllocation.findMany({
        where: { obligationId },
        orderBy: [
            { createdAt: 'asc' },
            { id: 'asc' }
        ],
        select: {
            id: true,
            movementId: true,
            value: true
        }
    })

    const allocationAdjustments: AllocationAdjustment[] = []

    if (options.releaseExcess) {
        let remainingValue = new Prisma.Decimal(obligation.finalValue)

        for (const allocation of allocations) {
            if (remainingValue.gte(allocation.value)) {
                remainingValue = remainingValue.minus(allocation.value)
                continue
            }

            const nextValue = remainingValue
            const releasedValue = allocation.value.minus(nextValue)

            if (nextValue.gt(0)) {
                await tx.employeePaymentAllocation.update({
                    where: { id: allocation.id },
                    data: { value: nextValue }
                })
            } else {
                await tx.employeePaymentAllocation.delete({
                    where: { id: allocation.id }
                })
            }

            allocationAdjustments.push({
                allocationId: allocation.id,
                movementId: allocation.movementId,
                previousValue: allocation.value.toString(),
                currentValue: nextValue.toString(),
                releasedValue: releasedValue.toString()
            })

            remainingValue = new Prisma.Decimal(0)
        }
    }

    const currentAllocations = await tx.employeePaymentAllocation.findMany({
        where: { obligationId },
        select: { value: true }
    })

    const totalAllocated = currentAllocations.reduce(
        (total, allocation) => total.plus(allocation.value),
        new Prisma.Decimal(0)
    )

    let status = obligation.status

    if (!['cancelado', 'em_revisao'].includes(obligation.status) &&
        (options.forceStatus || currentAllocations.length > 0)) {
        if (totalAllocated.gte(obligation.finalValue)) {
            status = 'pago'
        } else if (totalAllocated.gt(0)) {
            status = 'parcial'
        } else {
            status = 'pendente'
        }
    }

    if (status !== obligation.status) {
        await tx.employeeObligation.update({
            where: { id: obligationId },
            data: { status }
        })
    }

    return {
        status,
        totalAllocated: totalAllocated.toString(),
        allocationAdjustments
    }
}
