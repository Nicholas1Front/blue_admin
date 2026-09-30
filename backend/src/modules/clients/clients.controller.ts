import { Request, Response } from 'express';

import {
    createClientSchema,
    updateClientSchema,
    findClientByFiltersSchema
} from './clients.schema.js';

import clientsService from './clients.service.js';
import { AppError } from '../../shared/errors/AppError.js';

class ClientsController {
    async createClient(
        req: Request,
        res: Response
    ) {
        if (!req.user) {
            throw new AppError(
                'User not authenticated',
                401,
                'USER_NOT_AUTHENTICATED'
            );
        }

        const data = createClientSchema.parse(req.body);
        const client = await clientsService.createClient(data);

        return res.status(201).json({
            message: 'Client created successfully',
            data: client
        });
    }

    async getClients(
        req: Request,
        res: Response
    ) {
        if (!req.user) {
            throw new AppError(
                'User not authenticated',
                401,
                'USER_NOT_AUTHENTICATED'
            );
        }

        const clients = await clientsService.getClients();

        return res.status(200).json({
            message: 'Clients found successfully',
            data: clients
        });
    }

    async findClientByFilters(
        req: Request,
        res: Response
    ) {
        if (!req.user) {
            throw new AppError(
                'User not authenticated',
                401,
                'USER_NOT_AUTHENTICATED'
            );
        }

        const data = findClientByFiltersSchema.parse(req.query);
        const clients = await clientsService.findClientByFilters(data);

        return res.status(200).json({
            message: 'Clients found successfully',
            data: clients
        });
    }

    async updateClient(
        req: Request,
        res: Response
    ) {
        if (!req.user) {
            throw new AppError(
                'User not authenticated',
                401,
                'USER_NOT_AUTHENTICATED'
            );
        }

        const data = updateClientSchema.parse(req.body);
        const client = await clientsService.updateClient(
            req.params.id as string,
            data
        );

        return res.status(200).json({
            message: 'Client updated successfully',
            data: client
        });
    }

    async deleteClientById(
        req: Request,
        res: Response
    ) {
        if (!req.user) {
            throw new AppError(
                'User not authenticated',
                401,
                'USER_NOT_AUTHENTICATED'
            );
        }

        await clientsService.deleteClientById(req.params.id as string);

        return res.status(200).json({
            message: 'Client deleted successfully'
        });
    }
}

export default new ClientsController();
