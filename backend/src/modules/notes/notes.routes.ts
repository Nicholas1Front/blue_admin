import { Router } from 'express'
import { authMiddleware } from '../../middlewares/auth.middleware.js'
import notesController from './notes.controller.js'

const router = Router()

router.use(authMiddleware)

router.post('/create', notesController.create)
router.get('/find', notesController.find)
router.get('/find/:id', notesController.findById)
router.put('/update/:id', notesController.update)
router.delete('/delete/:id', notesController.delete)

export default router
