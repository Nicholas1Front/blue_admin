import movementsRepository from './movements.repository.js'
import type { CriarMovimentacaoDTO, EstornarMovimentacaoDTO } from './movements.schema.js'

class MovementsService {
    create(data: CriarMovimentacaoDTO, createdById: string) {
        return movementsRepository.create(data, createdById)
    }

    reverse(id: string, data: EstornarMovimentacaoDTO, createdById: string) {
        return movementsRepository.reverse(id, data, createdById)
    }
}

export default new MovementsService()
