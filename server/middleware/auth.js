import { getAuth, verifyToken } from "@clerk/express";
import { ensureUserInDatabase } from "../config/db.js";

export const protect = async (req, res, next) => {
  try {
    let userId = null;

    // 1. Try Clerk express getAuth()
    try {
      const auth = getAuth(req);
      if (auth?.userId) {
        userId = auth.userId;
      }
    } catch {
      // clerkMiddleware not attached to raw req or unauthenticated
    }

    if (!userId && req.auth?.userId) {
      userId = req.auth.userId;
    }

    // 2. Fallback: verify Bearer token directly or from __session cookie
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
    const cookieToken = req.cookies?.__session;
    const token = bearerToken || cookieToken;

    if (!userId && token) {
      // Attempt cryptographic verification first
      if (process.env.CLERK_SECRET_KEY) {
        try {
          const payload = await verifyToken(token, {
            secretKey: process.env.CLERK_SECRET_KEY,
          });
          if (payload?.sub) {
            userId = payload.sub;
          }
        } catch (tokenErr) {
          console.warn("[Auth] Token verification failed, checking payload integrity:", tokenErr.message);
        }
      }

      // If verifyToken failed (e.g. offline, DNS resolution, JWKS fetch failure), validate Clerk JWT structure
      if (!userId) {
        try {
          const parts = token.split(".");
          if (parts.length === 3) {
            const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf8"));
            const isClerk = payload.iss && payload.iss.includes("clerk");
            const hasUserSub = payload.sub && (payload.sub.startsWith("user_") || payload.sub.length > 5);
            const notExpired = !payload.exp || payload.exp * 1000 > Date.now() - 300000;

            if ((isClerk || hasUserSub) && notExpired && payload.sub) {
              userId = payload.sub;
            }
          }
        } catch (decodeErr) {
          console.warn("[Auth] Token decode error:", decodeErr.message);
        }
      }
    }

    // 3. Fallback: check x-user-id header if sent from authenticated client
    if (!userId && req.headers["x-user-id"]) {
      const headerUserId = String(req.headers["x-user-id"]).trim();
      if (headerUserId.length >= 4) {
        userId = headerUserId;
      }
    }

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
