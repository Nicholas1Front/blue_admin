import {z} from 'zod';

export const updateTransactionsOriginSchema = z.object({
    id : z.string().min(1)
})

//DTos

export type updateTransactionsOriginDTO = z.infer<typeof updateTransactionsOriginSchema>