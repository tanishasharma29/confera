import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { neon } from '@neondatabase/serverless';

const dbUrl = process.env.DATABASE_URL || "postgresql://unconfigured:unconfigured@localhost:5432/confera";
if (!process.env.DATABASE_URL) {
  console.warn("[Database] Warning: DATABASE_URL is not set in environment variables.");
}

export const sql = neon(dbUrl);

let dbInitialized = false;

export async function initDB() {
  if (dbInitialized) return;

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        image VARCHAR(500),
        plan VARCHAR(20) DEFAULT 'free',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS meetings (
        id SERIAL PRIMARY KEY,
        meeting_id VARCHAR(50) NOT NULL UNIQUE,
        title VARCHAR(255) DEFAULT 'Instant Meeting',
        host_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
        status VARCHAR(20) DEFAULT 'active',
        ended_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS meeting_participants (
        id SERIAL PRIMARY KEY,
        meeting_id INT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE ON UPDATE CASCADE,
        user_id VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
        name VARCHAR(255) NOT NULL,
        joined_at TIMESTAMPTZ DEFAULT NOW(),
        left_at TIMESTAMPTZ
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS meeting_messages (
        id SERIAL PRIMARY KEY,
        meeting_id INT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE ON UPDATE CASCADE,
        sender_id VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
        sender_name VARCHAR(255) NOT NULL,
        text TEXT NOT NULL,
        timestamp TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS meeting_memories (
        id SERIAL PRIMARY KEY,
        meeting_id INT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE ON UPDATE CASCADE,
        summary TEXT NOT NULL,
        discussion_points JSONB DEFAULT '[]',
        decisions JSONB DEFAULT '[]',
        action_items JSONB DEFAULT '[]',
        unresolved_questions JSONB DEFAULT '[]',
        ai_generated BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS action_items (
        id SERIAL PRIMARY KEY,
        meeting_id INT REFERENCES meetings(id) ON DELETE SET NULL ON UPDATE CASCADE,
        title VARCHAR(500) NOT NULL,
        assigned_to VARCHAR(255),
        due_date DATE,
        status VARCHAR(50) DEFAULT 'pending',
        created_by VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    // Performance Indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_meetings_host_id ON meetings (host_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_meetings_meeting_id ON meetings (meeting_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_meetings_created_at ON meetings (created_at DESC);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_participants_meeting_id ON meeting_participants (meeting_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_participants_user_id ON meeting_participants (user_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_messages_meeting_id ON meeting_messages (meeting_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON meeting_messages (timestamp ASC);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_memories_meeting_id ON meeting_memories (meeting_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_actions_created_by ON action_items (created_by);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_actions_meeting_id ON action_items (meeting_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_actions_status ON action_items (status);`;

    dbInitialized = true;
    console.log("Database tables and indexes verified successfully.");
  } catch (error) {
    console.error("Error initializing the database:", error.message || error);
    throw error;
  }
}

/**
 * Ensures a user record exists in PostgreSQL to satisfy foreign key constraints.
 * If the user record doesn't exist yet, lazily provisions it.
 */
export async function ensureUserInDatabase(userId, fallbackData = {}) {
  if (!userId) return null;

  try {
    const existing = await sql`
      SELECT id, name, email, plan FROM users WHERE id = ${userId}
    `;

    if (existing.length > 0) {
      return existing[0];
    }

    const name = fallbackData.name || "User";
    const email = fallbackData.email || `${userId}@user.confera.app`;
    const image = fallbackData.image || "";
    const plan = fallbackData.plan || "free";

    const [created] = await sql`
      INSERT INTO users (id, name, email, image, plan)
      VALUES (${userId}, ${name}, ${email}, ${image}, ${plan})
      ON CONFLICT (id) DO UPDATE SET
        name = COALESCE(NULLIF(EXCLUDED.name, 'User'), users.name),
        updated_at = NOW()
      RETURNING id, name, email, plan
    `;

    return created;
  } catch (err) {
    console.error(`ensureUserInDatabase warning for ${userId}:`, err.message || err);
    return { id: userId, plan: "free", name: fallbackData.name || "User" };
  }
}
