import { AppError } from '../../../shared/errors/AppError.js'
import movementsRepository from './movements.repository.js'
import type { CriarMovimentacaoDTO } from './movements.schema.js'

class MovementsService {
    async create(data: CriarMovimentacaoDTO, createdById: string) {
        const engagement = await movementsRepository.engagementExists(data.engagementId)
        if (!engagement) throw new AppError('Engagement not found', 404, 'ENGAGEMENT_NOT_FOUND')

        if (data.obligationId) {
            const obligation = await movementsRepository.obligationBelongsToEngagement(data.obligationId, data.engagementId)
            if (!obligation) {
                throw new AppError('The selected obligation does not belong to this engagement', 400, 'OBLIGATION_ENGAGEMENT_MISMATCH')
            }
        }

        return movementsRepository.create(data, createdById)
    }
}

export default new MovementsService()
