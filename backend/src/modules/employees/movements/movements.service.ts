import { AppError } from '../../../shared/errors/AppError.js'
import { statusDaJustificativa } from '../shared/index.js'
import movementsRepository from './movements.repository.js'
import type { CriarMovimentacaoDTO } from './movements.schema.js'

class MovementsService {
    async create(data: CriarMovimentacaoDTO, createdById: string) {
        const engagement = await movementsRepository.engagementExists(data.engagementId)
        if (!engagement) throw new AppError('Engagement not found', 404, 'ENGAGEMENT_NOT_FOUND')

        if (data.justificationStatus && !statusDaJustificativa.includes(data.justificationStatus)) {
            throw new AppError('Invalid justification status', 400, 'INVALID_JUSTIFICATION_STATUS')
        }

        if (data.obligationId) {
            const obligation = await movementsRepository.obligationBelongsToEngagement(data.obligationId, data.engagementId)
            if (!obligation) {
                throw new AppError('The selected obligation does not belong to this engagement', 400, 'OBLIGATION_ENGAGEMENT_MISMATCH')
            }
        }

        if (data.type === 'falta' && data.justificationStatus === 'justificada') {
            // A justificativa é registrada; não há desconto nem alteração automática na obrigação.
        }

        return movementsRepository.create(data, createdById)
    }
}

export default new MovementsService()
