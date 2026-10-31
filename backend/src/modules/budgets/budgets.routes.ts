import { Router } from 'express'
import { authMiddleware } from '../../middlewares/auth.middleware.js'
import budgetController from './budgets.controller.js'
import budgetItemsRoutes from './items/items.routes.js'
import budgetCategoriesRoutes from './categories/categories.routes.js'

const router = Router()

router.use(authMiddleware)
router.use('/items', budgetItemsRoutes)
router.use('/categories', budgetCategoriesRoutes)

router.post('/create-budget', budgetController.create)
router.put('/update-budget/:id', budgetController.update)
router.get('/find-budget-by-id/:id', budgetController.findById)
router.get('/find-all-budgets', budgetController.findAll)
router.delete('/delete-budget/:id', budgetController.delete)

export default router
