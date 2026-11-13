import { z } from 'zod'
import {
    modalidadesDeVinculo,
    statusDoVinculo,
    motivosDeEncerramento,
    tiposDeAvisoPrevio
} from '../shared/index.js'

const nullableDate = z.coerce.date().nullable().optional()
const nullableText = (max: number) => z.string().trim().max(max).nullable().optional()

export const criarVinculoSchema = z.object({
    employeeId: z.string().uuid(),
    entryDate: z.coerce.date(),
    exitDate: nullableDate,
    position: nullableText(120),
    currentSalary: z.coerce.number().min(0).nullable().optional(),
    dailyHours: z.coerce.number().positive().max(24).nullable().optional(),
    modality: z.enum(modalidadesDeVinculo),
    status: z.enum(statusDoVinculo).default('ativo'),
    terminationReason: z.enum(motivosDeEncerramento).nullable().optional(),
    noticeType: z.enum(tiposDeAvisoPrevio).nullable().optional(),
    noticeDate: nullableDate,
    noticeEndDate: nullableDate,
    observations: nullableText(2000)
})

export const atualizarVinculoSchema = z.object({
    entryDate: z.coerce.date().optional(),
    exitDate: nullableDate,
    position: nullableText(120),
    currentSalary: z.coerce.number().min(0).nullable().optional(),
    dailyHours: z.coerce.number().positive().max(24).nullable().optional(),
    modality: z.enum(modalidadesDeVinculo).optional(),
    status: z.enum(statusDoVinculo).optional(),
    terminationReason: z.enum(motivosDeEncerramento).nullable().optional(),
    noticeType: z.enum(tiposDeAvisoPrevio).nullable().optional(),
    noticeDate: nullableDate,
    noticeEndDate: nullableDate,
    observations: nullableText(2000),
    effectiveDate: z.coerce.date().optional()
}).refine(data => Object.keys(data).some(key => key !== 'effectiveDate'), {
    message: 'Informe ao menos um campo para atualizar o vínculo.'
})

export const encerrarVinculoSchema = z.object({
    exitDate: z.coerce.date(),
    terminationReason: z.enum(motivosDeEncerramento),
    noticeType: z.enum(tiposDeAvisoPrevio).nullable().optional(),
    noticeDate: nullableDate,
    noticeEndDate: nullableDate,
    observations: nullableText(2000)
})

export type CriarVinculoDTO = z.infer<typeof criarVinculoSchema>
export type AtualizarVinculoDTO = z.infer<typeof atualizarVinculoSchema>
export type EncerrarVinculoDTO = z.infer<typeof encerrarVinculoSchema>
