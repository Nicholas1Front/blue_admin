import { prisma } from '../../shared/database/prisma.js'
import type { CreateNoteDTO, FindNotesDTO, UpdateNoteDTO } from './notes.schema.js'

const notificationExpiry = () => {
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)
    return expiresAt
}

const notificationMessage = (content: string) => content.slice(0, 180)

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
            const { references, notifyUsers, ...noteData } = data
            const note = await tx.note.create({
                data: {
                    ...noteData,
                    createdById
                }
            })

            if (references?.length) {
                await tx.noteReference.createMany({
                    data: references.map(reference => ({ noteId: note.id, ...reference }))
                })
            }

            if (notifyUsers) {
                await tx.notification.create({
                    data: {
                        noteId: note.id,
                        createdById,
                        title: note.title,
                        message: notificationMessage(note.content),
                        expiresAt: notificationExpiry()
                    }
                })
            }

            return tx.note.findUniqueOrThrow({
                where: { id: note.id },
                include: { folder: true, references: true, notification: true }
            })
        })
    }

    async findNotes(filters: FindNotesDTO) {
        const {
            page,
            limit,
            ...criteria
        } = filters

        const where = {
            ...(criteria.search && {
                OR: [
                    { title: { contains: criteria.search, mode: 'insensitive' as const } },
                    { content: { contains: criteria.search, mode: 'insensitive' as const } }
                ]
            }),
            ...(criteria.folderId && { folderId: criteria.folderId }),
            ...(criteria.withoutFolder && { folderId: null }),
            ...(criteria.isPinned !== undefined && { isPinned: criteria.isPinned }),
            ...(criteria.isArchived !== undefined && { isArchived: criteria.isArchived }),
            ...(criteria.happenedFrom || criteria.happenedTo ? {
                happenedAt: {
                    ...(criteria.happenedFrom && { gte: criteria.happenedFrom }),
                    ...(criteria.happenedTo && { lte: criteria.happenedTo })
                }
            } : {}),
            ...(criteria.referenceType || criteria.referenceId ? {
                references: {
                    some: {
                        ...(criteria.referenceType && { entityType: criteria.referenceType }),
                        ...(criteria.referenceId && { entityId: criteria.referenceId })
                    }
                }
            } : {})
        }

        const [items, total] = await prisma.$transaction([
            prisma.note.findMany({
                where,
                include: { folder: true, references: true },
                orderBy: [{ isPinned: 'desc' }, { updatedAt: 'desc' }],
                skip: (page - 1) * limit,
                take: limit
            }),
            prisma.note.count({ where })
        ])

        return {
            items,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        }
    }

    async findNotesDashboard() {
        const [folders, latestNotes, notesWithoutFolder, totalNotes] = await prisma.$transaction([
            prisma.noteFolder.findMany({
                include: { _count: { select: { notes: { where: { isArchived: false } } } } },
                orderBy: { name: 'asc' }
            }),
            prisma.note.findMany({
                where: { isArchived: false },
                include: { folder: true, references: true },
                orderBy: [{ isPinned: 'desc' }, { updatedAt: 'desc' }],
                take: 8
            }),
            prisma.note.count({ where: { folderId: null, isArchived: false } }),
            prisma.note.count({ where: { isArchived: false } })
        ])

        return { folders, latestNotes, notesWithoutFolder, totalNotes }
    }

    async findNoteById(id: string) {
        return prisma.note.findUnique({
            where: { id },
            include: { folder: true, references: true, notification: true }
        })
    }

    async updateNote(id: string, data: UpdateNoteDTO) {
        return prisma.$transaction(async tx => {
            const { references, notifyUsers, ...fields } = data
            const noteData = {
                ...(fields.title !== undefined && { title: fields.title }),
                ...(fields.content !== undefined && { content: fields.content }),
                ...(fields.happenedAt !== undefined && { happenedAt: fields.happenedAt }),
                ...(fields.folderId !== undefined && { folderId: fields.folderId }),
                ...(fields.isPinned !== undefined && { isPinned: fields.isPinned }),
                ...(fields.isArchived !== undefined && { isArchived: fields.isArchived })
            }

            const updatedNote = await tx.note.update({
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

            if (notifyUsers === true) {
                await tx.notification.upsert({
                    where: { noteId: id },
                    create: {
                        noteId: id,
                        createdById: updatedNote.createdById,
                        title: updatedNote.title,
                        message: notificationMessage(updatedNote.content),
                        expiresAt: notificationExpiry()
                    },
                    update: {
                        title: updatedNote.title,
                        message: notificationMessage(updatedNote.content),
                        expiresAt: notificationExpiry()
                    }
                })
            } else if (notifyUsers === false) {
                await tx.notification.deleteMany({ where: { noteId: id } })
            }

            return tx.note.findUniqueOrThrow({
                where: { id },
                include: { folder: true, references: true, notification: true }
            })
        })
    }

    async deleteNote(id: string) {
        await prisma.note.delete({ where: { id } })
        return true
    }
}

export default new NotesRepository()
