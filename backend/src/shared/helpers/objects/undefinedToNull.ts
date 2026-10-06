export const undefinedToNull = <T extends object>(data: T) => {
    return Object.fromEntries(
        Object.entries(data).map(([key, value]) => [
            key,
            value === undefined ? null : value
        ])
    );
};