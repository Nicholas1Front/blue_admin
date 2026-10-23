import {prisma} from '../../../shared/database/prisma.js'

class TransactionsRepository{
    async findTransactionById(id : string){
        const transaction = await prisma.financialTransaction.findUnique({
            where : {id}
        })

        return transaction
    }

    async findServiceById(id : string){
        const service = await prisma.service.findUnique({
            where : {id}
        })

        return service
    }

    async updateTransactionOrigin(
        id : string,
        originId : string | null,
        originType : string | null
    ){
        const transaction = await prisma.financialTransaction.update({
            where : {id},
            data : {
                originId,
                originType
            }
        })

        return transaction
    }

    async findAllTransactionsByServiceId(
        serviceId : string
    ){
        const transactions = await prisma.financialTransaction.findMany({
            where : {
                originId : serviceId
            }
        })

        return transactions
    }
}

export default new TransactionsRepository()