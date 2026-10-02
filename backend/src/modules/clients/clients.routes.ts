import {Router} from 'express';

import clientsController from './clients.controller.js'
import clientsContactsController from './clients_contacts/clients.contacts.controller.js'
import {authMiddleware} from '../../middlewares/auth.middleware.js';

const router = Router();

router.use(authMiddleware);

router.post('/create-client', clientsController.createClient);

router.put('/update-client/:id', clientsController.updateClient);

router.get('/find-all-clients', clientsController.findAllClients);
router.get('/find-clients-by-filters', clientsController.findClientsByFilters);

router.delete('/delete-client/:id', clientsController.deleteClient);

router.post('/create-contact/:clientId', clientsContactsController.createContact);
router.put('/update-contact/:id', clientsContactsController.updateContact);
router.get('/find-contacts-by-filters', clientsContactsController.findContactsByFilters);
router.delete('/delete-contact/:id', clientsContactsController.deleteContact);

export default router;