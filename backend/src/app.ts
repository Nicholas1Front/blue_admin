import express from "express";
import {httpLogger} from './shared/logger/httpLogger.js';
import {errorHandler} from './shared/errors/errorHandler.js';

const app = express();

app.use(httpLogger);
app.use(express.json());

app.get('/health', (_req,res)=>{
    res.json({
        success : true,
        message : "API is running"
    })
})

app.use(errorHandler);

export default app