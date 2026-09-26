import axios from 'axios';

export const api = axios.create({
    baseUrl : import.meta.env.VITE_API_URL,
    headers : {
        "Content-Type" : "application/json"
    }
})