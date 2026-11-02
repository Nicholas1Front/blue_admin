import { Router } from 'express'
import { authMiddleware } from '../../middlewares/auth.middleware.js'
import budgetController from './budgets.controller.js'
import budgetItemsRoutes from './items/items.routes.js'
import budgetCategoriesRoutes from './categories/categories.routes.js'
import budgetPricesRoutes from './prices/prices.routes.js'
import budgetQueriesRoutes from './queries/queries.routes.js'
import budgetQueriesController from './queries/queries.controller.js'

const router = Router()

router.use(authMiddleware)
router.use('/items', budgetItemsRoutes)
router.use('/categories', budgetCategoriesRoutes)
router.use('/prices', budgetPricesRoutes)
router.use('/queries', budgetQueriesRoutes)

router.post('/create-budget', budgetController.create)
router.post('/create-budget-from-service', budgetController.createFromService)
router.put('/update-budget/:id', budgetController.update)
router.get('/find-budget-by-id/:id', budgetQueriesController.findBudgetById)
router.get('/find-budgets-by-filters', budgetController.findByFilters)
router.delete('/delete-budget/:id', budgetController.delete)

export default router
