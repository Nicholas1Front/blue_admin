import { Router } from 'express';

import clientsController from './clients.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';

import clientContactsRoutes from './clients_contacts/clients_contacts.routes.js';

const router = Router();

router.use('/contacts', clientContactsRoutes);

router.post('/', authMiddleware, clientsController.createClient);
router.get('/', authMiddleware, clientsController.getClients);
router.get('/find', authMiddleware, clientsController.findClientByFilters);
router.put('/:id', authMiddleware, clientsController.updateClient);
router.delete('/:id', authMiddleware, clientsController.deleteClientById);

export default router;
