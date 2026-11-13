import { Prisma } from '../../../generated/prisma/client.js'
import { AppError } from '../../../shared/errors/AppError.js'
import { isPrismaErrorCode } from '../../../shared/errors/isPrismaErrorCode.js'
import allocationsRepository from './allocations.repository.js'
import type { AplicarAdiantamentoDTO, RegistrarPagamentoDTO } from './allocations.schema.js'

const executarComTratamentoDeConcorrencia = async <T>(operation: () => Promise<T>): Promise<T> => {
    try {
        return await operation()
    } catch (error) {
        if (isPrismaErrorCode(error, 'P2034')) {
            throw new AppError('The employee balance changed concurrently. Refresh the data and try again.', 409, 'EMPLOYEE_BALANCE_CONCURRENT_UPDATE')
        }
        throw error
    }
}

class AllocationsService {
    registerPayment(data: RegistrarPagamentoDTO, createdById: string) {
        const total = data.allocations.reduce(
            (sum, item) => sum.plus(new Prisma.Decimal(item.value)),
            new Prisma.Decimal(data.advanceCreditValue)
        )
        if (!total.equals(new Prisma.Decimal(data.value))) {
            throw new AppError('The payment must be fully allocated', 400, 'PAYMENT_NOT_FULLY_ALLOCATED')
        }

        return executarComTratamentoDeConcorrencia(() => allocationsRepository.registerPayment(data, createdById))
    }

    applyAdvance(data: AplicarAdiantamentoDTO, createdById: string) {
        return executarComTratamentoDeConcorrencia(() => allocationsRepository.applyAdvance(data, createdById))
    }
}

export default new AllocationsService()
