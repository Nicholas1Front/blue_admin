import { Router } from 'express'
import { authMiddleware } from '../../../middlewares/auth.middleware.js'
import budgetQueriesController from './queries.controller.js'

const router = Router()

router.use(authMiddleware)
router.get('/find-budget-by-id/:id', budgetQueriesController.findBudgetById)

export default router
