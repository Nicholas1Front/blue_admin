import { Router } from 'express'
import { authMiddleware } from '../../../middlewares/auth.middleware.js'
import notificationsController from './notifications.controller.js'

const router = Router()

router.use(authMiddleware)

router.get('/find-notifications', notificationsController.find)
router.post('/mark-notification-as-read/:id', notificationsController.markAsRead)
router.post('/mark-all-notifications-as-read', notificationsController.markAllAsRead)

export default router
