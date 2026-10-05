import equipamentsRepository from './equipaments.repository.js';

import {AppError} from '../../shared/errors/AppError.js';

import type {
    createEquipamentDTO,
    updateEquipamentDTO,
    findEquipamentsByFiltersDTO
} from './equipaments.dto.js';

class EquipamentsService{
    async createEquipament(
        clientId : string,
        data : createEquipamentDTO
    ){
        const existingClient = await equipamentsRepository.findClientById(clientId);

        if(!existingClient){
            throw new AppError('Client not found', 404, 'CLIENT_NOT_FOUND');
        }

        const equipament = await equipamentsRepository.createEquipament(
            clientId,
            data.type,
            data.brand,
            data.model,
            data.mainIdentification,
            data.additionalIdentification
        )

        if(!equipament){
            throw new AppError('Internal server error', 500, 'INTERNAL_SERVER_ERROR');
        }

        return equipament
    }

    async updateEquipament(
        id : string,
        data : updateEquipamentDTO
    ){
        const existingEquipament = await equipamentsRepository.findEquipamentById(id);

        if(!existingEquipament){
            throw new AppError('Equipament not found', 404, 'EQUIPAMENT_NOT_FOUND');
        }

        if(data.clientId !== null && data.clientId !== undefined){
            const existingClient = await equipamentsRepository.findClientById(data.clientId);

            if(!existingClient){
                throw new AppError('Client not found', 404, 'CLIENT_NOT_FOUND');
            }
        }

        const updatedEquipament = await equipamentsRepository.updateEquipament(
            id,
            data
        )

        if(!updatedEquipament){
            throw new AppError('Internal server error', 500, 'INTERNAL_SERVER_ERROR');
        }

        return updatedEquipament
    }

    async findEquipamentsByFilters(
        filters : findEquipamentsByFiltersDTO
    ){
        const equipaments = await equipamentsRepository.findEquipamentsByFilters(filters);

        if(!equipaments){
            throw new AppError('Internal server error', 500, 'INTERNAL_SERVER_ERROR');
        }

        return equipaments
    }

    async deleteEquipamentById(
        id : string
    ){
        const existingEquipament = await equipamentsRepository.findEquipamentById(id);

        if(!existingEquipament){
            throw new AppError('Equipament not found', 404, 'EQUIPAMENT_NOT_FOUND');
        }

        await equipamentsRepository.deleteEquipamentById(id);

        return true
    }
}

export default new EquipamentsService()