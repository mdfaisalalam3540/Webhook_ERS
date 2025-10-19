import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";
import dotenv from "dotenv";

// Import route modules
import { eventRoutes } from "./src/routes/eventRoutes.js";
import { subscriptionRoutes } from "./src/routes/subscriptionRoutes.js";
import { dashboardRoutes } from "./src/routes/dashboardRoutes.js";

// Load environment variables from .env file
dotenv.config();

// Initialize Express application
const app = express();

// ==================== MIDDLEWARE CONFIGURATION ====================

// Security middleware - sets various HTTP headers for security
app.use(helmet());

// CORS middleware - allows cross-origin requests from frontend
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173", // Frontend URL
    credentials: true, // Allow cookies and authentication headers
  })
);

// JSON parsing middleware - limits request size to 10MB
app.use(express.json({ limit: "10mb" }));

// Rate limiting middleware - prevents brute force attacks
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes time window
  max: 1000, // Maximum 1000 requests per window per IP
  message: {
    error: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use(limiter);

// ==================== ROUTE CONFIGURATION ====================

// Event-related routes - handling event ingestion and retrieval
app.use("/api/events", eventRoutes);

// Subscription management routes - CRUD operations for webhook subscriptions
app.use("/api/subscriptions", subscriptionRoutes);

// Dashboard and monitoring routes - statistics and delivery logs
app.use("/api/dashboard", dashboardRoutes);

// ==================== HEALTH CHECK ENDPOINT ====================

/**
 * Health check endpoint to verify server status
 * Useful for load balancers and monitoring systems
 */
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    service: "Algohire Webhook Relay Server",
  });
});

// ==================== ERROR HANDLING MIDDLEWARE ====================

/**
 * Global error handling middleware
 * Catches any unhandled errors in the application
 */
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err.stack);
  res.status(500).json({
    success: false,
    error: "Internal server error",
  });
});

// ==================== DATABASE CONNECTION ====================

/**
 * MongoDB connection using Mongoose
 * Connects to MongoDB database with retry logic
 */
mongoose
  .connect(
    process.env.MONGODB_URI || "mongodb://localhost:27017/algohire-webhooks"
    // Deprecated options removed: useNewUrlParser and useUnifiedTopology
  )
  .then(() => console.log("Connected to MongoDB successfully"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1); // Exit process if database connection fails
  });

// ==================== SERVER STARTUP ====================

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Algohire Webhook Relay Server running on port ${PORT}`);
  console.log(`Dashboard available at: http://localhost:${PORT}/api/dashboard`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});
