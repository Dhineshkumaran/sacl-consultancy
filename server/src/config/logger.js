import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const transports = [
  new winston.transports.Console({
    level: process.env.NODE_ENV === "production" ? "info" : "debug",
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }),

  new DailyRotateFile({
    filename: "logs/combined/app-%DATE%.log",
    datePattern: "YYYY-MM-DD",
    maxSize: "20m",
    maxFiles: "14d",
    level: "info"
  }),

  new DailyRotateFile({
    filename: "logs/error/error-%DATE%.log",
    datePattern: "YYYY-MM-DD",
    maxSize: "20m",
    maxFiles: "30d",
    level: "error"
  })
];

const logger = winston.createLogger({
  level: "info",
  format: logFormat,
  transports
});

export default logger;