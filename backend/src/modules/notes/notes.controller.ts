import { Request, Response } from 'express'
import { AppError } from '../../shared/errors/AppError.js'
import notesService from './notes.service.js'
import { createNoteSchema, findNotesSchema, updateNoteSchema } from './notes.schema.js'

class NotesController {
    async create(req: Request, res: Response) {
        if (!req.user) throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')
        const data = createNoteSchema.parse(req.body)
        const note = await notesService.create(data, req.user.id)
        return res.status(201).json({ message: 'Note created successfully', data: note })
    }

    async findDashboard(req: Request, res: Response) {
        if (!req.user) throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')
        const dashboard = await notesService.findDashboard()
        return res.status(200).json({ message: 'Notes dashboard found successfully', data: dashboard })
    }

    async find(req: Request, res: Response) {
        if (!req.user) throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')
        const filters = findNotesSchema.parse(req.query)
        const notes = await notesService.find(filters)
        return res.status(200).json({ message: 'Notes found successfully', data: notes })
    }

    async findById(req: Request, res: Response) {
        if (!req.user) throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')
        const note = await notesService.findById(req.params.id as string)
        return res.status(200).json({ message: 'Note found successfully', data: note })
    }

    async update(req: Request, res: Response) {
        if (!req.user) throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')
        const data = updateNoteSchema.parse(req.body)
        const note = await notesService.update(req.params.id as string, data)
        return res.status(200).json({ message: 'Note updated successfully', data: note })
    }

    async delete(req: Request, res: Response) {
        if (!req.user) throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')
        await notesService.delete(req.params.id as string)
        return res.status(200).json({ message: 'Note deleted successfully' })
    }
}

export default new NotesController()
