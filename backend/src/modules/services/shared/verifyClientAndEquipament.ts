import { AppError } from '../../../shared/errors/AppError.js'
import servicesRepository from '../services.repository.js'

export const verifyForUpdate = async (
    serviceExists: { service: { clientId: string; equipamentId: string } | null },
    data: { clientId?: string; equipamentId?: string }
) => {
    const currentService = serviceExists.service

    if (!currentService) {
        throw new AppError('Service not found', 404, 'SERVICE_NOT_FOUND')
    }

    const clientChanged =
        data.clientId !== undefined &&
        data.clientId !== currentService.clientId

    if (clientChanged && data.equipamentId === undefined) {
        throw new AppError(
            'A new equipament must be selected when changing the client',
            400,
            'EQUIPAMENT_REQUIRED'
        )
    }

    const effectiveClientId = data.clientId ?? currentService.clientId
    const effectiveEquipamentId = data.equipamentId ?? currentService.equipamentId

    if (clientChanged) {
        const clientExists = await servicesRepository.clientExists(effectiveClientId)
        if (!clientExists) {
            throw new AppError('Client not found', 404, 'CLIENT_NOT_FOUND')
        }
    }

    if (data.equipamentId !== undefined || clientChanged) {
        const clientHasEquipament = await servicesRepository.clientHasEquipament(
            effectiveClientId,
            effectiveEquipamentId
        )

        if (!clientHasEquipament) {
            throw new AppError(
                'Client does not have this equipament',
                400,
                'CLIENT_DOES_NOT_HAVE_EQUIPAMENT'
            )
        }
    }

    return true
}
