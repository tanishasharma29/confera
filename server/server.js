import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config();
dotenv.config({ path: path.join(__dirname, ".env") });

import cors from "cors"; 
import http from "http";
import cookieParser from "cookie-parser"; 
import { initDB } from "./config/db.js"; 
import { clerkMiddleware } from '@clerk/express';
import { handleClerkWebhook } from "./controllers/webhookController.js";
import meetingRouter from './routes/meetingRoutes.js';
import { Server } from "socket.io";
import { setupSocketIO } from "./socket.js";

const app = express();
const server = http.createServer(app);

// Graceful Neon DB initialization at startup
try {
  await initDB();
} catch (err) {
  console.warn("[Database] Startup initialization warning (database will initialize on demand):", err.message);
}

const allowedOrigins = (process.env.ORIGINS || "http://localhost:5173,http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes("*")) {
        return callback(null, true);
      }
      return callback(null, true); // Dev fallback
    },
    credentials: true,
  })
);

app.use(cookieParser());

// Basic Security Headers
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
});

// Clerk Webhook with raw body
app.use("/api/clerk", express.raw({ type: "application/json" }), handleClerkWebhook);

app.use(express.json({ limit: "1mb" }));
app.get("/", (_req, res) => res.json({ status: "ok", app: "Confera API", version: "1.0.0" }));
app.get("/health", (_req, res) => res.json({ status: "healthy", timestamp: new Date().toISOString() }));

app.use(
  clerkMiddleware({
    secretKey: process.env.CLERK_SECRET_KEY,
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
  })
);

app.use("/api/meetings", meetingRouter);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
  pingTimeout: 30000,
  pingInterval: 10000,
});

setupSocketIO(io);

// Centralized Error Handler
app.use((err, _req, res, _next) => {
  console.error(`[Server Error]: ${err.message}`);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === "production" ? "Internal server error" : err.message,
  });
});

const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== "test") {
  server.listen(PORT, () => {
    console.log(`Confera server running at http://localhost:${PORT}`);
  });
}

export { app, server };
