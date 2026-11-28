import { AppError } from '../../../shared/errors/AppError.js'
import notificationsRepository from './notifications.repository.js'
import type { FindNotificationsDTO } from './notifications.schema.js'

class NotificationsService {
    async find(userId: string, filters: FindNotificationsDTO) {
        return notificationsRepository.findNotifications(userId, filters)
    }

    async markAsRead(notificationId: string, userId: string) {
        const notification = await notificationsRepository.findActiveNotification(notificationId, userId)
        if (!notification) {
            throw new AppError('Notification not found or expired', 404, 'NOTIFICATION_NOT_FOUND')
        }

        return notificationsRepository.markAsRead(notificationId, userId)
    }

    async markAllAsRead(userId: string) {
        return notificationsRepository.markAllAsRead(userId)
    }
}

export default new NotificationsService()
