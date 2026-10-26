import {Router} from 'express'
import {authMiddleware} from '../../../middlewares/auth.middleware.js'
import queriesController from './queries.controller.js'

const router = Router()

router.use(authMiddleware)

router.get('/find-service-by-id/:serviceId', queriesController.findServiceById)

export default router
