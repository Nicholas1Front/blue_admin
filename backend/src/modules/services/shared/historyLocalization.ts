type HistoryRecord = {
    eventType: string
    description: string
}

const legacyEventTypes: Record<string, string> = {
    service_created: "servico_criado",
    service_updated: "servico_atualizado",
    service_status_updated: "status_servico_atualizado",
    activity_created: "atividade_criada",
    activity_updated: "atividade_atualizada",
    activity_deleted: "atividade_excluida",
    transaction_linked: "lancamento_vinculado",
    transaction_unlinked: "lancamento_desvinculado",
    tithe_paid: "dizimo_pago",
    tithe_removed: "dizimo_desvinculado"
}

const legacyDescriptionPrefixes: Array<[string, string]> = [
    ["Activity created: ", "Atividade criada: "],
    ["Activity updated: ", "Atividade atualizada: "],
    ["Activity deleted: ", "Atividade excluída: "],
    ["Financial transaction ", "Lançamento financeiro "],
    ["Tithe transaction", "Lançamento do dízimo"]
]

const changedFieldLabels: Record<string, string> = {
    title: "título",
    description: "descrição",
    startAt: "data de início",
    endAt: "data de término",
    status: "status"
}

export function normalizeHistoryRecord<T extends HistoryRecord>(record: T): T {
    let description = record.description

    for (const [legacyPrefix, portuguesePrefix] of legacyDescriptionPrefixes) {
        if (description.startsWith(legacyPrefix)) {
            description = portuguesePrefix + description.slice(legacyPrefix.length)
            break
        }
    }

    description = description
        .replace(" linked to service.", " vinculado ao serviço.")
        .replace(" unlinked from service.", " desvinculado do serviço.")
        .replace(" linked - transaction : ", " vinculado. Lançamento: ")
        .replace(" unlinked - transaction : ", " desvinculado. Lançamento: ")
        .replace(" Changed fields: ", " Campos alterados: ")

    const changedFieldsMarker = "Campos alterados: "
    const changedFieldsIndex = description.indexOf(changedFieldsMarker)

    if (changedFieldsIndex >= 0) {
        const prefix = description.slice(0, changedFieldsIndex + changedFieldsMarker.length)
        const fields = description
            .slice(changedFieldsIndex + changedFieldsMarker.length)
            .replace(/\.$/, "")
            .split(",")
            .map(field => changedFieldLabels[field.trim()] ?? field.trim())
        description = prefix + fields.join(", ") + "."
    }

    return {
        ...record,
        eventType: legacyEventTypes[record.eventType] ?? record.eventType,
        description
    }
}

export function normalizeHistoryRecords<T extends HistoryRecord>(records: T[]): T[] {
    return records.map(normalizeHistoryRecord)
}
