import { Request, Response } from 'express';
import clientsContactsService from './clients.contacts.service.js';
import {
    createContactSchema,
    updateContactSchema,
    findContactByFiltersSchema
} from './clients.contacts.schema.js';

import { AppError } from '../../../shared/errors/AppError.js';

class ClientsContactsController {

    async createContact(
        req: Request,
        res : Response
    ){
        if(!req.user){
            throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED');
        }

        const data = createContactSchema.parse(req.body);

        const contact = await clientsContactsService.createContact(
            req.params.clientId as string,
            data
        )

        return res.status(200).json({
            message : 'Contact created successfully',
            data : contact
        })
    }

    async updateContact(
        req : Request,
        res : Response
    ){
        if(!req.user){
            throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED');
        }

        const data = updateContactSchema.parse(req.body);

        const contact = await clientsContactsService.updateContact(
            req.params.id as string,
            data
        )

        return res.status(200).json({
            message : 'Contact updated successfully',
            data : contact
        })
    }

    async findContactsByFilters(
        req : Request,
        res : Response
    ){
        if(!req.user){
            throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED');
        }

        const filters = findContactByFiltersSchema.parse(req.query);

        const contacts = await clientsContactsService.findContactsByFilters(
            filters
        )

        return res.status(200).json({
            message : 'Contacts found successfully using filters',
            data : contacts
        })
    }

    async deleteContact(
        req : Request,
        res : Response
    ){
        if(!req.user){
            throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED');
        }

        await clientsContactsService.deleteContactById(
            req.params.id as string
        )

        return res.status(200).json({
            message : 'Contact deleted successfully'
        })
    }
}

export default new ClientsContactsController();

