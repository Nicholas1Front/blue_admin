import { Request, Response } from 'express';

import {
    createClientContactSchema,
    updateClientContactSchema,
    findClientContactByClientSchema
} from './clients_contacts.schema.js';

import clientsContactsService from './clients_contacts.service.js';
import { AppError } from '../../../shared/errors/AppError.js';

class ClientsContactsController {
    async createContact(
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

        const data = createClientContactSchema.parse(req.body);
        const contact = await clientsContactsService.createContact(data);

        return res.status(201).json({
            message: 'Client contact created successfully',
            data: contact
        });
    }

    async findContactsByClient(
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

        const data = findClientContactByClientSchema.parse(req.query);
        const contacts = await clientsContactsService.findContactsByClient(data);

        return res.status(200).json({
            message: 'Client contacts found successfully',
            data: contacts
        });
    }

    async updateContact(
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

        const data = updateClientContactSchema.parse(req.body);
        const contact = await clientsContactsService.updateContact(
            req.params.id as string,
            data
        );

        return res.status(200).json({
            message: 'Client contact updated successfully',
            data: contact
        });
    }

    async deleteContactById(
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

        await clientsContactsService.deleteContactById(
            req.params.id as string
        );

        return res.status(200).json({
            message: 'Client contact deleted successfully'
        });
    }
}

export default new ClientsContactsController();
