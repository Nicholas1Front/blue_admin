import { Prisma } from '../../../generated/prisma/client.js'
import { AppError } from '../../../shared/errors/AppError.js'
import allocationsRepository from './allocations.repository.js'
import type { AplicarAdiantamentoDTO, RegistrarPagamentoDTO } from './allocations.schema.js'

class AllocationsService {
    registerPayment(data: RegistrarPagamentoDTO, createdById: string) {
        const total = data.allocations.reduce(
            (sum, item) => sum.plus(new Prisma.Decimal(item.value)),
            new Prisma.Decimal(data.advanceCreditValue)
        )
        if (!total.equals(new Prisma.Decimal(data.value))) {
            throw new AppError('The payment must be fully allocated', 400, 'PAYMENT_NOT_FULLY_ALLOCATED')
        }

        return allocationsRepository.registerPayment(data, createdById)
    }

    applyAdvance(data: AplicarAdiantamentoDTO, createdById: string) {
        return allocationsRepository.applyAdvance(data, createdById)
    }
}

export default new AllocationsService()
