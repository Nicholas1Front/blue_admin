import clientsRepository from './clients.repository.js';

import {AppError} from '../../shared/errors/AppError.js';

import type {
    createClientDTO,
    updateClientDTO,
    findClientsByFiltersDTO
} from './clients.dto.js';

import {removeUndefined} from '../../shared/helpers/objects/removeUndefined.js';

class ClientsService {
    async createClient(
        data : createClientDTO
    ){
        if(data.document !== undefined){
            if(data.document.length > 14 || data.document.length < 11){
                throw new AppError(
                    'Document must be between 11 and 14 characters',
                    400,
                    'INVALID_DOCUMENT_LENGTH'
                )
            }
        }

        const client = await clientsRepository.createClient(
            data.name,
            data.document,
            data.address
        )

        if(!client){
            throw new AppError(
                'Error creating client',
                500,
                'CREATE_CLIENT_ERROR'
            )
        }

        return client
    }

    async updateClient(
        id : string,
        data : updateClientDTO
    ){
        const existingClient = await clientsRepository.findClientById(id)

        if(!existingClient){
            throw new AppError(
                'Client not found',
                404,
                'CLIENT_NOT_FOUND'
            )
        }

        if(data.document !== undefined){
            if(data.document.length > 14 || data.document.length < 11){
                throw new AppError(
                    'Document must be between 11 and 14 characters',
                    400,
                    'INVALID_DOCUMENT_LENGTH'
                )
            }
        }

        const cleanedData = removeUndefined(data);

        const updatedClient = await clientsRepository.updateClient(
            id,
            cleanedData
        );

        if(!updatedClient){
            throw new AppError(
                'Error updating client',
                500,
                'UPDATE_CLIENT_ERROR'
            )
        }

        return updatedClient
    }

    async findClientByFilters(
        filters : findClientsByFiltersDTO
    ){

        const cleanedFilters = removeUndefined(filters);

        const clients = await clientsRepository.findClientsByFilters(
            cleanedFilters
        )

        if(!clients){
            throw new AppError(
                'Error finding clients',
                500,
                'FIND_CLIENTS_ERROR'
            )
        }

        return clients
    }

    async findAllClients(){
        const clients = await clientsRepository.findAllClients()

        if(!clients){
            throw new AppError(
                'Error finding clients',
                500,
                'FIND_CLIENTS_ERROR'
            )
        }

        return clients
    }

    async deleteClientById(
        id : string
    ){
        const existingClient = await clientsRepository.findClientById(id)

        if(!existingClient){
            throw new AppError(
                'Client not found',
                404,
                'CLIENT_NOT_FOUND'
            )
        }

        await clientsRepository.deleteClientById(id)

        return true
    }
}

export default new ClientsService();