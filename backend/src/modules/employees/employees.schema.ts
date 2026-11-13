import { z } from 'zod'

const documentoSchema = z.string().trim().nullable().optional()

export const criarColaboradorSchema = z.object({
    name: z.string().trim().min(2).max(160),
    cpfCnpj: documentoSchema,
    address: z.string().trim().max(500).nullable().optional(),
    birthDate: z.coerce.date().nullable().optional(),
    observations: z.string().trim().max(2000).nullable().optional()
})

export const atualizarColaboradorSchema = z.object({
    name: z.string().trim().min(2).max(160).optional(),
    cpfCnpj: documentoSchema,
    address: z.string().trim().max(500).nullable().optional(),
    birthDate: z.coerce.date().nullable().optional(),
    observations: z.string().trim().max(2000).nullable().optional()
}).refine(data => Object.keys(data).length > 0, {
    message: 'Informe ao menos um campo para atualizar o colaborador.'
})

export type CriarColaboradorDTO = z.infer<typeof criarColaboradorSchema>
export type AtualizarColaboradorDTO = z.infer<typeof atualizarColaboradorSchema>
