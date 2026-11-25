import { AppError } from '../../../../shared/errors/AppError.js'
import engagementFinancialSummaryRepository from '../repositories/engagement-financial-summary.repository.js'

class EngagementFinancialSummaryService {
    async findEngagementFinancialSummary(engagementId: string) {
        const summary = await engagementFinancialSummaryRepository.findEngagementFinancialSummary(engagementId)
        if (!summary) throw new AppError('Engagement not found', 404, 'ENGAGEMENT_NOT_FOUND')
        return summary
    }
}

export default new EngagementFinancialSummaryService()
