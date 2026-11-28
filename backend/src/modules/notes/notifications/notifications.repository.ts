import { prisma } from '../../../shared/database/prisma.js'
import type { FindNotificationsDTO } from './notifications.schema.js'

class NotificationsRepository {
    async findNotifications(userId: string, filters: FindNotificationsDTO) {
        const where = {
            expiresAt: { gt: new Date() },
            createdById: { not: userId },
            ...(filters.unreadOnly && { reads: { none: { userId } } })
        }

        const [items, total, unreadCount] = await prisma.$transaction([
            prisma.notification.findMany({
                where,
                include: {
                    note: { select: { id: true, title: true, folder: { select: { id: true, name: true } } } },
                    createdBy: { select: { id: true, name: true } },
                    reads: { where: { userId }, select: { readAt: true } }
                },
                orderBy: { createdAt: 'desc' },
                skip: (filters.page - 1) * filters.limit,
                take: filters.limit
            }),
            prisma.notification.count({ where }),
            prisma.notification.count({
                where: {
                    expiresAt: { gt: new Date() },
                    createdById: { not: userId },
                    reads: { none: { userId } }
                }
            })
        ])

        return {
            items: items.map(notification => ({
                ...notification,
                isRead: notification.reads.length > 0,
                reads: undefined
            })),
            unreadCount,
            pagination: {
                page: filters.page,
                limit: filters.limit,
                total,
                totalPages: Math.ceil(total / filters.limit)
            }
        }
    }

    async findActiveNotification(id: string, userId: string) {
        return prisma.notification.findFirst({
            where: {
                id,
                expiresAt: { gt: new Date() },
                createdById: { not: userId }
            },
            select: { id: true }
        })
    }

    async markAsRead(notificationId: string, userId: string) {
        return prisma.notificationRead.upsert({
            where: { notificationId_userId: { notificationId, userId } },
            create: { notificationId, userId },
            update: { readAt: new Date() }
        })
    }

    async markAllAsRead(userId: string) {
        const unread = await prisma.notification.findMany({
            where: {
                expiresAt: { gt: new Date() },
                createdById: { not: userId },
                reads: { none: { userId } }
            },
            select: { id: true }
        })

        if (unread.length) {
            await prisma.notificationRead.createMany({
                data: unread.map(notification => ({ notificationId: notification.id, userId })),
                skipDuplicates: true
            })
        }

        return unread.length
    }
}

export default new NotificationsRepository()
