import { AppError } from '../../../shared/errors/AppError.js'
import { isPrismaErrorCode } from '../../../shared/errors/isPrismaErrorCode.js'
import movementsRepository from './movements.repository.js'
import type { CriarMovimentacaoDTO, EstornarMovimentacaoDTO } from './movements.schema.js'

class MovementsService {
    async create(data: CriarMovimentacaoDTO, createdById: string) {
        try {
            return await movementsRepository.create(data, createdById)
        } catch (error) {
            if (isPrismaErrorCode(error, 'P2034')) {
                throw new AppError('The employee balance changed concurrently. Refresh and try again.', 409, 'EMPLOYEE_MOVEMENT_CONCURRENT_UPDATE')
            }
            throw error
        }
    }

    async reverse(id: string, data: EstornarMovimentacaoDTO, createdById: string) {
        try {
            return await movementsRepository.reverse(id, data, createdById)
        } catch (error) {
            if (isPrismaErrorCode(error, 'P2034')) {
                throw new AppError('The employee balance changed concurrently. Refresh and try again.', 409, 'EMPLOYEE_MOVEMENT_CONCURRENT_UPDATE')
            }
            throw error
        }
    }
}

export default new MovementsService()
