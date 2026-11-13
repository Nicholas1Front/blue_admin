import { AppError } from '../../../shared/errors/AppError.js'
import { isPrismaErrorCode } from '../../../shared/errors/isPrismaErrorCode.js'
import { tiposDeObrigacao, origensDaObrigacao } from '../shared/index.js'
import obligationsRepository from './obligations.repository.js'
import type { AtualizarObrigacaoDTO, CancelarObrigacaoDTO, CriarObrigacaoDTO, RevisarObrigacaoDTO } from './obligations.schema.js'

const executarComTratamentoDeConcorrencia = async <T>(operation: () => Promise<T>): Promise<T> => {
    try {
        return await operation()
    } catch (error) {
        if (isPrismaErrorCode(error, 'P2034')) {
            throw new AppError('The obligation changed concurrently. Refresh the data and try again.', 409, 'OBLIGATION_CONCURRENT_UPDATE')
        }
        throw error
    }
}

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

        try {
            return await obligationsRepository.create(data, createdById)
        } catch (error) {
            if (isPrismaErrorCode(error, 'P2002')) {
                throw new AppError('An obligation already exists for this engagement and reference key', 409, 'OBLIGATION_REFERENCE_ALREADY_EXISTS')
            }
            throw error
        }
    }

    async update(id: string, data: AtualizarObrigacaoDTO, createdById: string) {
        const current = await obligationsRepository.findById(id)
        if (!current) throw new AppError('Obligation not found', 404, 'OBLIGATION_NOT_FOUND')

        if (
            current.status !== 'em_revisao' &&
            data.referenceKey !== undefined &&
            data.referenceKey !== current.referenceKey
        ) {
            throw new AppError('A confirmed obligation reference key cannot be changed', 409, 'OBLIGATION_REFERENCE_IMMUTABLE')
        }

        const effectiveStart = data.referenceStart !== undefined ? data.referenceStart : current.referenceStart
        const effectiveEnd = data.referenceEnd !== undefined ? data.referenceEnd : current.referenceEnd
        if (effectiveStart && effectiveEnd && effectiveEnd < effectiveStart) {
            throw new AppError('Reference end date cannot be before its start date', 400, 'INVALID_OBLIGATION_PERIOD')
        }

        try {
            return await executarComTratamentoDeConcorrencia(async () => {
                const updated = await obligationsRepository.update(id, data, createdById)
                if (!updated) throw new AppError('Obligation not found', 404, 'OBLIGATION_NOT_FOUND')
                return updated
            })
        } catch (error) {
            if (isPrismaErrorCode(error, 'P2002')) {
                throw new AppError('An obligation already exists for this engagement and reference key', 409, 'OBLIGATION_REFERENCE_ALREADY_EXISTS')
            }
            throw error
        }
    }

    async review(id: string, data: RevisarObrigacaoDTO, reviewedById: string) {
        const current = await obligationsRepository.findById(id)
        if (!current) throw new AppError('Obligation not found', 404, 'OBLIGATION_NOT_FOUND')
        if (current.status !== 'em_revisao') {
            throw new AppError('Only obligations under review can be confirmed', 409, 'OBLIGATION_NOT_UNDER_REVIEW')
        }
        return executarComTratamentoDeConcorrencia(() => obligationsRepository.review(id, data, reviewedById))
    }

    async cancel(id: string, data: CancelarObrigacaoDTO, createdById: string) {
        const current = await obligationsRepository.findById(id)
        if (!current) throw new AppError('Obligation not found', 404, 'OBLIGATION_NOT_FOUND')
        if (current.status === 'pago' || current.status === 'cancelado' || await obligationsRepository.hasAllocations(id)) {
            throw new AppError('An obligation with payments cannot be canceled directly', 409, 'OBLIGATION_CANNOT_BE_CANCELED')
        }
        return executarComTratamentoDeConcorrencia(() => obligationsRepository.cancel(id, data.reason, createdById))
    }
}

export default new ObligationsService()
