import {Request, Response, NextFunction} from 'express';
import {AppError} from '../shared/errors/AppError.js';
import jwt from 'jsonwebtoken';

export const authMiddleware = async (
    req : Request,
    res : Response,
    next : NextFunction
)=>{
    const authHeader = req.headers.authorization;

    if(!authHeader || !authHeader.startsWith('Bearer ')){
        throw new AppError('Invalid token', 401, 'INVALID_TOKEN');
    }

    const token = authHeader.split(' ')[1];

    
}