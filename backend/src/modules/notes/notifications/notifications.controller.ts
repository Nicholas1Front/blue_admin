import { Request, Response } from 'express'
import { AppError } from '../../../shared/errors/AppError.js'
import notificationsService from './notifications.service.js'
import { findNotificationsSchema } from './notifications.schema.js'

class NotificationsController {
    async find(req: Request, res: Response) {
        if (!req.user) throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')
        const filters = findNotificationsSchema.parse(req.query)
        const notifications = await notificationsService.find(req.user.id, filters)
        return res.status(200).json({ message: 'Notifications found successfully', data: notifications })
    }

    async markAsRead(req: Request, res: Response) {
        if (!req.user) throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')
        await notificationsService.markAsRead(req.params.id as string, req.user.id)
        return res.status(200).json({ message: 'Notification marked as read' })
    }

    async markAllAsRead(req: Request, res: Response) {
        if (!req.user) throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')
        const count = await notificationsService.markAllAsRead(req.user.id)
        return res.status(200).json({ message: 'Notifications marked as read', data: { count } })
    }
}

export default new NotificationsController()
