import { Request, Response } from 'express'
import { AppError } from '../../../shared/errors/AppError.js'
import notesQueriesService from './queries.service.js'
import { findNotesByDaySchema } from './queries.schema.js'

class NotesQueriesController {
    async findHome(req: Request, res: Response) {
        if (!req.user) throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')
        const data = await notesQueriesService.findHome()
        return res.status(200).json({ message: 'Notes home query completed successfully', data })
    }

    async findByDay(req: Request, res: Response) {
        if (!req.user) throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')
        const filters = findNotesByDaySchema.parse(req.query)
        const data = await notesQueriesService.findByDay(filters)
        return res.status(200).json({ message: 'Notes by day query completed successfully', data })
    }
}

export default new NotesQueriesController()
