import express from "express";
import { protect } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rateLimit.js";
import {
  createMeeting,
  getMeeting,
  getMeetingStats,
  updatePlan,
  getSessionDetails,
  getUserSessions,
  getMeetingMemories,
  getMeetingMemoryById,
  generateMeetingMemory,
  updateMeetingMemory,
  getActionItems,
  createActionItem,
  updateActionItem,
  deleteActionItem,
} from "../controllers/meetingController.js";

const meetingRouter = express.Router();

// Rate limiters for abuse prevention
const createMeetingLimiter = rateLimit({
  windowMs: 60000,
  max: 15,
  message: "Too many meetings created recently. Please wait a moment.",
});

const aiMemoryLimiter = rateLimit({
  windowMs: 60000,
  max: 10,
  message: "Too many memory synthesis requests. Please wait a moment.",
});

// Meetings Lifecycle
meetingRouter.post("/", protect, createMeetingLimiter, createMeeting);
meetingRouter.get("/stats", protect, getMeetingStats);
meetingRouter.post("/plan", protect, updatePlan);
meetingRouter.get("/sessions", protect, getUserSessions);
meetingRouter.get("/sessions/:id", protect, getSessionDetails);

// Meeting Memory
meetingRouter.get("/memories", protect, getMeetingMemories);
meetingRouter.get("/memories/:meetingId", protect, getMeetingMemoryById);
meetingRouter.post("/memories/:meetingId/generate", protect, aiMemoryLimiter, generateMeetingMemory);
meetingRouter.patch("/memories/:meetingId", protect, updateMeetingMemory);

// Action Tracker
meetingRouter.get("/actions/list", protect, getActionItems);
meetingRouter.post("/actions", protect, createActionItem);
meetingRouter.patch("/actions/:id", protect, updateActionItem);
meetingRouter.delete("/actions/:id", protect, deleteActionItem);

// Specific meeting by code/id
meetingRouter.get("/:meetingId", protect, getMeeting);

export default meetingRouter;
