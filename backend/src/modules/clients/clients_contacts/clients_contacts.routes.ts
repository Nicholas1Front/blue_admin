import { Router } from 'express';

import clientsContactsController from './clients_contacts.controller.js';
import { authMiddleware } from '../../../middlewares/auth.middleware.js';

const router = Router();

router.post('/', authMiddleware, clientsContactsController.createContact);
router.get('/', authMiddleware, clientsContactsController.findContactsByClient);
router.put('/:id', authMiddleware, clientsContactsController.updateContact);
router.delete('/:id', authMiddleware, clientsContactsController.deleteContactById);

export default router;
