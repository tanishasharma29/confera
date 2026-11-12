import { getAuth, verifyToken } from "@clerk/express";
import { ensureUserInDatabase } from "../config/db.js";

/**
 * Express middleware to enforce cryptographically verified Clerk authentication.
 * 1. Checks Clerk authentication via getAuth(req) / req.auth()
 * 2. Cryptographically verifies Bearer token via verifyToken() with CLERK_SECRET_KEY
 * 3. Rejects missing, expired, invalid, or unverifiable tokens with HTTP 401.
 * 4. NEVER trusts unverified client headers (x-user-id) or unverified JWT payloads.
 */
export const protect = async (req, res, next) => {
  try {
    let userId = null;

    // 1. Check verified Clerk authentication from clerkMiddleware
    try {
      const auth = getAuth(req);
      if (auth?.userId) {
        userId = auth.userId;
      }
    } catch {
      // clerkMiddleware not attached to req or unauthenticated
    }

    if (!userId && typeof req.auth === "function") {
      try {
        const authObj = req.auth();
        if (authObj?.userId) {
          userId = authObj.userId;
        }
      } catch {
        // ignore
      }
    }

    // 2. Cryptographic token verification for Bearer header or __session cookie
    if (!userId) {
      const authHeader = req.headers.authorization;
      const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
      const cookieToken = req.cookies?.__session;
      const token = bearerToken || cookieToken;

      if (token && process.env.CLERK_SECRET_KEY) {
        try {
          const verifyOpts = { secretKey: process.env.CLERK_SECRET_KEY };
          if (process.env.CLERK_JWT_KEY) {
            verifyOpts.jwtKey = process.env.CLERK_JWT_KEY;
          }
          const payload = await verifyToken(token, verifyOpts);
          if (payload?.sub) {
            userId = payload.sub;
          }
        } catch (tokenErr) {
          console.warn("[Auth] Cryptographic verification failed:", tokenErr.message);
        }
      }
    }

    // 3. Strict rejection: if no verified identity, reject with 401
    if (!userId) {
      return res.status(401).json({
        error: "Not Authorized: Valid authentication required",
      });
    }

    // Ensure user record exists in database
    const dbUser = await ensureUserInDatabase(userId);

    req.user = {
      id: userId,
      plan: dbUser?.plan || "free",
      name: dbUser?.name || "User",
    };

    next();
  } catch (error) {
    console.error("[Auth Middleware Error]:", error);
    return res.status(401).json({ error: "Authentication failed" });
  }
};
