import {Router} from 'express'
import activityController from './activity.controller.js'
import { authMiddleware } from '../../../middlewares/auth.middleware.js'

const router = Router()

router.use(authMiddleware)

router.post('/add-activity/:serviceId', activityController.addActivity)
router.put('/update-activity/:id', activityController.updateActivity)
router.get('/find-activities-by-service/:serviceId', activityController.findActivitiesByServiceId)
router.get('/find-activities-by-filters', activityController.findActivitiesByFilters)
router.delete('/delete-activity/:id', activityController.deleteActivity)

export default router
