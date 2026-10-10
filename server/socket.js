
import { sql } from "./config/db.js";

// Socket.IO Room State: roomId -> Map<socketId, participantObject>
const rooms = new Map();

export function setupSocketIO(io) {
    io.on("connection", (socket) => {
        let currentRoomId = null;
        let currentUser = null;

        // User joins a meeting room
        socket.on("joinRoom", async ({ roomId, user, audioEnabled = true, videoEnabled = true }) => {
            try {
                // Verify meeting status from the database
                const meetings = await sql`
                    SELECT * FROM meetings WHERE meeting_id = ${roomId}
                `;

                if (meetings.length === 0) {
                    socket.emit("meeting-ended", { message: "Meeting not found." });
                    return;
                }

                const meeting = meetings[0];

                if (meeting.status === "ended") {
                    socket.emit("meeting-ended", {
                        message: "This meeting has already ended."
                    });
                    return;
                }

                currentRoomId = roomId;

                const isHost =
                    meeting.host_id &&
                    user?.id &&
                    meeting.host_id.toString() === user.id.toString();

                currentUser = {
                    socketId: socket.id,
                    userId: user?.id,
                    userName: user?.name || "Anonymous",
                    isHost,
                    audioEnabled,
                    videoEnabled,
                };

                if (!rooms.has(roomId)) {
                    rooms.set(roomId, new Map());
                }

                const roomParticipants = rooms.get(roomId);

                // Fetch host plan to enforce participant limits
                // Free: 10 participants; Premium: 100 participants
                const hosts = await sql`
                    SELECT plan FROM users WHERE id = ${meeting.host_id}
                `;

                const hostPlan = hosts[0]?.plan || "free";
                const maxParticipants = hostPlan === "premium" ? 100 : 10;

                if (
                    !roomParticipants.has(socket.id) &&
                    roomParticipants.size >= maxParticipants
                ) {
                    socket.emit("meeting-ended", {
                        message: `Meeting capacity limit reached (max: ${maxParticipants} participants for ${hostPlan.toUpperCase()} plan). Host must upgrade to Premium for up to 100 participants!`
                    });

                    if (roomParticipants.size === 0) {
                        rooms.delete(roomId);
                    }

                    return;
                }

                socket.join(roomId);

                // Get existing participants in the room
                const existingUsers = Array.from(roomParticipants.values());

                // Add new participant to socket state
                roomParticipants.set(socket.id, currentUser);

                // Save participant into database if not already present
                const userId = user?.id || null;

                const existingParticipants = await sql`
                    SELECT id
                    FROM meeting_participants
                    WHERE meeting_id = ${meeting.id}
                    AND (
                        (
                            ${userId}::text IS NOT NULL
                            AND user_id = ${userId}
                        )
                        OR name = ${currentUser.userName}
                    )
                `;

                if (existingParticipants.length === 0) {
                    await sql`
                        INSERT INTO meeting_participants
                            (meeting_id, user_id, name, joined_at)
                        VALUES
                            (${meeting.id}, ${userId}, ${currentUser.userName}, NOW())
                    `;
                }

                // Send list of existing users to the newcomer
                socket.emit("all-users", existingUsers);

                // Notify everyone else in the room
                socket.to(roomId).emit("user-joined", currentUser);

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

                socket.emit("meeting-ended", {
                    message: "Failed to join room."
                });
            }
        });

        // WebRTC signaling: offer
        socket.on("offer", ({ targetSocketId, callerSocketId, sdp }) => {
            if (!targetSocketId) return;

            io.to(targetSocketId).emit("offer", {
                callerSocketId: callerSocketId || socket.id,
                sdp,
                callerUser: currentUser,
            });
        });

        // WebRTC signaling: answer
        socket.on("answer", ({ targetSocketId, responderSocketId, sdp }) => {
            if (!targetSocketId) return;

            io.to(targetSocketId).emit("answer", {
                responderSocketId: responderSocketId || socket.id,
                sdp,
            });
        });

        // WebRTC signaling: ICE candidate
        socket.on("ice-candidate", ({ targetSocketId, senderSocketId, candidate }) => {
            if (!targetSocketId) return;

            io.to(targetSocketId).emit("ice-candidate", {
                senderSocketId: senderSocketId || socket.id,
                candidate,
            });
        });

        // Audio toggle event
        socket.on("toggle-audio", ({ roomId, audioEnabled }) => {
            if (roomId !== currentRoomId) return;

            if (rooms.has(roomId) && rooms.get(roomId).has(socket.id)) {
                rooms.get(roomId).get(socket.id).audioEnabled = audioEnabled;

                socket.to(roomId).emit("user-toggled-audio", {
                    socketId: socket.id,
                    audioEnabled,
                });
            }
        });

        // Video toggle event
        socket.on("toggle-video", ({ roomId, videoEnabled }) => {
            if (roomId !== currentRoomId) return;

            if (rooms.has(roomId) && rooms.get(roomId).has(socket.id)) {
                rooms.get(roomId).get(socket.id).videoEnabled = videoEnabled;

                socket.to(roomId).emit("user-toggled-video", {
                    socketId: socket.id,
                    videoEnabled,
                });
            }
        });

        // Chat message event: persist to database and broadcast
        socket.on("send-message", async ({ roomId, message }) => {
            try {
                if (roomId !== currentRoomId || !message?.text?.trim()) {
                    return;
                }

                const meetings = await sql`
                    SELECT id, status
                    FROM meetings
                    WHERE meeting_id = ${roomId}
                `;

                if (meetings.length > 0 && meetings[0].status !== "ended") {
                    const meetingId = meetings[0].id;
                    const senderId = message.senderId || null;

                    await sql`
                        INSERT INTO meeting_messages
                            (meeting_id, sender_id, sender_name, text, timestamp)
                        VALUES
                            (
                                ${meetingId},
                                ${senderId},
                                ${message.senderName || currentUser?.userName || "Anonymous"},
                                ${message.text.trim()},
                                NOW()
                            )
                    `;

                    io.to(roomId).emit("receive-message", {
                        ...message,
                        text: message.text.trim(),
                        senderName: message.senderName || currentUser?.userName || "Anonymous",
                        senderSocketId: socket.id,
                    });
                } else {
                    socket.emit("meeting-ended", {
                        message: "This meeting is no longer active."
                    });
                }
            } catch (error) {
                console.error("Error saving chat message to DB:", error);
            }
        });

        // Host explicitly ends meeting for everyone
        socket.on("end-meeting", async ({ roomId }) => {
            try {
                if (
                    roomId !== currentRoomId ||
                    !currentUser?.isHost
                ) {
                    socket.emit("meeting-error", {
                        message: "Only the meeting host can end this meeting."
                    });
                    return;
                }

                const meetings = await sql`
                    UPDATE meetings
                    SET status = 'ended', ended_at = NOW()
                    WHERE meeting_id = ${roomId}
                    AND status <> 'ended'
                    RETURNING id
                `;

                if (meetings.length === 0) {
                    socket.emit("meeting-ended", {
                        message: "This meeting has already ended."
                    });
                    return;
                }

                io.to(roomId).emit("meeting-ended", {
                    message: "The meeting has been ended by the host."
                });

                // Remove all participants from the Socket.IO room
                const roomParticipants = rooms.get(roomId);

                if (roomParticipants) {
                    for (const socketId of roomParticipants.keys()) {
                        const participantSocket = io.sockets.sockets.get(socketId);
                        participantSocket?.leave(roomId);
                    }
                }

                rooms.delete(roomId);

            } catch (error) {
                console.error("Error ending meeting:", error);

                socket.emit("meeting-error", {
                    message: "Failed to end meeting."
                });
            }
        });

        // Handle disconnect: reload, network drop, or closing tab
        socket.on("disconnect", () => {
            if (currentRoomId && rooms.has(currentRoomId)) {
                const roomParticipants = rooms.get(currentRoomId);

                roomParticipants.delete(socket.id);

                if (roomParticipants.size === 0) {
                    rooms.delete(currentRoomId);
                } else {
                    // Notify remaining peers that a user disconnected
                    socket.to(currentRoomId).emit("user-left", {
                        socketId: socket.id,
                        user: currentUser,
                    });
                }
            }
        });
    });
}
