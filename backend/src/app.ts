import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import {httpLogger} from './shared/logger/httpLogger.js';
import {errorHandler} from './shared/errors/errorHandler.js';
import {prisma} from './shared/database/prisma.js';
import routes from './routes/index.js';

const app = express();

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit : 100, // limit each IP to 100 requests per windowMs
    standardHeaders : true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders : false, // Disable the `X-RateLimit-*` headers
    message : {
        success : false,
        error : {
            code : "TOO_MANY_REQUESTS",
            message : "Too many requests, please try again later."
        }
    }


})

app.use(helmet());
app.use(
    cors({
        origin : "*",
    })
)
app.use(limiter);

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

app.use(routes);

app.use(errorHandler);

export default app