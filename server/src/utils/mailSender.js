import nodemailer from 'nodemailer';
import CustomError from './customError.js';

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

const sendMail = ({ to, subject, text, html }) => {
  transporter.sendMail({ from: `"SACL Digital Trial Card" <${process.env.SMTP_USER}>`, to, subject, text, html }, (error, info) => {
    if (error) {
      throw new CustomError(error.message, error.statusCode || 500);
    }
  });
};

const sendMailToAllDepartments = async ({ to, subject, text, html }) => {
  to.forEach(email => {
    transporter.sendMail({ from: `"SACL Digital Trial Card" <${process.env.SMTP_USER}>`, to: email, subject, text, html }, (error, info) => {
      if (error) {
        throw new CustomError(error.message, error.statusCode || 500);
      }
    });
  });
}

export default sendMail;
