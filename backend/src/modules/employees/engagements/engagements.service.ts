import { AppError } from '../../../shared/errors/AppError.js'
import { modalidadesDeVinculo, statusDoVinculo } from '../shared/index.js'
import engagementsRepository from './engagements.repository.js'
import type { AtualizarVinculoDTO, CriarVinculoDTO, EncerrarVinculoDTO } from './engagements.schema.js'

const validarPeriodo = (inicio: Date, fim?: Date | null) => {
    if (fim && fim < inicio) {
        throw new AppError('Engagement end date cannot be before its start date', 400, 'INVALID_ENGAGEMENT_PERIOD')
    }
}

class EngagementsService {
    async create(data: CriarVinculoDTO, createdById: string) {
        const employee = await engagementsRepository.employeeExists(data.employeeId)
        if (!employee) throw new AppError('Employee not found', 404, 'EMPLOYEE_NOT_FOUND')

        if (!modalidadesDeVinculo.includes(data.modality) || !statusDoVinculo.includes(data.status)) {
            throw new AppError('Invalid engagement modality or status', 400, 'INVALID_ENGAGEMENT_DATA')
        }

        validarPeriodo(data.entryDate, data.exitDate)
        if (data.status === 'encerrado' && !data.exitDate) {
            throw new AppError('An ended engagement must have an end date', 400, 'ENGAGEMENT_END_DATE_REQUIRED')
        }
        if (data.status !== 'encerrado' && data.exitDate) {
            throw new AppError('Only an ended engagement can have an end date', 400, 'ENGAGEMENT_STATUS_CONFLICT')
        }

        return engagementsRepository.create(data, createdById)
    }

    async update(id: string, data: AtualizarVinculoDTO, createdById: string) {
        const current = await engagementsRepository.findById(id)
        if (!current) throw new AppError('Engagement not found', 404, 'ENGAGEMENT_NOT_FOUND')

        const effectiveEntryDate = data.entryDate ?? current.entryDate
        const effectiveExitDate = data.exitDate !== undefined ? data.exitDate : current.exitDate
        const effectiveStatus = data.status ?? current.status
        validarPeriodo(effectiveEntryDate, effectiveExitDate)

        if (effectiveStatus === 'encerrado' && !effectiveExitDate) {
            throw new AppError('An ended engagement must have an end date', 400, 'ENGAGEMENT_END_DATE_REQUIRED')
        }
        if (effectiveStatus !== 'encerrado' && effectiveExitDate) {
            throw new AppError('Only an ended engagement can have an end date', 400, 'ENGAGEMENT_STATUS_CONFLICT')
        }

        const updated = await engagementsRepository.update(id, data, createdById)
        if (!updated) throw new AppError('Engagement not found', 404, 'ENGAGEMENT_NOT_FOUND')
        return updated
    }

    async close(id: string, data: EncerrarVinculoDTO, createdById: string) {
        const current = await engagementsRepository.findById(id)
        if (!current) throw new AppError('Engagement not found', 404, 'ENGAGEMENT_NOT_FOUND')
        if (data.exitDate < current.entryDate) {
            throw new AppError('Engagement end date cannot be before its start date', 400, 'INVALID_ENGAGEMENT_PERIOD')
        }
        if (current.status === 'encerrado') {
            throw new AppError('Engagement is already ended', 409, 'ENGAGEMENT_ALREADY_ENDED')
        }

        const updated = await engagementsRepository.close(id, data, createdById)
        if (!updated) throw new AppError('Engagement not found', 404, 'ENGAGEMENT_NOT_FOUND')
        return updated
    }
}

export default new EngagementsService()
