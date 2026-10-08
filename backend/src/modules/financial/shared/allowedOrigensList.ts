export const allowedOrigensList = [
    'services',
    'employees'
]

// todo : needs to create a function to check if the originId and originType are valid in allowedOrigensList using prisma
export const verifyOrigin = (id : string, type : string) => {
    if(type === 'services'){
        return true
    };

    if(type === 'employees'){
        return true
    }
}