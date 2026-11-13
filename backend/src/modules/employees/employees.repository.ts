import { prisma } from '../../shared/database/prisma.js'
import { registrarHistorico } from './history/history.repository.js'
import type { AtualizarColaboradorDTO, CriarColaboradorDTO } from './employees.schema.js'

class EmployeesRepository {
    findById(id: string) {
        return prisma.employee.findUnique({ where: { id } })
    }

    findByDocument(cpfCnpj: string, exceptId?: string) {
        return prisma.employee.findFirst({
            where: {
                cpfCnpj,
                ...(exceptId !== undefined && { id: { not: exceptId } })
            },
            select: { id: true }
        })
    }

    create(data: CriarColaboradorDTO, cpfCnpj: string | null, createdById: string) {
        return prisma.$transaction(async tx => {
            const employee = await tx.employee.create({
                data: {
                    name: data.name,
                    cpfCnpj,
                    address: data.address ?? null,
                    birthDate: data.birthDate ?? null,
                    observations: data.observations ?? null
                }
            })

            await registrarHistorico(tx, {
                employeeId: employee.id,
                type: 'colaborador_criado',
                title: 'Colaborador cadastrado',
                description: 'Cadastro inicial do colaborador.',
                eventDate: employee.createdAt,
                createdById
            })

            return employee
        })
    }

    update(id: string, data: AtualizarColaboradorDTO, cpfCnpj: string | null | undefined, createdById: string) {
        return prisma.$transaction(async tx => {
            const current = await tx.employee.findUnique({ where: { id } })
            if (!current) return null

            const employee = await tx.employee.update({
                where: { id },
                data: {
                    ...(data.name !== undefined && { name: data.name }),
                    ...(cpfCnpj !== undefined && { cpfCnpj }),
                    ...(data.address !== undefined && { address: data.address }),
                    ...(data.birthDate !== undefined && { birthDate: data.birthDate }),
                    ...(data.observations !== undefined && { observations: data.observations })
                }
            })

            const changedFields = Object.keys(data)
            if (changedFields.length > 0) {
                await registrarHistorico(tx, {
                    employeeId: id,
                    type: 'dados_atualizados',
                    title: 'Dados cadastrais atualizados',
                    description: `Campos revisados: ${changedFields.join(', ')}.`,
                    metadata: {
                        campos: changedFields,
                        documentoAnterior: current.cpfCnpj,
                        documentoAtual: employee.cpfCnpj
                    },
                    eventDate: new Date(),
                    createdById
                })
            }

            return employee
        })
    }
}

export default new EmployeesRepository()
