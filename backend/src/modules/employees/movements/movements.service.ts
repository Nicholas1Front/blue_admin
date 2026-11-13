import movementsRepository from './movements.repository.js'
import type { CriarMovimentacaoDTO } from './movements.schema.js'

class MovementsService {
    create(data: CriarMovimentacaoDTO, createdById: string) {
        return movementsRepository.create(data, createdById)
    }
}

export default new MovementsService()
