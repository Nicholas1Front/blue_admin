import { Prisma } from '../../../generated/prisma/client.js'
import { prisma } from '../../../shared/database/prisma.js'
import { registrarHistorico } from '../history/history.repository.js'
import type { AtualizarVinculoDTO, CriarVinculoDTO, EncerrarVinculoDTO } from './engagements.schema.js'

const valorHistorico = (value: unknown): string | null => {
    if (value === null || value === undefined) return null
    if (value instanceof Date) return value.toISOString()
    return String(value)
}

const valoresIguais = (a: unknown, b: unknown) => {
    if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime()
    return String(a) === String(b)
}

class EngagementsRepository {
    findById(id: string) {
        return prisma.employeeEngagement.findUnique({ where: { id } })
    }

    employeeExists(employeeId: string) {
        return prisma.employee.findUnique({ where: { id: employeeId }, select: { id: true } })
    }

    create(data: CriarVinculoDTO, createdById: string) {
        return prisma.$transaction(async tx => {
            const engagement = await tx.employeeEngagement.create({
                data: {
                    employeeId: data.employeeId,
                    entryDate: data.entryDate,
                    exitDate: data.exitDate ?? null,
                    position: data.position ?? null,
                    currentSalary: data.currentSalary ?? null,
                    dailyHours: data.dailyHours ?? null,
                    modality: data.modality,
                    status: data.status,
                    terminationReason: data.terminationReason ?? null,
                    noticeType: data.noticeType ?? null,
                    noticeDate: data.noticeDate ?? null,
                    noticeEndDate: data.noticeEndDate ?? null,
                    observations: data.observations ?? null
                }
            })

            await registrarHistorico(tx, {
                employeeId: data.employeeId,
                engagementId: engagement.id,
                type: 'vinculo_criado',
                title: 'Vínculo cadastrado',
                description: `Vínculo iniciado em ${data.entryDate.toLocaleDateString('pt-BR')}.`,
                metadata: {
                    modalidade: data.modality,
                    funcao: data.position ?? null,
                    remuneracaoInicial: data.currentSalary ?? null,
                    horasDiarias: data.dailyHours ?? null
                },
                eventDate: data.entryDate,
                createdById
            })

            return engagement
        })
    }

    update(id: string, data: AtualizarVinculoDTO, createdById: string) {
        return prisma.$transaction(async tx => {
            const current = await tx.employeeEngagement.findUnique({ where: { id } })
            if (!current) return null

            const { effectiveDate, ...fields } = data
            const updated = await tx.employeeEngagement.update({
                where: { id },
                data: {
                    ...(fields.entryDate !== undefined && { entryDate: fields.entryDate }),
                    ...(fields.exitDate !== undefined && { exitDate: fields.exitDate }),
                    ...(fields.position !== undefined && { position: fields.position }),
                    ...(fields.currentSalary !== undefined && { currentSalary: fields.currentSalary }),
                    ...(fields.dailyHours !== undefined && { dailyHours: fields.dailyHours }),
                    ...(fields.modality !== undefined && { modality: fields.modality }),
                    ...(fields.status !== undefined && { status: fields.status }),
                    ...(fields.terminationReason !== undefined && { terminationReason: fields.terminationReason }),
                    ...(fields.noticeType !== undefined && { noticeType: fields.noticeType }),
                    ...(fields.noticeDate !== undefined && { noticeDate: fields.noticeDate }),
                    ...(fields.noticeEndDate !== undefined && { noticeEndDate: fields.noticeEndDate }),
                    ...(fields.observations !== undefined && { observations: fields.observations })
                }
            })

            const changes: Record<string, { anterior: string | null; atual: string | null }> = {}
            for (const key of Object.keys(fields) as (keyof typeof fields)[]) {
                const previous = current[key as keyof typeof current]
                const next = updated[key as keyof typeof updated]
                if (!valoresIguais(previous, next)) {
                    changes[String(key)] = {
                        anterior: valorHistorico(previous),
                        atual: valorHistorico(next)
                    }
                }
            }

            if (Object.keys(changes).length > 0) {
                const salarioAlterado = current.currentSalary?.toString() !== updated.currentSalary?.toString()
                await registrarHistorico(tx, {
                    employeeId: current.employeeId,
                    engagementId: id,
                    type: salarioAlterado ? 'salario_alterado' : 'vinculo_atualizado',
                    title: salarioAlterado ? 'Remuneração do vínculo alterada' : 'Vínculo atualizado',
                    description: `Campos alterados: ${Object.keys(changes).join(', ')}.`,
                    metadata: changes as Prisma.InputJsonObject,
                    eventDate: effectiveDate ?? new Date(),
                    createdById
                })
            }

            return updated
        })
    }

    close(id: string, data: EncerrarVinculoDTO, createdById: string) {
        return prisma.$transaction(async tx => {
            const current = await tx.employeeEngagement.findUnique({ where: { id } })
            if (!current) return null

            const updated = await tx.employeeEngagement.update({
                where: { id },
                data: {
                    exitDate: data.exitDate,
                    status: 'encerrado',
                    terminationReason: data.terminationReason,
                    noticeType: data.noticeType ?? null,
                    noticeDate: data.noticeDate ?? null,
                    noticeEndDate: data.noticeEndDate ?? null,
                    observations: data.observations ?? current.observations
                }
            })

            await registrarHistorico(tx, {
                employeeId: current.employeeId,
                engagementId: id,
                type: 'vinculo_encerrado',
                title: 'Vínculo encerrado',
                description: `Vínculo encerrado em ${data.exitDate.toLocaleDateString('pt-BR')}. Motivo: ${data.terminationReason}.`,
                metadata: {
                    motivo: data.terminationReason,
                    avisoPrevio: data.noticeType ?? null,
                    dataAviso: data.noticeDate?.toISOString() ?? null,
                    fimAviso: data.noticeEndDate?.toISOString() ?? null
                },
                eventDate: data.exitDate,
                createdById
            })

            return updated
        })
    }
}

export default new EngagementsRepository()
