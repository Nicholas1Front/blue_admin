import { Router } from 'express'
import { authMiddleware } from '../../middlewares/auth.middleware.js'
import notesController from './notes.controller.js'

const router = Router()

router.use(authMiddleware)

router.post('/', notesController.create)
router.get('/', notesController.find)
router.get('/:id', notesController.findById)
router.put('/:id', notesController.update)
router.delete('/:id', notesController.delete)

export default router
