import { Router } from 'express'
import { authMiddleware } from '../../../middlewares/auth.middleware.js'
import foldersController from './folders.controller.js'

const router = Router()

router.use(authMiddleware)

router.post('/', foldersController.create)
router.get('/', foldersController.findAll)
router.get('/:id', foldersController.findById)
router.put('/:id', foldersController.update)
router.delete('/:id', foldersController.delete)

export default router
