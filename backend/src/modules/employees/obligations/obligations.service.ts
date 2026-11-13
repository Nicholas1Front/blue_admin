import { AppError } from '../../../shared/errors/AppError.js'
import { statusDaObrigacao, tiposDeObrigacao, origensDaObrigacao } from '../shared/index.js'
import obligationsRepository from './obligations.repository.js'
import type { AtualizarObrigacaoDTO, CancelarObrigacaoDTO, CriarObrigacaoDTO, RevisarObrigacaoDTO } from './obligations.schema.js'

class ObligationsService {
    async create(data: CriarObrigacaoDTO, createdById: string) {
        const engagement = await obligationsRepository.engagementExists(data.engagementId)
        if (!engagement) throw new AppError('Engagement not found', 404, 'ENGAGEMENT_NOT_FOUND')
        if (!tiposDeObrigacao.includes(data.type) || !origensDaObrigacao.includes(data.source)) {
            throw new AppError('Invalid obligation type or source', 400, 'INVALID_OBLIGATION_DATA')
        }
        if (data.referenceStart && data.referenceEnd && data.referenceEnd < data.referenceStart) {
            throw new AppError('Reference end date cannot be before its start date', 400, 'INVALID_OBLIGATION_PERIOD')
        }

        return obligationsRepository.create(data, createdById)
    }

    async update(id: string, data: AtualizarObrigacaoDTO, createdById: string) {
        const current = await obligationsRepository.findById(id)
        if (!current) throw new AppError('Obligation not found', 404, 'OBLIGATION_NOT_FOUND')
        if (current.status === 'pago' || current.status === 'cancelado') {
            throw new AppError('Paid or canceled obligations cannot be edited', 409, 'OBLIGATION_NOT_EDITABLE')
        }
        if (await obligationsRepository.hasAllocations(id) && data.originalValue !== undefined) {
            throw new AppError('An obligation with payment allocations cannot have its original value changed', 409, 'OBLIGATION_HAS_ALLOCATIONS')
        }

        const effectiveStart = data.referenceStart !== undefined ? data.referenceStart : current.referenceStart
        const effectiveEnd = data.referenceEnd !== undefined ? data.referenceEnd : current.referenceEnd
        if (effectiveStart && effectiveEnd && effectiveEnd < effectiveStart) {
            throw new AppError('Reference end date cannot be before its start date', 400, 'INVALID_OBLIGATION_PERIOD')
        }

        const updated = await obligationsRepository.update(id, data, createdById)
        if (!updated) throw new AppError('Obligation not found', 404, 'OBLIGATION_NOT_FOUND')
        return updated
    }

    async review(id: string, data: RevisarObrigacaoDTO, reviewedById: string) {
        const current = await obligationsRepository.findById(id)
        if (!current) throw new AppError('Obligation not found', 404, 'OBLIGATION_NOT_FOUND')
        if (current.status !== 'em_revisao') {
            throw new AppError('Only obligations under review can be confirmed', 409, 'OBLIGATION_NOT_UNDER_REVIEW')
        }
        return obligationsRepository.review(id, data, reviewedById)
    }

    async cancel(id: string, data: CancelarObrigacaoDTO, createdById: string) {
        const current = await obligationsRepository.findById(id)
        if (!current) throw new AppError('Obligation not found', 404, 'OBLIGATION_NOT_FOUND')
        if (statusDaObrigacao.includes(current.status as typeof statusDaObrigacao[number]) === false) {
            throw new AppError('Invalid obligation status', 409, 'INVALID_OBLIGATION_STATUS')
        }
        if (current.status === 'pago' || current.status === 'cancelado' || await obligationsRepository.hasAllocations(id)) {
            throw new AppError('An obligation with payments cannot be canceled directly', 409, 'OBLIGATION_CANNOT_BE_CANCELED')
        }
        return obligationsRepository.cancel(id, data.reason, createdById)
    }
}

export default new ObligationsService()
