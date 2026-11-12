import { verifyToken } from "@clerk/express";
import { sql, ensureUserInDatabase } from "./config/db.js";

// Socket.IO Room State: roomId -> Map<socketId, participantObject>
const rooms = new Map();

export function setupSocketIO(io) {
  // Authentication middleware on Socket.IO connection
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        (socket.handshake.headers?.authorization?.startsWith("Bearer ")
          ? socket.handshake.headers.authorization.split(" ")[1]
          : null);

      if (!token) {
        return next(new Error("Authentication error: Missing token"));
      }

      let extractedUserId = null;

      if (process.env.CLERK_SECRET_KEY) {
        try {
          const verifyOpts = { secretKey: process.env.CLERK_SECRET_KEY };
          if (process.env.CLERK_JWT_KEY) verifyOpts.jwtKey = process.env.CLERK_JWT_KEY;
          const payload = await verifyToken(token, verifyOpts);
          if (payload?.sub) {
            extractedUserId = payload.sub;
          }
        } catch (err) {
          console.warn(`[Socket Auth] Token verification failed from socket ${socket.id}:`, err.message);
          return next(new Error("Authentication error: Invalid or unverifiable token"));
        }
      }

      if (!extractedUserId) {
        return next(new Error("Authentication error: Unauthorized connection"));
      }

      socket.userId = extractedUserId;
      socket.isAuthenticated = true;

      // Fetch or provision user in DB
      const dbUser = await ensureUserInDatabase(socket.userId);
      socket.userName = dbUser?.name || "Participant";
      socket.userEmail = dbUser?.email || "";
      socket.userPlan = dbUser?.plan || "free";

      next();
    } catch (err) {
      console.error("[Socket Middleware Error]:", err);
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    let currentRoomId = null;
    let currentUser = null;

    // User joins a meeting room
    socket.on("joinRoom", async ({ roomId, user: clientUser, audioEnabled = true, videoEnabled = true }) => {
      try {
        if (!roomId || typeof roomId !== "string") {
          socket.emit("meeting-ended", { message: "Invalid meeting ID." });
          return;
        }

        const cleanRoomId = roomId.trim();

        if (!socket.isAuthenticated || !socket.userId) {
          socket.emit("meeting-ended", { message: "Unauthorized: Valid authentication required." });
          return;
        }

        // 1. Verify meeting status from the database
        const meetings = await sql`
          SELECT m.*, u.plan AS host_plan, u.name AS host_name
          FROM meetings m
          JOIN users u ON m.host_id = u.id
          WHERE m.meeting_id = ${cleanRoomId}
        `;

        if (meetings.length === 0) {
          socket.emit("meeting-ended", { message: "Meeting not found." });
          return;
        }

        const meeting = meetings[0];

        if (meeting.status === "ended") {
          socket.emit("meeting-ended", { message: "This meeting has already ended." });
          return;
        }

        // 2. Server-side host identity check (NEVER trust client boolean)
        const isHost = Boolean(
          socket.userId &&
          meeting.host_id &&
          meeting.host_id.toString() === socket.userId.toString()
        );

        // 3. Resolve participant display name securely from verified database identity
        const displayName = socket.userName || "Participant";

        currentRoomId = cleanRoomId;

        currentUser = {
          socketId: socket.id,
          userId: socket.userId || null,
          userName: displayName,
          isHost,
          audioEnabled: Boolean(audioEnabled),
          videoEnabled: Boolean(videoEnabled),
          joinedAt: new Date().toISOString(),
        };

        if (!rooms.has(cleanRoomId)) {
          rooms.set(cleanRoomId, new Map());
        }

        const roomParticipants = rooms.get(cleanRoomId);

        // 4. Capacity limit enforcement (Free: 10, Premium: 100)
        const hostPlan = meeting.host_plan || "free";
        const maxParticipants = hostPlan === "premium" ? 100 : 10;

        if (!roomParticipants.has(socket.id) && roomParticipants.size >= maxParticipants) {
          socket.emit("meeting-ended", {
            message: `Meeting capacity limit reached (${maxParticipants} participants max for ${hostPlan.toUpperCase()} plan). Host must upgrade to Premium for up to 100 participants!`,
          });
          return;
        }

        socket.join(cleanRoomId);

        // List of existing participants to return to the newcomer
        const existingUsers = Array.from(roomParticipants.values());

        // Register participant in room memory
        roomParticipants.set(socket.id, currentUser);

        // 5. Persist participant presence in database
        try {
          const pUserId = socket.userId || null;
          const existingParticipants = await sql`
            SELECT id FROM meeting_participants
            WHERE meeting_id = ${meeting.id}
            AND (
              (${pUserId}::text IS NOT NULL AND user_id = ${pUserId})
              OR name = ${displayName}
            )
            LIMIT 1
          `;

          if (existingParticipants.length === 0) {
            await sql`
              INSERT INTO meeting_participants (meeting_id, user_id, name, joined_at)
              VALUES (${meeting.id}, ${pUserId}, ${displayName}, NOW())
            `;
          }
        } catch (dbErr) {
          console.warn("[Socket] Error recording participant presence:", dbErr.message);
        }

        // Notify newcomer of existing peers
        socket.emit("all-users", existingUsers);

        // Notify everyone else in the room
        socket.to(cleanRoomId).emit("user-joined", currentUser);

      } catch (error) {
        console.error("Error joining room in socket:", error);

        if (currentRoomId && rooms.has(currentRoomId)) {
          rooms.get(currentRoomId).delete(socket.id);
          if (rooms.get(currentRoomId).size === 0) {
            rooms.delete(currentRoomId);
          }
        }

        if (currentRoomId) {
          socket.leave(currentRoomId);
        }

        currentRoomId = null;
        currentUser = null;

        socket.emit("meeting-ended", { message: "Failed to join room." });
      }
    });

    // WebRTC signaling: offer
    socket.on("offer", ({ targetSocketId, sdp }) => {
      if (!targetSocketId || !currentRoomId) return;

      const room = rooms.get(currentRoomId);
      if (!room || !room.has(targetSocketId)) return; // Prevent cross-room signaling

      io.to(targetSocketId).emit("offer", {
        callerSocketId: socket.id,
        sdp,
        callerUser: currentUser,
      });
    });

    // WebRTC signaling: answer
    socket.on("answer", ({ targetSocketId, sdp }) => {
      if (!targetSocketId || !currentRoomId) return;

      const room = rooms.get(currentRoomId);
      if (!room || !room.has(targetSocketId)) return;

      io.to(targetSocketId).emit("answer", {
        responderSocketId: socket.id,
        sdp,
      });
    });

    // WebRTC signaling: ICE candidate
    socket.on("ice-candidate", ({ targetSocketId, candidate }) => {
      if (!targetSocketId || !currentRoomId || !candidate) return;

      const room = rooms.get(currentRoomId);
      if (!room || !room.has(targetSocketId)) return;

      io.to(targetSocketId).emit("ice-candidate", {
        senderSocketId: socket.id,
        candidate,
      });
    });

    // Audio toggle event
    socket.on("toggle-audio", ({ roomId, audioEnabled }) => {
      if (roomId !== currentRoomId) return;

      if (rooms.has(roomId) && rooms.get(roomId).has(socket.id)) {
        rooms.get(roomId).get(socket.id).audioEnabled = Boolean(audioEnabled);

        socket.to(roomId).emit("user-toggled-audio", {
          socketId: socket.id,
          audioEnabled: Boolean(audioEnabled),
        });
      }
    });

    // Video toggle event
    socket.on("toggle-video", ({ roomId, videoEnabled }) => {
      if (roomId !== currentRoomId) return;

      if (rooms.has(roomId) && rooms.get(roomId).has(socket.id)) {
        rooms.get(roomId).get(socket.id).videoEnabled = Boolean(videoEnabled);

        socket.to(roomId).emit("user-toggled-video", {
          socketId: socket.id,
          videoEnabled: Boolean(videoEnabled),
        });
      }
    });

    // Chat message event
    socket.on("send-message", async ({ roomId, message }) => {
      try {
        if (roomId !== currentRoomId || !message?.text?.trim()) {
          return;
        }

        // Must be in room
        if (!socket.rooms.has(roomId)) {
          return;
        }

        const sanitizedText = message.text.trim().slice(0, 2000);
        if (!sanitizedText) return;

        const meetings = await sql`
          SELECT id, status FROM meetings WHERE meeting_id = ${roomId}
        `;

        if (meetings.length === 0 || meetings[0].status === "ended") {
          socket.emit("meeting-ended", { message: "This meeting is no longer active." });
          return;
        }

        const meetingId = meetings[0].id;
        const senderId = socket.userId || null;
        const senderName = currentUser?.userName || "Participant";

        const [savedMsg] = await sql`
          INSERT INTO meeting_messages (meeting_id, sender_id, sender_name, text, timestamp)
          VALUES (${meetingId}, ${senderId}, ${senderName}, ${sanitizedText}, NOW())
          RETURNING id, timestamp
        `;

        io.to(roomId).emit("receive-message", {
          id: savedMsg?.id?.toString() || Date.now().toString(),
          senderId,
          senderName,
          text: sanitizedText,
          timestamp: savedMsg?.timestamp || new Date().toISOString(),
          senderSocketId: socket.id,
        });
      } catch (error) {
        console.error("Error saving chat message to DB:", error);
      }
    });

    // Host ends meeting for everyone
    socket.on("end-meeting", async ({ roomId }) => {
      try {
        if (roomId !== currentRoomId) {
          socket.emit("meeting-error", { message: "Invalid meeting room." });
          return;
        }

        // Verify host status from database strictly against verified socket.userId
        const meetings = await sql`
          SELECT id, host_id, status FROM meetings WHERE meeting_id = ${roomId}
        `;

        if (meetings.length === 0) {
          socket.emit("meeting-error", { message: "Meeting not found." });
          return;
        }

        const meeting = meetings[0];

        // Strict authorization check
        if (!socket.userId || meeting.host_id.toString() !== socket.userId.toString()) {
          socket.emit("meeting-error", {
            message: "Unauthorized: Only the meeting host can end this meeting.",
          });
          return;
        }

        await sql`
          UPDATE meetings
          SET status = 'ended', ended_at = NOW(), updated_at = NOW()
          WHERE meeting_id = ${roomId}
          AND status <> 'ended'
        `;

        // Update participants left_at
        await sql`
          UPDATE meeting_participants
          SET left_at = NOW()
          WHERE meeting_id = ${meeting.id} AND left_at IS NULL
        `;

        io.to(roomId).emit("meeting-ended", {
          message: "The meeting has been ended by the host.",
        });

        // Clean up socket room
        const roomParticipants = rooms.get(roomId);
        if (roomParticipants) {
          for (const socketId of roomParticipants.keys()) {
            const pSocket = io.sockets.sockets.get(socketId);
            pSocket?.leave(roomId);
          }
        }
        rooms.delete(roomId);

      } catch (error) {
        console.error("Error ending meeting:", error);
        socket.emit("meeting-error", { message: "Failed to end meeting." });
      }
    });

    // Handle disconnect
    socket.on("disconnect", async () => {
      if (currentRoomId && rooms.has(currentRoomId)) {
        const roomParticipants = rooms.get(currentRoomId);
        roomParticipants.delete(socket.id);

        if (roomParticipants.size === 0) {
          rooms.delete(currentRoomId);
        } else {
          socket.to(currentRoomId).emit("user-left", {
            socketId: socket.id,
            user: currentUser,
          });
        }
      }
    });
  });
}
