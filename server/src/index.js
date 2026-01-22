import express from 'express';
import cors from 'cors';
import Client from './config/connection.js';
import dotenv from 'dotenv';
import morgan from 'morgan';
import getClientIp from './utils/getClientIp.js';
dotenv.config();

import CustomError from './utils/customError.js';
import masterListRoutes from './routes/masterList.js';
import userRoutes from './routes/users.js';
import loginRoutes from './routes/login.js';
import departmentRoutes from './routes/departments.js';
import trial from './routes/trial.js';
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
import stats from './routes/stats.js';
import forgotPasswordRoutes from './routes/forgotPassword.js';
import logger from './config/logger.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

const logDirs = [
  path.join(__dirname, "../logs"),
  path.join(__dirname, "../logs/combined"),
  path.join(__dirname, "../logs/error")
];

logDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
  origin: ['http://localhost:5173', 'https://sacl-consultancy-proj.onrender.com', 'https://digitaltrialcard-sakthiauto.vercel.app'],
  credentials: true
}))

app.use(
  morgan("combined", {
    stream: {
      write: message => logger.info(message.trim())
    }
  })
);

app.use((req, res, next) => {
  req.clientIp = getClientIp(req);
  next();
})

app.use('/api/master-list', masterListRoutes);
app.use('/api/users', userRoutes);
app.use('/api/login', loginRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/trial', trial);
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
app.use('/api/stats', stats);
app.use('/api/forgot-password', forgotPasswordRoutes);

app.get('/api/ip', (req, res) => {
  res.status(200).json({ ip: req.clientIp });
});

app.use('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

app.all(/(.*)/, (req, res, next) => {
  const err = new CustomError(`Can't find the ${req.originalUrl} on the server!`, 404);
  next(err);
});

app.use((error, req, res, next) => {
  logger.error(`Error: ${error.message}`, {
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.clientIp
  });
  error.statusCode = error.statusCode || 500;
  res.status(error.statusCode).json({
    success: false,
    message: error.message,
    error: process.env.NODE_ENV == 'production' ? {} : error
  });
});

const port = process.env.PORT || 9012;

app.listen(port, async () => {
  console.log(`Server is listening on port ${port}`);
});

process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down...");
  process.exit(0);
});