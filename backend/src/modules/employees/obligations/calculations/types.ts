export type NumericValue = number | { toString(): string } | null

export type ObligationRecord = {
    id: string
    type: string
    title: string
    referenceStart: Date | null
    referenceEnd: Date | null
    dueDate: Date | null
    createdAt: Date
    originalValue: NumericValue
    finalValue: NumericValue
    status: string
    movements: { id: string; type: string; value: NumericValue }[]
    _count?: { movements: number }
}

export type SalaryHistoryEntry = {
    eventType: string
    eventDate: Date | null
    createdAt: Date
    metadata: unknown
}

export type EngagementCalculationContext = {
    id: string
    entryDate: Date | null
    exitDate: Date | null
    status: string
    currentSalary: NumericValue
    history: SalaryHistoryEntry[]
    obligations: ObligationRecord[]
    genericPayments?: { id: string; value: NumericValue }[]
}

export type CalculationPeriod = {
    startMonth: number
    startYear: number
    endMonth: number
    endYear: number
}

export type CalculationItem = {
    type: 'salario' | 'ferias' | 'decimo_terceiro'
    title: string
    referenceStart: Date
    referenceEnd: Date
    dueDate: Date | null
    estimatedValue: number | null
    calculation: string
    warnings: string[]
    requiresReview: boolean
    isProjection: boolean
    monthsWorked?: number
    concessionDeadline?: Date
}

export type CalculationResult = {
    items: CalculationItem[]
    warnings: string[]
}
