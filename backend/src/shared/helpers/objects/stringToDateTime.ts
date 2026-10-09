export const stringToDate = (data : any) => {
    if(typeof data === 'string'){
        return new Date(data)
    }else{
        return data
    }
}