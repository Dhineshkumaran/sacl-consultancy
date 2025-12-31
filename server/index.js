import express from 'express';
import cors from 'cors';
import Client from './config/connection.js';
import dotenv from 'dotenv';
import getClientIp from './utils/getClientIp.js';
dotenv.config();

import CustomError from './utils/customError.js';
import masterListRoutes from './routes/masterList.js';
import userRoutes from './routes/users.js';
import loginRoutes from './routes/login.js';
import departmentRoutes from './routes/departments.js';
import trial from './routes/trial.js';
import metallurgicalSpecs from './routes/metallurgicalSpecs.js';
import mechanicalProperties from './routes/mechanicalProperties.js';
import departmentProgress from './routes/departmentProgress.js';
import visualInspection from './routes/visualInspection.js';
import materialCorrection from './routes/materialCorrection.js';
import sandProperties from './routes/sandProperties.js';
import pouringDetails from './routes/pouringDetails.js';
import mouldCorrection from './routes/mouldCorrection.js';
import dimensionalInspection from './routes/dimensionalInspection.js';
import metallurgicalInspection from './routes/metallurgicalInspection.js';
import machineShop from './routes/machineShop.js';
import document from './routes/documents.js';
import getAllDepartmentData from './routes/getAllDepartmentData.js';
import stats from './routes/stats.js';

const app = express();
// Increase body size limits to support file uploads (base64 encoded files can be large)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use(cors({
    origin: ['http://localhost:5173', 'https://sacl-consultancy-proj.vercel.app', 'https://sacl-consultancy-proj.onrender.com'],
    credentials: true
}))

app.use((req, res, next) => {
    req.clientIp = getClientIp(req);
    next();
})

app.use('/api/master-list', masterListRoutes);
app.use('/api/users', userRoutes);
app.use('/api/login', loginRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/trial', trial);
app.use('/api/metallurgical-specs', metallurgicalSpecs);
app.use('/api/mechanical-properties', mechanicalProperties);
app.use('/api/department-progress', departmentProgress);
app.use('/api/visual-inspection', visualInspection);
app.use('/api/material-correction', materialCorrection);
app.use('/api/sand-properties', sandProperties);
app.use('/api/pouring-details', pouringDetails);
app.use('/api/moulding-correction', mouldCorrection);
app.use('/api/dimensional-inspection', dimensionalInspection);
app.use('/api/metallurgical-inspection', metallurgicalInspection);
app.use('/api/machine-shop', machineShop);
app.use('/api/documents', document);
app.use('/api/get-all-department-data', getAllDepartmentData);
app.use('/api/stats', stats);

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
        const res = await query('SELECT GETDATE()');
        console.log(res[0]);
    } catch (err) {
        console.error(`${err}`);
    }
    console.log(`Server is listening on port ${port}`);
});
