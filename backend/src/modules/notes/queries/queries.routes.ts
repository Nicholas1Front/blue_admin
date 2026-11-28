import { Router } from 'express'
import { authMiddleware } from '../../../middlewares/auth.middleware.js'
import notesQueriesController from './queries.controller.js'

const router = Router()

router.use(authMiddleware)

router.get('/find-notes-home', notesQueriesController.findHome)
router.get('/find-notes-by-day', notesQueriesController.findByDay)

export default router
