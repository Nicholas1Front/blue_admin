export const removeUndefined = <T extends object>(data : T)=>{
    return Object.fromEntries(
        Object.entries(data).filter(
            ([,value])=> value !== undefined
        )
    )
}