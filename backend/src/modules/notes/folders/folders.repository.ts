import { prisma } from '../../../shared/database/prisma.js'
import type { CreateFolderDTO, UpdateFolderDTO } from './folders.schema.js'

class FoldersRepository {
    async create(data: CreateFolderDTO, createdById: string) {
        return prisma.noteFolder.create({
            data: {
                name: data.name,
                description: data.description ?? null,
                createdById
            },
            include: { _count: { select: { notes: { where: { isArchived: false } } } } }
        })
    }

    async findAll() {
        return prisma.noteFolder.findMany({
            include: { _count: { select: { notes: { where: { isArchived: false } } } } },
            orderBy: { name: 'asc' }
        })
    }

    async findById(id: string) {
        return prisma.noteFolder.findUnique({
            where: { id },
            include: { _count: { select: { notes: { where: { isArchived: false } } } } }
        })
    }

    async findByName(name: string) {
        return prisma.noteFolder.findUnique({ where: { name }, select: { id: true } })
    }

    async update(id: string, data: UpdateFolderDTO) {
        return prisma.noteFolder.update({
            where: { id },
            data: {
                ...(data.name !== undefined && { name: data.name }),
                ...(data.description !== undefined && { description: data.description })
            },
            include: { _count: { select: { notes: { where: { isArchived: false } } } } }
        })
    }

    async delete(id: string) {
        await prisma.noteFolder.delete({ where: { id } })
        return true
    }
}

export default new FoldersRepository()
