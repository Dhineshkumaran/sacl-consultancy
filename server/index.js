import express from 'express';
import cors from 'cors';
import Client from './config/connection.js';
import dotenv from 'dotenv';
dotenv.config();

import CustomError from './utils/customError.js';
import masterListRoutes from './routes/masterList.js';
import userRoutes from './routes/users.js';
import loginRoutes from './routes/login.js';
import departmentRoutes from './routes/departments.js';
import trial from './routes/trial.js';
import metallurgicalSpecs from './routes/metallurgicalSpecs.js';
import mechanicalProperties from './routes/mechanicalProperties.js';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
    origin: "*"
}))

app.use('/api/master-list', masterListRoutes);
app.use('/api/users', userRoutes);
app.use('/api/login', loginRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/trial', trial);
app.use('/api/metallurgical-specs', metallurgicalSpecs);
app.use('/api/mechanical-properties', mechanicalProperties);
app.use('/health', (req, res) => {
    res.status(200).json({ status: 'OK' });
});
// app.all('*', (req, res, next)=>{
//     const err = new CustomError(`Can't find the ${req.originalUrl} on the server!`, 404);
//     next(err);
// });

app.use((error, req, res, next) => {
    console.error(error.stack);
    error.statusCode = error.statusCode || 500;
    res.status(error.statusCode).json({
        success: false,
        message: error.message,
        error: process.env.NODE_ENV == 'production' ? {} : error
    });
});

async function query(arg) {
    try {
        const res = await Client.query(arg);
        return res;
    } catch (err) {
        throw err;
    }
}

const port = process.env.PORT || 3000;

app.listen(port, async () => {
    try {
        const res = await query('SELECT NOW()');
        console.log(res[0]);
    } catch (err) {
        console.error(`${err}`);
    }
    console.log(`Server is listening on port ${port}`);
});