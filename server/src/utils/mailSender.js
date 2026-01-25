// import nodemailer from 'nodemailer';
// import CustomError from './customError.js';

// const transporter = nodemailer.createTransport({
//   host: process.env.SMTP_HOST,
//   port: process.env.SMTP_PORT,
//   secure: false,
//   auth: {
//     user: process.env.SMTP_USER,
//     pass: process.env.SMTP_PASS
//   },
//   tls: {
//     rejectUnauthorized: false
//   }
// });

// const sendMail = ({ to, subject, text, html }) => {
//   transporter.sendMail({ from: `"SACL Digital Trial Card" <${process.env.SMTP_USER}>`, to, subject, text, html }, (error, info) => {
//     if (error) {
//       throw new CustomError(error.message, error.statusCode || 500);
//     }
//   });
// };

// export default sendMail;

import { Resend } from 'resend';
import CustomError from './customError.js';

const resend = new Resend(process.env.RESEND_API_KEY);

const transporter = {
  sendMail: async ({ to, subject, text, html }) => {
    try {
      const { data, error } = await resend.emails.send({
        from: process.env.EMAIL_FROM,
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

export default transporter.sendMail;