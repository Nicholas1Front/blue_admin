import { AppError } from '../../shared/errors/AppError.js'
import { isPrismaErrorCode } from '../../shared/errors/isPrismaErrorCode.js'
import employeesRepository from './employees.repository.js'
import { normalizarCpfCnpj } from './helpers/normalizarCpfCnpj.js'
import type { AtualizarColaboradorDTO, CriarColaboradorDTO } from './employees.schema.js'

class EmployeesService {
    async create(data: CriarColaboradorDTO, createdById: string) {
        const cpfCnpj = normalizarCpfCnpj(data.cpfCnpj) ?? null
        if (cpfCnpj && await employeesRepository.findByDocument(cpfCnpj)) {
            throw new AppError('CPF/CNPJ is already registered', 409, 'EMPLOYEE_DOCUMENT_ALREADY_EXISTS')
        }

        try {
            return await employeesRepository.create(data, cpfCnpj, createdById)
        } catch (error) {
            if (isPrismaErrorCode(error, 'P2002')) {
                throw new AppError('CPF/CNPJ is already registered', 409, 'EMPLOYEE_DOCUMENT_ALREADY_EXISTS')
            }
            throw error
        }
    }

    async update(id: string, data: AtualizarColaboradorDTO, createdById: string) {
        const current = await employeesRepository.findById(id)
        if (!current) throw new AppError('Employee not found', 404, 'EMPLOYEE_NOT_FOUND')

        const cpfCnpj = normalizarCpfCnpj(data.cpfCnpj)
        if (cpfCnpj && await employeesRepository.findByDocument(cpfCnpj, id)) {
            throw new AppError('CPF/CNPJ is already registered', 409, 'EMPLOYEE_DOCUMENT_ALREADY_EXISTS')
        }

        try {
            const updated = await employeesRepository.update(id, data, cpfCnpj, createdById)
            if (!updated) throw new AppError('Employee not found', 404, 'EMPLOYEE_NOT_FOUND')
            return updated
        } catch (error) {
            if (isPrismaErrorCode(error, 'P2002')) {
                throw new AppError('CPF/CNPJ is already registered', 409, 'EMPLOYEE_DOCUMENT_ALREADY_EXISTS')
            }
            throw error
        }
    }
}

export default new EmployeesService()
