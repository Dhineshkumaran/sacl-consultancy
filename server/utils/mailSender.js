// import nodemailer from 'nodemailer';

// const transporter = nodemailer.createTransport({
//   host: 'smtp.gmail.com',
//   port: 587,
//   secure: false,
//   auth: {
//     user: process.env.SMTP_USER,
//     pass: process.env.SMTP_PASS
//   },
//   tls: {
//     rejectUnauthorized: false
//   }
// });

// export default transporter;

import { Resend } from 'resend';
import CustomError from './customError.js';

const resend = new Resend(process.env.RESEND_API_KEY);

const transporter = {
  sendMail: async ({ to, subject, text, html }) => {
    try {
      const { data, error } = await resend.emails.send({
        from: process.env.EMAIL_FROM || 'SACL Consultancy <onboarding@resend.dev>',
        to: 'dhineshkumarans.22cse@kongu.edu',
        subject,
        text,
        html,
      });

      if (error) {
        throw new CustomError(error.message, error.statusCode || 500);
      }
      return data;
    } catch (err) {
      if (err instanceof CustomError) throw err;
      throw new CustomError(err.message, err.statusCode || 500);
    }
  }
};

export default transporter;