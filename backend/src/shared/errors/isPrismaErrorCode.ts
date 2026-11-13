export const isPrismaErrorCode = (error: unknown, code: string): boolean => {
    if (typeof error !== 'object' || error === null || !('code' in error)) return false
    return error.code === code
}
