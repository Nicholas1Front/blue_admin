import express from "express";
import {httpLogger} from './shared/logger/httpLogger.js';
import {errorHandler} from './shared/errors/errorHandler.js';
import {prisma} from './shared/database/prisma.js';

const app = express();

app.use(httpLogger);
app.use(express.json());

app.get('/health', (_req,res)=>{
    res.json({
        success : true,
        message : "API is running"
    })
})

app.get('/health/db', async (_req,res)=>{
    await prisma.$queryRaw`SELECT 1`;

    res.json({
        success : true,
        message : "Database is connected"
    })
})

app.use(errorHandler);

export default app