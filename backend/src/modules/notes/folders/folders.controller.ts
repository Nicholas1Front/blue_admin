import { Request, Response } from 'express'
import { AppError } from '../../../shared/errors/AppError.js'
import foldersService from './folders.service.js'
import { createFolderSchema, updateFolderSchema } from './folders.schema.js'

class FoldersController {
    async create(req: Request, res: Response) {
        if (!req.user) throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')
        const data = createFolderSchema.parse(req.body)
        const folder = await foldersService.create(data, req.user.id)
        return res.status(201).json({ message: 'Folder created successfully', data: folder })
    }

    async findAll(req: Request, res: Response) {
        if (!req.user) throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')
        const folders = await foldersService.findAll()
        return res.status(200).json({ message: 'Folders found successfully', data: folders })
    }

    async findById(req: Request, res: Response) {
        if (!req.user) throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')
        const folder = await foldersService.findById(req.params.id as string)
        return res.status(200).json({ message: 'Folder found successfully', data: folder })
    }

    async update(req: Request, res: Response) {
        if (!req.user) throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')
        const data = updateFolderSchema.parse(req.body)
        const folder = await foldersService.update(req.params.id as string, data)
        return res.status(200).json({ message: 'Folder updated successfully', data: folder })
    }

    async delete(req: Request, res: Response) {
        if (!req.user) throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')
        await foldersService.delete(req.params.id as string)
        return res.status(200).json({ message: 'Folder deleted successfully. Notes were kept without a folder.' })
    }
}

export default new FoldersController()
