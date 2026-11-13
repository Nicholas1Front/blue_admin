import { Prisma } from '../../../generated/prisma/client.js'

export interface RegistroHistorico {
    employeeId: string
    engagementId?: string | null
    type: string
    title: string
    description?: string | null
    metadata?: Prisma.InputJsonValue
    eventDate: Date
    createdById?: string | null
}

export const registrarHistorico = (
    tx: Prisma.TransactionClient,
    data: RegistroHistorico
) => tx.employeeHistory.create({
    data: {
        employeeId: data.employeeId,
        engagementId: data.engagementId ?? null,
        type: data.type,
        title: data.title,
        description: data.description ?? null,
        ...(data.metadata !== undefined && { metadata: data.metadata }),
        eventDate: data.eventDate,
        createdById: data.createdById ?? null
    }
})
