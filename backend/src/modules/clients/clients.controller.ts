import {Request, Response} from 'express'
import clientsService from './clients.service.js'

import {AppError} from '../../shared/errors/AppError.js'

import {
    createClientSchema,
    updateClientSchema,
    findClientsByFilters
} from './clients.schema.js'

class ClientsController{
    async createClient(
        req : Request,
        res : Response
    ){
        if(!req.user){
            throw new AppError(
                'User not authenticated',
                401,
                'USER_NOT_AUTHENTICATED'
            )
        }

        const data = createClientSchema.parse(req.body);

        const client = await clientsService.createClient(data);

        return res.status(200).json({
            message : 'Client created successfully',
            data : client
        })
    }

    async updateClient(
        req : Request,
        res : Response
    ){
        if(!req.user){
            throw new AppError(
                'User not authenticated',
                401,
                'USER_NOT_AUTHENTICATED'
            )
        }

        const data = updateClientSchema.parse(req.body);

        const client = await clientsService.updateClient(
            req.params.id as string,
            data
        )

        return res.status(200).json({
            message : 'Client data updated successfully',
            data : client
        })
    }

    async findAllClients(
        req : Request,
        res : Response
    ){
        if(!req.user){
            throw new AppError(
                'User not authenticated',
                401,
                'USER_NOT_AUTHENTICATED'
            )
        }

        const clients = await clientsService.findAllClients();

        return res.status(200).json({
            message : 'All clients found successfully',
            data : clients
        })
    }

    async findClientsByFilters(
        req : Request,
        res : Response
    ){
        if(!req.user){
            throw new AppError(
                'User not authenticated',
                401,
                'USER_NOT_AUTHENTICATED'
            )
        }

        const filters = findClientsByFilters.parse(req.query);

        const clients = await clientsService.findClientByFilters(filters);

        return res.status(200).json({
            message : 'Clients found successfully',
            data : clients
        })
    }

    async deleteClient(
        req : Request,
        res : Response
    ){
        if(!req.user){
            throw new AppError(
                'User not authenticated',
                401,
                'USER_NOT_AUTHENTICATED'
            )
        }

        await clientsService.deleteClientById(req.params.id as string);

        return res.status(200).json({
            message : 'Client deleted successfully'
        })

    }
}

export default new ClientsController();