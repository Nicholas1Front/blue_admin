import type {
    createClientContactDTO,
    updateClientContactDTO,
    findClientContactByClientDTO
} from './clients_contacts.dto.js';

import clientsContactsRepository from './clients_contacts.repository.js';
import clientsRepository from '../clients.repository.js';
import { AppError } from '../../../shared/errors/AppError.js';

class ClientsContactsService {
    async createContact(data: createClientContactDTO) {
        const client = await clientsRepository.findClientById(data.clientId);

        if (!client) {
            throw new AppError(
                'Client not found',
                404,
                'CLIENT_NOT_FOUND'
            );
        }

        const contact = await clientsContactsRepository.createContact(
            data.clientId,
            data.name,
            data.email,
            data.phoneNumber
        );

        if (!contact) {
            throw new AppError(
                'Failed to create client contact',
                500,
                'CLIENT_CONTACT_CREATION_FAILED'
            );
        }

        return contact;
    }

    async findContactsByClient(
        filters: findClientContactByClientDTO
    ) {
        const client = await clientsRepository.findClientById(filters.clientId);

        if (!client) {
            throw new AppError(
                'Client not found',
                404,
                'CLIENT_NOT_FOUND'
            );
        }

        return clientsContactsRepository.findContactsByClientId(
            filters.clientId
        );
    }

    async updateContact(
        id: string,
        data: updateClientContactDTO
    ) {
        const existingContact = await clientsContactsRepository.findContactById(id);

        if (!existingContact) {
            throw new AppError(
                'Client contact not found',
                404,
                'CLIENT_CONTACT_NOT_FOUND'
            );
        }

        return clientsContactsRepository.updateContact(id, data);
    }

    async deleteContactById(id: string) {
        const existingContact = await clientsContactsRepository.findContactById(id);

        if (!existingContact) {
            throw new AppError(
                'Client contact not found',
                404,
                'CLIENT_CONTACT_NOT_FOUND'
            );
        }

        await clientsContactsRepository.deleteContactById(id);

        return true;
    }
}

export default new ClientsContactsService();
