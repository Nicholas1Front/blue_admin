import {prisma} from '../../../shared/database/prisma.js';

class ExpensesRepository {
    async createExpense(
        name : string,
        description : string | null,
        expectedValue : number,
        dueData : Date | null,
        notes : string | null
    ){
        const expense = await prisma.monthlyExpense.create({
            data : {
                name,
                description,
                expectedValue,
                dueData,
                notes,
                active : true
            }
        })

        return expense
    }

    async updateExpense(
        id : string,
        data : any
    ){
        const expense = await prisma.monthlyExpense.update({
            where : {
                id
            },
            data : {
                name : data.name,
                description : data.description,
                expectedValue : data.expectedValue,
                dueData : data.dueData,
                notes : data.notes
            }
        })

        return expense
    }

    async findExpenseById(id : string){
        return prisma.monthlyExpense.findUnique({
            where : { id }
        })
    }

    async findExpensesByFilters(
        id : string | undefined,
        name : string | undefined,
        description : string | null | undefined,
        expectedValue : number | undefined,
        dueData : Date | null | undefined,
        notes : string | null | undefined,
        active : boolean | undefined
    ){
        const expenses = await prisma.monthlyExpense.findMany({
            where : {
                ...(id !== undefined && {
                    id : {
                        contains : id,
                        mode : 'insensitive'
                    }
                }),
                ...(name !== undefined && {
                    name : {
                        contains : name,
                        mode : 'insensitive'
                    }
                }),
                ...(description !== undefined && (
                    description === null
                        ? { description : null }
                        : {
                            description : {
                                contains : description,
                                mode : 'insensitive'
                            }
                        }
                )),
                ...(expectedValue !== undefined && { expectedValue : expectedValue, mode : 'insensitive' }),
                ...(dueData !== undefined && { dueData : dueData, mode : 'insensitive' }),
                ...(notes !== undefined && (
                    notes === null
                        ? { notes : null }
                        : {
                            notes : {
                                contains : notes,
                                mode : 'insensitive'
                            }
                        }
                )),
                ...(active !== undefined && { active : active, mode : 'insensitive' })
            }
        })
        
        return expenses
    }

    async findAllExpenses(){
        const expenses = await prisma.monthlyExpense.findMany()

        return expenses
    }

    async deactivateExpense(id : string){
        return prisma.monthlyExpense.update({
            where : { id },
            data : { active : false }
        })
    }

    async activateExpense(id : string){
        return prisma.monthlyExpense.update({
            where : { id },
            data : { active : true }
        })
    }

    async deleteExpense(id : string){
        return prisma.monthlyExpense.delete({
            where : { id }
        })
    }
}

export default new ExpensesRepository();