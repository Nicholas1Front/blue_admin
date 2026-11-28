import {Router} from "express";
import usersRoutes from "../modules/users/users.routes.js";
import authRoutes from "../modules/auth/auth.routes.js";
import clientsRoutes from "../modules/clients/clients.routes.js";
import equipamentsRoutes from '../modules/equipaments/equipaments.routes.js';
import financialRoutes from '../modules/financial/indexRoutes.js';
import serviceRoutes from '../modules/services/services.routes.js'
import budgetsRoutes from '../modules/budgets/budgets.routes.js'
import vehiclesRoutes from '../modules/vehicles/vehicles.routes.js'
import notesRoutes from '../modules/notes/notes.routes.js'
import foldersRoutes from '../modules/notes/folders/folders.routes.js'

const routes = Router();

routes.use('/users', usersRoutes);
routes.use('/auth', authRoutes);
routes.use('/clients', clientsRoutes);
routes.use('/equipaments', equipamentsRoutes);
routes.use('/financial', financialRoutes);
routes.use('/services', serviceRoutes)
routes.use('/budgets', budgetsRoutes)
routes.use('/vehicles', vehiclesRoutes)
routes.use('/notes/folders', foldersRoutes)
routes.use('/notes', notesRoutes)

export default routes;
