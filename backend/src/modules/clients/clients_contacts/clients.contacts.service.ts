import clientsContactsRepository from "./clients.contacts.repository.js";

import {AppError} from "../../../shared/errors/AppError.js";

import type {
    createContactDTO,
    updateContactDTO,
    findContactByFiltersDTO
} from "./clients.contacts.dto.js";

class ClientsContactsService{
    async createContact(
        clientId : string,
        data : createContactDTO
    ){
        const existingClient = await clientsContactsRepository.findClientById(clientId);

        if(!existingClient){
            throw new AppError('Client not found', 404, 'CLIENT_NOT_FOUND');
        }

        const contact = await clientsContactsRepository.createContact(
            clientId,
            data.name,
            data.email,
            data.phoneNumber
        )

        if(!contact){
            throw new AppError('Internal server error', 500, 'INTERNAL_SERVER_ERROR');
        }

        return contact
    }

    async updateContact(
        id : string,
        data : updateContactDTO
    ){
        const existingContact = await clientsContactsRepository.findContactById(id);

        if(!existingContact){
            throw new AppError('Contact not found', 404, 'CONTACT_NOT_FOUND');
        }

        if(data.clientId !== undefined){
            const existingClient = await clientsContactsRepository.findClientById(data.clientId);

            if(!existingClient){
                throw new AppError('Client not found', 404, 'CLIENT_NOT_FOUND');
            }
        }

        const updatedContact = await clientsContactsRepository.updateContact(
            id,
            data
        )

        if(!updatedContact){
            throw new AppError('Internal server error', 500, 'INTERNAL_SERVER_ERROR');
        }

        return updatedContact
    }

    async findContactsByFilters(
        filters : findContactByFiltersDTO
    ){
        const contacts = await clientsContactsRepository.findContactsByFilters(filters);

        if(!contacts){
            throw new AppError('Internal server error', 500, 'INTERNAL_SERVER_ERROR');
        }

        return contacts
    }

    async deleteContactById(
        id : string
    ){
        const existingContact = await clientsContactsRepository.findContactById(id);

        if(!existingContact){
            throw new AppError('Contact not found', 404, 'CONTACT_NOT_FOUND');
        }

        const result = await clientsContactsRepository.deleteContactById(id);

        if(!result){
            throw new AppError('Internal server error', 500, 'INTERNAL_SERVER_ERROR');
        }

        return true
    }
}

export default new ClientsContactsService()
