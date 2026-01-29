import nodemailer from 'nodemailer';
import CustomError from './customError.js';
import logger from '../config/logger.js';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

const sendMail = async ({ to, subject, text, html }) => {
  if(Array.isArray(to)){
    to.forEach(email => {
      transporter.sendMail({ from: `"SACL Digital Trial Card" <${process.env.SMTP_USER}>`, to: email, subject, text, html }, (error, info) => {
        if (error) {
           logger.error('Email sending unexpected error:', err.message);
           return { success: false, error: err.message };
        }
      });
    });
  }else{
    transporter.sendMail({ from: `"SACL Digital Trial Card" <${process.env.SMTP_USER}>`, to: to, subject, text, html }, (error, info) => {
      if (error) {
         logger.error('Email sending unexpected error:', error.message);
         return { success: false, error: error.message };
      }
    });
  }
}

export default sendMail;