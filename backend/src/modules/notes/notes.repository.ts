import { prisma } from '../../shared/database/prisma.js'
import type { CreateNoteDTO, FindNotesDTO, NoteReferenceDTO, UpdateNoteDTO } from './notes.schema.js'

class NotesRepository {
    async folderExists(id: string) {
        return (await prisma.noteFolder.findUnique({ where: { id }, select: { id: true } })) !== null
    }

    async referenceExists(entityType: string, entityId: string) {
        switch (entityType) {
            case 'service':
                return (await prisma.service.findUnique({ where: { id: entityId }, select: { id: true } })) !== null
            case 'financial_transaction':
                return (await prisma.financialTransaction.findUnique({ where: { id: entityId }, select: { id: true } })) !== null
            case 'budget':
                return (await prisma.budget.findUnique({ where: { id: entityId }, select: { id: true } })) !== null
            case 'vehicle':
                return (await prisma.vehicle.findUnique({ where: { id: entityId }, select: { id: true } })) !== null
            case 'client':
                return (await prisma.client.findUnique({ where: { id: entityId }, select: { id: true } })) !== null
            case 'equipament':
                return (await prisma.equipament.findUnique({ where: { id: entityId }, select: { id: true } })) !== null
            case 'user':
                return (await prisma.user.findUnique({ where: { id: entityId }, select: { id: true } })) !== null
            default:
                return false
        }
    }

    async createNote(data: CreateNoteDTO, createdById: string) {
        return prisma.$transaction(async tx => {
            const note = await tx.note.create({
                data: {
                    title: data.title,
                    content: data.content,
                    happenedAt: data.happenedAt,
                    folderId: data.folderId,
                    createdById,
                    isPinned: data.isPinned,
                    isArchived: data.isArchived
                }
            })

            if (data.references?.length) {
                await tx.noteReference.createMany({
                    data: data.references.map(reference => ({ noteId: note.id, ...reference }))
                })
            }

            return tx.note.findUniqueOrThrow({
                where: { id: note.id },
                include: { folder: true, references: true }
            })
        })
    }

    async findNotes(filters: FindNotesDTO) {
        return prisma.note.findMany({
            where: {
                ...(filters.search && {
                    OR: [
                        { title: { contains: filters.search, mode: 'insensitive' } },
                        { content: { contains: filters.search, mode: 'insensitive' } }
                    ]
                }),
                ...(filters.folderId && { folderId: filters.folderId }),
                ...(filters.withoutFolder && { folderId: null }),
                ...(filters.isPinned !== undefined && { isPinned: filters.isPinned }),
                ...(filters.isArchived !== undefined && { isArchived: filters.isArchived }),
                ...(filters.happenedFrom || filters.happenedTo ? {
                    happenedAt: {
                        ...(filters.happenedFrom && { gte: filters.happenedFrom }),
                        ...(filters.happenedTo && { lte: filters.happenedTo })
                    }
                } : {}),
                ...(filters.referenceType || filters.referenceId ? {
                    references: {
                        some: {
                            ...(filters.referenceType && { entityType: filters.referenceType }),
                            ...(filters.referenceId && { entityId: filters.referenceId })
                        }
                    }
                } : {})
            },
            include: { folder: true, references: true },
            orderBy: [{ isPinned: 'desc' }, { updatedAt: 'desc' }]
        })
    }

    async findNoteById(id: string) {
        return prisma.note.findUnique({
            where: { id },
            include: { folder: true, references: true }
        })
    }

    async updateNote(id: string, data: UpdateNoteDTO) {
        return prisma.$transaction(async tx => {
            const { references, ...noteData } = data

            await tx.note.update({
                where: { id },
                data: noteData
            })

            if (references !== undefined) {
                await tx.noteReference.deleteMany({ where: { noteId: id } })
                if (references.length) {
                    await tx.noteReference.createMany({
                        data: references.map(reference => ({ noteId: id, ...reference }))
                    })
                }
            }

            return tx.note.findUniqueOrThrow({
                where: { id },
                include: { folder: true, references: true }
            })
        })
    }

    async deleteNote(id: string) {
        await prisma.note.delete({ where: { id } })
        return true
    }
}

export default new NotesRepository()
