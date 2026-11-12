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
import { initDB, sql } from "./config/db.js"; 
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

// Validate essential environment variables
const isProduction = process.env.NODE_ENV === "production";
const requiredEnvVars = ["DATABASE_URL", "CLERK_SECRET_KEY"];
const missingEnvVars = requiredEnvVars.filter((v) => !process.env[v]);
if (missingEnvVars.length > 0) {
  if (isProduction) {
    console.error(`[CRITICAL] Missing required environment variables in production: ${missingEnvVars.join(", ")}`);
  } else {
    console.warn(`[Config] Notice: Missing optional/dev environment variables: ${missingEnvVars.join(", ")}`);
  }
}

const defaultDevOrigins = ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173", "http://127.0.0.1:3000"];
const allowedOrigins = process.env.ORIGINS
  ? process.env.ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean)
  : (isProduction ? [] : defaultDevOrigins);

const isOriginAllowed = (origin) => {
  if (!origin) return true; // Direct non-browser requests (e.g. health checks, server-to-server)
  if (allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
    return true;
  }
  if (!isProduction && (origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:"))) {
    return true;
  }
  return false;
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS policy violation: origin '${origin}' is not allowed.`));
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

app.get("/health", async (_req, res) => {
  let dbStatus = "unreachable";
  try {
    const [row] = await sql`SELECT 1 as connected`;
    if (row?.connected === 1) dbStatus = "connected";
  } catch (err) {
    dbStatus = "error: " + err.message;
  }
  const isHealthy = dbStatus === "connected" || !process.env.DATABASE_URL;
  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? "healthy" : "degraded",
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
});

app.use(
  clerkMiddleware({
    secretKey: process.env.CLERK_SECRET_KEY,
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
  })
);

app.use("/api/meetings", meetingRouter);

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Socket.IO CORS policy violation: origin '${origin}' is not allowed.`));
    },
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
const isMainModule = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isMainModule && process.env.NODE_ENV !== "test") {
  server.listen(PORT, () => {
    console.log(`Confera server running at http://localhost:${PORT}`);
  });
}

export { app, server };
