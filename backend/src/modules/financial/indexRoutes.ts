import {Router} from 'express'
import {authMiddleware} from '../../middlewares/auth.middleware.js'
import transactionsRoutes from './transactions/transactions.routes.js'
import categoriesRoutes from './financialCategories/category.routes.js'
import monthlyRoutes from './monthlyExpenses/monthly.routes.js'

const router = Router()

router.use(authMiddleware);

router.use('/transactions', transactionsRoutes)
router.use('/categories', categoriesRoutes)
router.use('/monthly-expenses', monthlyRoutes)

export default router