import { Prisma } from '../../generated/prisma/client.js'
import { prisma } from '../../shared/database/prisma.js'

class BudgetRepository {
    clientExists(id: string) {
        return prisma.client.findUnique({ where: { id }, select: { id: true } })
    }

    clientHasEquipament(clientId: string, equipamentId: string) {
        return prisma.equipament.findFirst({
            where: { id: equipamentId, clientId },
            select: { id: true }
        })
    }

    create(data: {
        clientId: string
        equipamentId: string
        validity: string
        warranty: string
        deliveryTime: string
        paymentCondition: string
        observations?: string | null | undefined
        globalDiscount: number
        status: string
    }) {
        return prisma.$transaction(async tx => {
            const budget = await tx.budget.create({
                data: {
                    clientId: data.clientId,
                    equipamentId: data.equipamentId,
                    validity: data.validity,
                    warranty: data.warranty,
                    deliveryTime: data.deliveryTime,
                    paymentCondition: data.paymentCondition,
                    observations: data.observations ?? null,
                    globalDiscount: new Prisma.Decimal(data.globalDiscount),
                    status: data.status
                }
            })

            await tx.budgetHistory.create({
                data: {
                    budgetId: budget.id,
                    eventType: 'orcamento_criado',
                    description: 'Orçamento criado.'
                }
            })

            return budget
        })
    }

    findById(id: string) {
        return prisma.budget.findUnique({
            where: { id },
            include: {
                history: { orderBy: { createdAt: 'desc' } }
            }
        })
    }

    update(id: string, data: any, eventDescription: string) {
        return prisma.$transaction(async tx => {
            const current = await tx.budget.findUnique({ where: { id } })
            if (!current) return null

            const aggregate = await tx.budgetItem.aggregate({
                where: { budgetId: id },
                _sum: { totalAmount: true }
            })

            const totalAmount = aggregate._sum.totalAmount ?? new Prisma.Decimal(0)
            const globalDiscount = data.globalDiscount !== undefined
                ? new Prisma.Decimal(data.globalDiscount)
                : current.globalDiscount
            const finalAmount = totalAmount
                .mul(new Prisma.Decimal(100).minus(globalDiscount))
                .div(100)

            const budget = await tx.budget.update({
                where: { id },
                data: {
                    ...data,
                    totalAmount,
                    globalDiscount,
                    finalAmount
                }
            })

            await tx.budgetHistory.create({
                data: {
                    budgetId: id,
                    eventType: data.status !== undefined && data.status !== current.status
                        ? 'status_orcamento_atualizado'
                        : 'orcamento_atualizado',
                    description: eventDescription
                }
            })

            return budget
        })
    }

    delete(id: string) {
        return prisma.budget.delete({ where: { id } })
    }
}

export default new BudgetRepository()
