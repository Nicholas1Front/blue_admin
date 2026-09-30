import type {
    createClientDTO,
    updateClientDTO,
    findClientByFiltersDTO
} from './clients.dto.js';

import clientsRepository from './clients.repository.js';
import { AppError } from '../../shared/errors/AppError.js';

class ClientsService {
    async createClient(data: createClientDTO) {
        const client = await clientsRepository.createClient(
            data.name,
            data.document,
            data.address
        );

        if (!client) {
            throw new AppError(
                'Failed to create client',
                500,
                'CLIENT_CREATION_FAILED'
            );
        }

        return client;
    }

    async getClients() {
        return clientsRepository.findAllClients();
    }

    async findClientByFilters(filters: findClientByFiltersDTO) {
        return clientsRepository.findClientByFilters(
            filters.id,
            filters.name,
            filters.document
        );
    }

    async updateClient(
        id: string,
        data: updateClientDTO
    ) {
        const existingClient = await clientsRepository.findClientById(id);

        if (!existingClient) {
            throw new AppError(
                'Client not found',
                404,
                'CLIENT_NOT_FOUND'
            );
        }

        return clientsRepository.updateClient(id, data);
    }

    async deleteClientById(id: string) {
        const existingClient = await clientsRepository.findClientById(id);

        if (!existingClient) {
            throw new AppError(
                'Client not found',
                404,
                'CLIENT_NOT_FOUND'
            );
        }

        await clientsRepository.deleteClientById(id);

        return true;
    }
}

export default new ClientsService();
