export const stringToDate = (string : any) => {
    if(string === undefined){
        return undefined
    }

    if(typeof string === 'string'){
        return new Date(string)
    }
}