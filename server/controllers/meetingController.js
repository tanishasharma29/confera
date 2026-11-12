import { sql, ensureUserInDatabase } from "../config/db.js";

const generateMeetingId = () => {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const segment = (len) =>
    Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `${segment(3)}-${segment(3)}-${segment(3)}`;
};

// 1. Create meeting
export const createMeeting = async (req, res) => {
  try {
    const rawTitle = req.body?.title;
    const title = typeof rawTitle === "string" && rawTitle.trim()
      ? rawTitle.trim().slice(0, 200)
      : "Instant Meeting";

    const userId = req.user.id;

    // Ensure host exists in database
    const userRecord = await ensureUserInDatabase(userId, { name: req.user.name });
    const userPlan = userRecord?.plan || "free";

    // Check monthly limit (30 meetings for free plan)
    if (userPlan === "free") {
      const monthlyCountResult = await sql`
        SELECT COUNT(*) as count
        FROM meetings
        WHERE host_id = ${userId}
        AND created_at >= date_trunc('month', NOW())
      `;

      const monthlyCount = parseInt(monthlyCountResult[0]?.count || "0", 10);

      if (monthlyCount >= 30) {
        return res.status(403).json({
          error: "Monthly limit reached. Free plan includes 30 meetings per month. Upgrade to Pro for unlimited meetings!",
          limitReached: true,
          monthlyCount,
          limit: 30,
        });
      }
    }

    // Generate unique meeting ID
    let meetingId = generateMeetingId();
    let existing = await sql`SELECT id FROM meetings WHERE meeting_id = ${meetingId}`;

    let attempts = 0;
    while (existing.length > 0 && attempts < 10) {
      meetingId = generateMeetingId();
      existing = await sql`SELECT id FROM meetings WHERE meeting_id = ${meetingId}`;
      attempts++;
    }

    const [meeting] = await sql`
      INSERT INTO meetings (meeting_id, title, host_id, status)
      VALUES (${meetingId}, ${title}, ${userId}, 'active')
      RETURNING id, meeting_id, title, host_id, status, created_at
    `;

    const hostName = userRecord?.name || "Host";

    // Insert host into participants
    await sql`
      INSERT INTO meeting_participants (meeting_id, user_id, name)
      VALUES (${meeting.id}, ${userId}, ${hostName})
    `;

    res.status(201).json({
      meeting: {
        id: meeting.id,
        meeting_id: meeting.meeting_id,
        title: meeting.title,
        host: meeting.host_id,
        status: meeting.status,
        created_At: meeting.created_at,
      },
    });
  } catch (error) {
    console.error("createMeeting failed:", error);
    res.status(500).json({ error: "Failed to create meeting" });
  }
};

// 2. Get meeting by ID
export const getMeeting = async (req, res) => {
  try {
    const { meetingId } = req.params;
    if (!meetingId) {
      return res.status(400).json({ error: "Meeting ID is required" });
    }

    const cleanId = meetingId.trim();

    const meetings = await sql`
      SELECT
        m.*,
        u.id AS host_user_id,
        u.name AS host_name,
        u.email AS host_email
      FROM meetings m
      JOIN users u ON m.host_id = u.id
      WHERE m.meeting_id = ${cleanId}
    `;

    if (meetings.length === 0) {
      return res.status(404).json({ error: "Meeting not found" });
    }

    const meeting = meetings[0];

    if (meeting.status === "ended") {
      return res.status(410).json({
        error: "This meeting has already ended",
        meeting: {
          id: meeting.id,
          meeting_id: meeting.meeting_id,
          title: meeting.title,
          status: "ended",
          created_At: meeting.created_at,
          ended_At: meeting.ended_at,
        },
      });
    }

    res.json({
      meeting: {
        id: meeting.id,
        meeting_id: meeting.meeting_id,
        title: meeting.title,
        status: meeting.status,
        created_At: meeting.created_at,
        ended_At: meeting.ended_at,
        host: {
          id: meeting.host_user_id,
          name: meeting.host_name,
          email: meeting.host_email,
        },
      },
    });
  } catch (error) {
    console.error("Fetch Meeting failed:", error);
    res.status(500).json({ error: "Failed to fetch meeting" });
  }
};

// 3. Get all user meetings sessions (Optimized: eliminates N+1 queries)
export const getUserSessions = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || "30", 10)));
    const offset = (page - 1) * limit;

    // Fetch user's meetings with pagination
    const meetings = await sql`
      SELECT DISTINCT
        m.id,
        m.meeting_id,
        m.title,
        m.status,
        m.created_at,
        m.ended_at,
        m.host_id,
        u.name AS host_name,
        u.email AS host_email
      FROM meetings m
      JOIN users u ON m.host_id = u.id
      LEFT JOIN meeting_participants mp ON m.id = mp.meeting_id
      WHERE m.host_id = ${userId} OR mp.user_id = ${userId}
      ORDER BY m.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    if (meetings.length === 0) {
      return res.json({ meetings: [], page, limit });
    }

    const meetingDbIds = meetings.map((m) => m.id);

    // Batch fetch participants in 1 query
    const allParticipants = await sql`
      SELECT mp.*, u.email
      FROM meeting_participants mp
      LEFT JOIN users u ON mp.user_id = u.id
      WHERE mp.meeting_id = ANY(${meetingDbIds})
    `;

    // Batch fetch messages in 1 query
    const allMessages = await sql`
      SELECT id, meeting_id, sender_id, sender_name, text, timestamp
      FROM meeting_messages
      WHERE meeting_id = ANY(${meetingDbIds})
      ORDER BY timestamp ASC
    `;

    // Group in memory
    const participantsByMeeting = new Map();
    for (const p of allParticipants) {
      if (!participantsByMeeting.has(p.meeting_id)) {
        participantsByMeeting.set(p.meeting_id, []);
      }
      participantsByMeeting.get(p.meeting_id).push({
        user: p.user_id ? { id: p.user_id, email: p.email } : null,
        name: p.name,
        joined_At: p.joined_at,
        leftAt: p.left_at,
      });
    }

    const messagesByMeeting = new Map();
    for (const msg of allMessages) {
      if (!messagesByMeeting.has(msg.meeting_id)) {
        messagesByMeeting.set(msg.meeting_id, []);
      }
      messagesByMeeting.get(msg.meeting_id).push({
        id: msg.id,
        sender: msg.sender_id,
        senderName: msg.sender_name,
        text: msg.text,
        timestamp: msg.timestamp,
      });
    }

    const formattedMeetings = meetings.map((m) => ({
      id: m.id,
      meeting_id: m.meeting_id,
      title: m.title,
      status: m.status,
      created_at: m.created_at,
      ended_at: m.ended_at,
      host: {
        id: m.host_id,
        name: m.host_name,
        email: m.host_email,
      },
      participants: participantsByMeeting.get(m.id) || [],
      messages: messagesByMeeting.get(m.id) || [],
    }));

    res.json({ meetings: formattedMeetings, page, limit });
  } catch (error) {
    console.error("get User sessions failed:", error);
    res.status(500).json({ error: "Failed to get user sessions" });
  }
};

// 4. Get meeting session details by ID
export const getSessionDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const meetings = await sql`
      SELECT
        m.*,
        u.id AS host_user_id,
        u.name AS host_name,
        u.email AS host_email
      FROM meetings m
      JOIN users u ON m.host_id = u.id
      WHERE m.meeting_id = ${id}
    `;

    if (meetings.length === 0) {
      return res.status(404).json({ error: "Session details not found" });
    }

    const m = meetings[0];

    // Authorization: User must be host or participant
    if (String(m.host_id) !== String(userId)) {
      const membership = await sql`
        SELECT 1 FROM meeting_participants
        WHERE meeting_id = ${m.id} AND user_id = ${userId}
        LIMIT 1
      `;

      if (membership.length === 0) {
        return res.status(403).json({ error: "Access denied: Not a participant of this meeting" });
      }
    }

    const participants = await sql`
      SELECT mp.*, u.email
      FROM meeting_participants mp
      LEFT JOIN users u ON mp.user_id = u.id
      WHERE mp.meeting_id = ${m.id}
    `;

    const messages = await sql`
      SELECT id, sender_id, sender_name, text, timestamp
      FROM meeting_messages
      WHERE meeting_id = ${m.id}
      ORDER BY timestamp ASC
    `;

    const formattedMeeting = {
      id: m.id,
      meeting_id: m.meeting_id,
      title: m.title,
      status: m.status,
      created_at: m.created_at,
      ended_at: m.ended_at,
      host: {
        id: m.host_user_id,
        name: m.host_name,
        email: m.host_email,
      },
      participants: participants.map((p) => ({
        user: p.user_id ? { id: p.user_id, email: p.email } : null,
        name: p.name,
        joined_At: p.joined_at,
        leftAt: p.left_at,
      })),
      messages: messages.map((msg) => ({
        id: msg.id,
        sender: msg.sender_id,
        senderName: msg.sender_name,
        text: msg.text,
        timestamp: msg.timestamp,
      })),
    };

    res.json({ meeting: formattedMeeting });
  } catch (error) {
    console.error("get Session details failed:", error);
    res.status(500).json({ error: "Failed to get session details" });
  }
};

// 5. Get plan & statistics
export const getMeetingStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const users = await sql`SELECT plan FROM users WHERE id = ${userId}`;
    const plan = users[0]?.plan || "free";

    const monthlyCountResult = await sql`
      SELECT COUNT(*) as count
      FROM meetings
      WHERE host_id = ${userId}
      AND created_at >= date_trunc('month', NOW())
    `;

    const monthlyCount = parseInt(monthlyCountResult[0]?.count || "0", 10);
    const monthlyLimit = plan === "premium" ? null : 30;

    res.json({
      plan,
      monthlyCount,
      monthlyLimit,
      maxParticipants: plan === "premium" ? 100 : 10,
    });
  } catch (error) {
    console.error("get Meeting stats failed:", error);
    res.status(500).json({ error: "Failed to get meeting stats" });
  }
};

// 5b. Update user plan
export const updatePlan = async (req, res) => {
  try {
    const userId = req.user.id;
    const requestedPlan = req.body?.plan;

    if (requestedPlan === "free") {
      await sql`
        UPDATE users SET plan = 'free', updated_at = NOW() WHERE id = ${userId}
      `;
      return res.json({ success: true, plan: "free" });
    }

    if (requestedPlan === "premium") {
      return res.status(501).json({
        error: "Direct client premium activation is disabled. Online billing gateway (Stripe/Razorpay) integration is pending configuration.",
        code: "PAYMENT_GATEWAY_NOT_CONFIGURED",
        paymentAvailable: false,
      });
    }

    return res.status(400).json({ error: "Invalid plan specified. Allowed values: 'free'" });
  } catch (error) {
    console.error("updatePlan failed:", error);
    res.status(500).json({ error: "Failed to update plan" });
  }
};

// 6. Get meeting memories for user
export const getMeetingMemories = async (req, res) => {
  try {
    const userId = req.user.id;

    const memories = await sql`
      SELECT 
        mm.*,
        m.meeting_id,
        m.title AS meeting_title,
        m.created_at AS meeting_date,
        m.status AS meeting_status,
        u.name AS host_name
      FROM meeting_memories mm
      JOIN meetings m ON mm.meeting_id = m.id
      JOIN users u ON m.host_id = u.id
      LEFT JOIN meeting_participants mp ON m.id = mp.meeting_id
      WHERE m.host_id = ${userId} OR mp.user_id = ${userId}
      ORDER BY mm.created_at DESC
    `;

    const seen = new Set();
    const unique = [];
    for (const item of memories) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        unique.push(item);
      }
    }

    res.json({ memories: unique });
  } catch (error) {
    console.error("getMeetingMemories failed:", error);
    res.status(500).json({ error: "Failed to fetch meeting memories" });
  }
};

// 7. Get single meeting memory by meeting ID (SECURED)
export const getMeetingMemoryById = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const userId = req.user.id;

    // Verify user is authorized (host or participant)
    const access = await sql`
      SELECT m.id FROM meetings m
      LEFT JOIN meeting_participants mp ON m.id = mp.meeting_id
      WHERE m.meeting_id = ${meetingId}
      AND (m.host_id = ${userId} OR mp.user_id = ${userId})
      LIMIT 1
    `;

    if (access.length === 0) {
      return res.status(403).json({ error: "Access denied: You are not authorized to view this meeting memory" });
    }

    const memories = await sql`
      SELECT 
        mm.*,
        m.meeting_id,
        m.title AS meeting_title,
        m.created_at AS meeting_date,
        m.status AS meeting_status,
        u.name AS host_name
      FROM meeting_memories mm
      JOIN meetings m ON mm.meeting_id = m.id
      JOIN users u ON m.host_id = u.id
      WHERE m.meeting_id = ${meetingId}
      ORDER BY mm.created_at DESC
      LIMIT 1
    `;

    if (memories.length === 0) {
      return res.status(404).json({ error: "Meeting memory not found" });
    }

    res.json({ memory: memories[0] });
  } catch (error) {
    console.error("getMeetingMemoryById failed:", error);
    res.status(500).json({ error: "Failed to fetch memory" });
  }
};

// 8. Generate meeting memory (SECURED)
export const generateMeetingMemory = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const userId = req.user.id;

    // Check authorization: Must be host or participant
    const meetings = await sql`
      SELECT m.*, u.name as host_name 
      FROM meetings m
      JOIN users u ON m.host_id = u.id
      LEFT JOIN meeting_participants mp ON m.id = mp.meeting_id
      WHERE m.meeting_id = ${meetingId}
      AND (m.host_id = ${userId} OR mp.user_id = ${userId})
      LIMIT 1
    `;

    if (meetings.length === 0) {
      return res.status(403).json({ error: "Access denied: Not authorized to generate memory for this meeting" });
    }

    const meeting = meetings[0];

    const participants = await sql`
      SELECT name FROM meeting_participants WHERE meeting_id = ${meeting.id}
    `;

    const messages = await sql`
      SELECT sender_name, text, timestamp 
      FROM meeting_messages 
      WHERE meeting_id = ${meeting.id}
      ORDER BY timestamp ASC
    `;

    const participantNames = participants.map((p) => p.name).join(", ") || meeting.host_name;
    const chatTranscript = messages.map((m) => `${m.sender_name}: ${m.text}`).join("\n");

    let summary = "";
    let discussionPoints = [];
    let decisions = [];
    let actionItems = [];
    let unresolvedQuestions = [];

    // AI Generation if Gemini key is present
    if (process.env.GEMINI_API_KEY && chatTranscript.trim().length > 10) {
      try {
        const prompt = `You are Confera's meeting memory intelligence system. Analyze the following meeting transcript and produce a structured JSON report.
Meeting Title: "${meeting.title}"
Participants: ${participantNames}

Transcript:
${chatTranscript}

Return ONLY valid JSON matching this schema:
{
  "summary": "2-3 concise sentences summarizing key outcomes.",
  "discussion_points": ["point 1", "point 2"],
  "decisions": ["decision 1", "decision 2"],
  "action_items": [{"title": "task title", "assigned_to": "name or unassigned", "due_date": "YYYY-MM-DD or null"}],
  "unresolved_questions": ["question 1", "question 2"]
}`;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { responseMimeType: "application/json" },
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            const parsed = JSON.parse(text);
            summary = parsed.summary || "";
            discussionPoints = parsed.discussion_points || [];
            decisions = parsed.decisions || [];
            actionItems = parsed.action_items || [];
            unresolvedQuestions = parsed.unresolved_questions || [];
          }
        }
      } catch (aiErr) {
        console.error("Gemini AI generation error:", aiErr);
      }
    }

    // Smart heuristic extraction fallback
    if (!summary) {
      if (messages.length > 0) {
        summary = `Collaborative session for "${meeting.title}" with ${participants.length || 1} participant(s). The team discussed operational milestones and next deliverables.`;

        messages.forEach((msg) => {
          const t = msg.text.trim();
          if (t.endsWith("?")) {
            unresolvedQuestions.push(`${msg.sender_name} asked: "${t}"`);
          } else if (/agree|decid|approved|confirm|ship|launch|resolve/i.test(t)) {
            decisions.push(t);
          } else if (/will |todo|action|task|follow up|assign|prepare|submit/i.test(t)) {
            actionItems.push({
              title: t,
              assigned_to: msg.sender_name,
              due_date: null,
            });
          } else if (discussionPoints.length < 5) {
            discussionPoints.push(`${msg.sender_name}: ${t}`);
          }
        });

        if (decisions.length === 0) {
          decisions.push("Team aligned on milestone deliverables.");
        }
      } else {
        summary = `Session for "${meeting.title}" hosted by ${meeting.host_name}. Preserved in Confera Meeting Memory.`;
        discussionPoints = [`Live video session held between participants.`];
        decisions = [`Completed scheduled call.`];
        actionItems = [{
          title: `Follow up on items from "${meeting.title}"`,
          assigned_to: meeting.host_name,
          due_date: null,
        }];
      }
    }

    // Save into meeting_memories
    const existing = await sql`
      SELECT id FROM meeting_memories WHERE meeting_id = ${meeting.id}
    `;

    let savedMemory;
    if (existing.length > 0) {
      const [updated] = await sql`
        UPDATE meeting_memories
        SET 
          summary = ${summary},
          discussion_points = ${JSON.stringify(discussionPoints)}::jsonb,
          decisions = ${JSON.stringify(decisions)}::jsonb,
          action_items = ${JSON.stringify(actionItems)}::jsonb,
          unresolved_questions = ${JSON.stringify(unresolvedQuestions)}::jsonb,
          updated_at = NOW()
        WHERE meeting_id = ${meeting.id}
        RETURNING *
      `;
      savedMemory = updated;
    } else {
      const [inserted] = await sql`
        INSERT INTO meeting_memories (
          meeting_id, summary, discussion_points, decisions, action_items, unresolved_questions
        ) VALUES (
          ${meeting.id}, 
          ${summary}, 
          ${JSON.stringify(discussionPoints)}::jsonb, 
          ${JSON.stringify(decisions)}::jsonb, 
          ${JSON.stringify(actionItems)}::jsonb, 
          ${JSON.stringify(unresolvedQuestions)}::jsonb
        )
        RETURNING *
      `;
      savedMemory = inserted;
    }

    // Automatically sync action items to action_items table
    if (Array.isArray(actionItems) && actionItems.length > 0) {
      for (const item of actionItems) {
        const itemTitle = typeof item === "string" ? item : item.title;
        const assignedTo = typeof item === "object" ? item.assigned_to : null;
        const dueDate = typeof item === "object" ? item.due_date : null;

        if (itemTitle && itemTitle.trim()) {
          const existingAction = await sql`
            SELECT id FROM action_items 
            WHERE meeting_id = ${meeting.id} AND title = ${itemTitle.trim()}
          `;
          if (existingAction.length === 0) {
            await sql`
              INSERT INTO action_items (meeting_id, title, assigned_to, due_date, created_by)
              VALUES (${meeting.id}, ${itemTitle.trim()}, ${assignedTo}, ${dueDate}, ${userId})
            `;
          }
        }
      }
    }

    res.json({
      memory: {
        ...savedMemory,
        meeting_id: meeting.meeting_id,
        meeting_title: meeting.title,
        host_name: meeting.host_name,
      },
    });
  } catch (error) {
    console.error("generateMeetingMemory failed:", error);
    res.status(500).json({ error: "Failed to generate meeting memory" });
  }
};

// 9. Update meeting memory manually (SECURED)
export const updateMeetingMemory = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const userId = req.user.id;
    const { summary, discussionPoints, decisions, unresolvedQuestions } = req.body;

    // Check authorization: user must be host or participant
    const meetings = await sql`
      SELECT m.id FROM meetings m
      LEFT JOIN meeting_participants mp ON m.id = mp.meeting_id
      WHERE m.meeting_id = ${meetingId}
      AND (m.host_id = ${userId} OR mp.user_id = ${userId})
      LIMIT 1
    `;

    if (meetings.length === 0) {
      return res.status(403).json({ error: "Access denied" });
    }

    const meetingDbId = meetings[0].id;

    const [updated] = await sql`
      UPDATE meeting_memories
      SET
        summary = COALESCE(${summary}, summary),
        discussion_points = COALESCE(${discussionPoints ? JSON.stringify(discussionPoints) : null}::jsonb, discussion_points),
        decisions = COALESCE(${decisions ? JSON.stringify(decisions) : null}::jsonb, decisions),
        unresolved_questions = COALESCE(${unresolvedQuestions ? JSON.stringify(unresolvedQuestions) : null}::jsonb, unresolved_questions),
        updated_at = NOW()
      WHERE meeting_id = ${meetingDbId}
      RETURNING *
    `;

    if (!updated) {
      return res.status(404).json({ error: "Meeting memory not found" });
    }

    res.json({ memory: updated });
  } catch (error) {
    console.error("updateMeetingMemory failed:", error);
    res.status(500).json({ error: "Failed to update meeting memory" });
  }
};

// 10. Get action items
export const getActionItems = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, search } = req.query;

    let items;
    if (status && (status === "pending" || status === "completed")) {
      items = await sql`
        SELECT 
          a.*,
          m.meeting_id,
          m.title as meeting_title
        FROM action_items a
        LEFT JOIN meetings m ON a.meeting_id = m.id
        WHERE (a.created_by = ${userId} OR a.assigned_to = ${userId})
        AND a.status = ${status}
        ORDER BY a.created_at DESC
      `;
    } else {
      items = await sql`
        SELECT 
          a.*,
          m.meeting_id,
          m.title as meeting_title
        FROM action_items a
        LEFT JOIN meetings m ON a.meeting_id = m.id
        WHERE (a.created_by = ${userId} OR a.assigned_to = ${userId})
        ORDER BY a.created_at DESC
      `;
    }

    if (search && typeof search === "string" && search.trim()) {
      const q = search.trim().toLowerCase();
      items = items.filter(
        (it) =>
          it.title.toLowerCase().includes(q) ||
          (it.assigned_to && it.assigned_to.toLowerCase().includes(q))
      );
    }

    res.json({ actionItems: items });
  } catch (error) {
    console.error("getActionItems failed:", error);
    res.status(500).json({ error: "Failed to fetch action items" });
  }
};

// 11. Create action item (SECURED & SANITIZED)
export const createActionItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, meetingId, assignedTo, dueDate } = req.body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ error: "Task title is required" });
    }

    const cleanTitle = title.trim().slice(0, 500);
    const cleanAssignee = assignedTo && typeof assignedTo === "string" ? assignedTo.trim().slice(0, 100) : null;
    const cleanDueDate = dueDate && !isNaN(Date.parse(dueDate)) ? new Date(dueDate).toISOString().slice(0, 10) : null;

    let dbMeetingId = null;
    if (meetingId && typeof meetingId === "string") {
      const m = await sql`SELECT id, host_id FROM meetings WHERE meeting_id = ${meetingId.trim()}`;
      if (m.length > 0) {
        dbMeetingId = m[0].id;
        if (m[0].host_id !== userId) {
          const isParticipant = await sql`
            SELECT id FROM meeting_participants WHERE meeting_id = ${dbMeetingId} AND user_id = ${userId} LIMIT 1
          `;
          if (isParticipant.length === 0) {
            return res.status(403).json({ error: "Unauthorized: You are not a participant in this meeting" });
          }
        }
      }
    }

    const [item] = await sql`
      INSERT INTO action_items (meeting_id, title, assigned_to, due_date, status, created_by)
      VALUES (${dbMeetingId}, ${cleanTitle}, ${cleanAssignee}, ${cleanDueDate}, 'pending', ${userId})
      RETURNING *
    `;

    res.status(201).json({ actionItem: item });
  } catch (error) {
    console.error("createActionItem failed:", error);
    res.status(500).json({ error: "Failed to create action item" });
  }
};

// 12. Update action item (SECURED: IDOR Prevention)
export const updateActionItem = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { status, title, assignedTo, dueDate } = req.body;

    // Verify ownership or assignment
    const existing = await sql`
      SELECT id, created_by, assigned_to FROM action_items WHERE id = ${id}
    `;

    if (existing.length === 0) {
      return res.status(404).json({ error: "Action item not found" });
    }

    const itemRecord = existing[0];
    if (itemRecord.created_by !== userId && itemRecord.assigned_to !== userId) {
      return res.status(403).json({ error: "Unauthorized: You do not have permission to modify this action item" });
    }

    const cleanStatus = status === "completed" || status === "pending" ? status : null;
    const cleanTitle = title && typeof title === "string" ? title.trim().slice(0, 500) : null;
    const cleanAssignee = assignedTo && typeof assignedTo === "string" ? assignedTo.trim().slice(0, 100) : null;
    const cleanDueDate = dueDate && !isNaN(Date.parse(dueDate)) ? new Date(dueDate).toISOString().slice(0, 10) : null;

    const [item] = await sql`
      UPDATE action_items
      SET 
        status = COALESCE(${cleanStatus}, status),
        title = COALESCE(${cleanTitle}, title),
        assigned_to = COALESCE(${cleanAssignee}, assigned_to),
        due_date = COALESCE(${cleanDueDate}, due_date),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    res.json({ actionItem: item });
  } catch (error) {
    console.error("updateActionItem failed:", error);
    res.status(500).json({ error: "Failed to update action item" });
  }
};

// 13. Delete action item (SECURED: IDOR Prevention)
export const deleteActionItem = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify creator or meeting host ownership
    const existing = await sql`
      SELECT a.id, a.created_by, m.host_id
      FROM action_items a
      LEFT JOIN meetings m ON a.meeting_id = m.id
      WHERE a.id = ${id}
    `;

    if (existing.length === 0) {
      return res.status(404).json({ error: "Action item not found" });
    }

    const item = existing[0];
    if (item.created_by !== userId && item.host_id !== userId) {
      return res.status(403).json({ error: "Unauthorized: Only the task creator or meeting host can delete this action item" });
    }

    await sql`DELETE FROM action_items WHERE id = ${id}`;

    res.json({ message: "Action item deleted successfully" });
  } catch (error) {
    console.error("deleteActionItem failed:", error);
    res.status(500).json({ error: "Failed to delete action item" });
  }
};
