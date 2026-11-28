import { prisma } from '../../../shared/database/prisma.js'
import type { FindNotesByDayDTO } from './queries.schema.js'

const getCurrentBrazilDate = () => {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Sao_Paulo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).formatToParts(new Date())
    const values = Object.fromEntries(parts.map(part => [part.type, part.value]))
    return `${values.year}-${values.month}-${values.day}`
}

const getBrazilDayRange = (date: string) => {
    const [year, month, day] = date.split('-').map(Number)
    const nextDay = new Date(Date.UTC(year, month - 1, day + 1))
    const nextDate = [
        nextDay.getUTCFullYear(),
        String(nextDay.getUTCMonth() + 1).padStart(2, '0'),
        String(nextDay.getUTCDate()).padStart(2, '0')
    ].join('-')

    return {
        start: new Date(`${date}T00:00:00.000-03:00`),
        end: new Date(`${nextDate}T00:00:00.000-03:00`)
    }
}

class NotesQueriesRepository {
    async findHome() {
        const [folders, latestNotes, notesWithoutFolder, totalNotes] = await prisma.$transaction([
            prisma.noteFolder.findMany({
                include: { _count: { select: { notes: { where: { isArchived: false } } } } },
                orderBy: { name: 'asc' }
            }),
            prisma.note.findMany({
                where: { isArchived: false },
                include: { folder: true, references: true },
                orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
                take: 8
            }),
            prisma.note.count({ where: { folderId: null, isArchived: false } }),
            prisma.note.count({ where: { isArchived: false } })
        ])

        return { folders, latestNotes, notesWithoutFolder, totalNotes }
    }

    async findByDay(filters: FindNotesByDayDTO) {
        const date = filters.date ?? getCurrentBrazilDate()
        const { start, end } = getBrazilDayRange(date)
        const where = {
            isArchived: false,
            happenedAt: { gte: start, lt: end }
        }

        const [items, total] = await prisma.$transaction([
            prisma.note.findMany({
                where,
                include: { folder: true, references: true },
                orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
                skip: (filters.page - 1) * filters.limit,
                take: filters.limit
            }),
            prisma.note.count({ where })
        ])

        return {
            date,
            items,
            pagination: {
                page: filters.page,
                limit: filters.limit,
                total,
                totalPages: Math.ceil(total / filters.limit)
            }
        }
    }
}

export default new NotesQueriesRepository()
