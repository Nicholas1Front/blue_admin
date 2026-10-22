import {AppError} from '../../../shared/errors/AppError.js';
import servicesRepository from '../services.repository.js';

export const verifyForUpdate = async (
    serviceExists : any,
    data : any
)=>{
    const clientExists = await servicesRepository.clientExists(data.clientId)
    
    if(!clientExists){
        throw new AppError('Client not found', 404, 'CLIENT_NOT_FOUND')
    }
    
    if(
        data.clientId !== undefined && 
        data.equipamentId === undefined
    ){
        throw new AppError('Equipament is required', 400, 'EQUIPAMENT_REQUIRED')
    }
    
    if(data.equipamentId === serviceExists.service.equipamentId){
        throw new AppError('Equipament not changed', 400, 'EQUIPAMENT_NOT_CHANGED')
    }
    
    const clientHasEquipament = await servicesRepository.clientHasEquipament(
        data.clientId,
        data.equipamentId
    )
    
    if(!clientHasEquipament){
        throw new AppError('Client does not have this equipament', 404, 'CLIENT_DOES_NOT_HAVE_EQUIPAMENT')
    }

    return true
} 