import { AppError } from '../../shared/errors/AppError.js'
import notesRepository from './notes.repository.js'
import type { CreateNoteDTO, FindNotesDTO, UpdateNoteDTO } from './notes.schema.js'

class NotesService {
    private async validateFolder(folderId: string | null | undefined) {
        if (folderId && !(await notesRepository.folderExists(folderId))) {
            throw new AppError('Folder not found', 404, 'FOLDER_NOT_FOUND')
        }
    }

    private async validateReferences(references: CreateNoteDTO['references']) {
        if (!references) return

        for (const reference of references) {
            const exists = await notesRepository.referenceExists(reference.entityType, reference.entityId)
            if (!exists) {
                throw new AppError(
                    `Referenced ${reference.entityType} not found`,
                    404,
                    'NOTE_REFERENCE_NOT_FOUND'
                )
            }
        }
    }

    async create(data: CreateNoteDTO, userId: string) {
        await this.validateFolder(data.folderId)
        await this.validateReferences(data.references)
        return notesRepository.createNote(data, userId)
    }

    async find(filters: FindNotesDTO) {
        if (filters.folderId && filters.withoutFolder) {
            throw new AppError('Choose a folder or notes without a folder', 400, 'INVALID_NOTE_FOLDER_FILTER')
        }
        if (filters.happenedFrom && filters.happenedTo && filters.happenedFrom > filters.happenedTo) {
            throw new AppError('Start date cannot be after end date', 400, 'INVALID_NOTE_DATE_RANGE')
        }
        return notesRepository.findNotes(filters)
    }

    async findById(id: string) {
        const note = await notesRepository.findNoteById(id)
        if (!note) throw new AppError('Note not found', 404, 'NOTE_NOT_FOUND')
        return note
    }

    async update(id: string, data: UpdateNoteDTO) {
        await this.findById(id)
        await this.validateFolder(data.folderId)
        await this.validateReferences(data.references)
        return notesRepository.updateNote(id, data)
    }

    async delete(id: string) {
        await this.findById(id)
        await notesRepository.deleteNote(id)
        return true
    }
}

export default new NotesService()
