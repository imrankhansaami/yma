import dotenv from "dotenv";
dotenv.config();
import http from "http";
import app from "./app";
import { config } from "./app/config/config";
import connectDB from "./app/config/db";
import { startCustomerEmailJobs } from "./app/jobs/customerEmails.job";

const server = http.createServer(app);

server.listen(config.port, async () => {
  console.log(`Server running on port ${config.port}`);
});
// 4) DATABASE CONNECTION
connectDB()
  .then(() => {
    // Automatic customer emails: delivery reminders and the thank-you.
    startCustomerEmailJobs();
  })
  .catch((error) => {
    console.error("Database connection failed:", error);
  });

process.on("unhandledRejection", (err: Error) => {
  console.log("Unhandled Rejection:", err);
  server.close(() => {
    process.exit(1);
  });
});

process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully");
  server.close(() => {
    console.log("Process terminated");
  });
});
