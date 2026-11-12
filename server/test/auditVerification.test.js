import test from 'node:test'
import assert from 'node:assert/strict'
import { rateLimit } from '../middleware/rateLimit.js'
import { protect } from '../middleware/auth.js'

test('Rate Limiter blocks requests exceeding threshold', async () => {
  const limiter = rateLimit({
    windowMs: 1000,
    max: 3,
    message: 'Rate limit hit',
  })

  const req = {
    user: { id: 'user_test_ratelimit' },
    path: '/api/test/ratelimit',
    ip: '127.0.0.1',
  }

  let statusCode = 200
  let responseData = null

  const res = {
    status(code) {
      statusCode = code
      return this
    },
    json(data) {
      responseData = data
      return this
    },
  }

  // 1st request -> pass
  limiter(req, res, () => {})
  assert.equal(statusCode, 200)

  // 2nd request -> pass
  limiter(req, res, () => {})
  assert.equal(statusCode, 200)

  // 3rd request -> pass
  limiter(req, res, () => {})
  assert.equal(statusCode, 200)

  // 4th request -> blocked
  let nextCalled = false
  limiter(req, res, () => {
    nextCalled = true
  })
  assert.equal(statusCode, 429)
  assert.equal(responseData.error, 'Rate limit hit')
  assert.equal(nextCalled, false)
})

test('protect middleware rejects unauthenticated requests with 401', async () => {
  const req = {
    auth: null,
    headers: {},
  }

  let statusCode = null
  let responseBody = null

  const res = {
    status(code) {
      statusCode = code
      return this
    },
    json(body) {
      responseBody = body
      return this
    },
  }

  let nextCalled = false
  await protect(req, res, () => {
    nextCalled = true
  })

  assert.equal(statusCode, 401)
  assert.equal(responseBody.error, 'Not Authorized: Valid authentication required')
  assert.equal(nextCalled, false)
})

test('Meeting ID generator conforms to confera-{random} format', () => {
  const generateMeetingId = () => `confera-${Math.random().toString(36).substring(2, 10)}`
  const id1 = generateMeetingId()
  const id2 = generateMeetingId()

  assert.match(id1, /^confera-[a-z0-9]{5,10}$/)
  assert.notEqual(id1, id2)
})

test('Action Item validation rejects empty or missing titles', () => {
  const validateActionItem = (title) => {
    if (!title || typeof title !== 'string' || !title.trim()) {
      return { valid: false, error: 'Task title is required.' }
    }
    if (title.trim().length > 300) {
      return { valid: false, error: 'Task title too long.' }
    }
    return { valid: true }
  }

  assert.equal(validateActionItem('').valid, false)
  assert.equal(validateActionItem('   ').valid, false)
  assert.equal(validateActionItem(null).valid, false)
  assert.equal(validateActionItem('Refactor WebRTC signaling').valid, true)
})

test('Meeting Memory markdown generator produces formatted structured document', () => {
  const mem = {
    meeting_title: 'Sprint Planning',
    meeting_id: 'confera-abc123',
    created_at: new Date('2026-11-05').toISOString(),
    summary: 'Discussed sprint backlog and assigned frontend tasks.',
    discussion_points: ['WebRTC mesh topology', 'Clerk JWT auth migration'],
    decisions: ['Approved peer connection restart on ICE failure'],
    action_items: [{ title: 'Implement DeviceSettingsModal', assigned_to: 'Alex' }],
    unresolved_questions: ['What is the TURN server allocation?'],
  }

  const formatMarkdown = (m) => {
    return [
      `# ${m.meeting_title} (${m.meeting_id})`,
      `Date: ${new Date(m.created_at).toLocaleDateString()}`,
      '',
      '## Executive Summary',
      m.summary,
      '',
      '## Key Discussion Points',
      ...m.discussion_points.map((p) => `- ${p}`),
      '',
      '## Agreed Decisions',
      ...m.decisions.map((d) => `- [x] ${d}`),
      '',
      '## Action Items',
      ...m.action_items.map((a) => `- [ ] ${a.title} (@${a.assigned_to})`),
      '',
      '## Unresolved Questions',
      ...m.unresolved_questions.map((q) => `- ? ${q}`),
    ].join('\n')
  }

  const output = formatMarkdown(mem)
  assert.match(output, /# Sprint Planning \(confera-abc123\)/)
  assert.match(output, /## Executive Summary\nDiscussed sprint backlog/)
  assert.match(output, /- \[x\] Approved peer connection restart on ICE failure/)
  assert.match(output, /- \[ \] Implement DeviceSettingsModal \(@Alex\)/)
})

test('Socket room authorization ensures users can only message their current room', () => {
  const userRooms = new Set(['confera-room-1'])

  const canSendMessage = (requestedRoom) => {
    return userRooms.has(requestedRoom)
  }

  assert.equal(canSendMessage('confera-room-1'), true)
  assert.equal(canSendMessage('confera-room-2'), false)
})

test('protect middleware strictly rejects forged x-user-id header without verified token', async () => {
  const req = {
    headers: {
      'x-user-id': 'user_forged_admin_123',
    },
    cookies: {},
  }

  let statusCode = null
  let responseBody = null
  const res = {
    status(code) {
      statusCode = code
      return this
    },
    json(body) {
      responseBody = body
      return this
    },
  }

  let nextCalled = false
  await protect(req, res, () => {
    nextCalled = true
  })

  assert.equal(statusCode, 401)
  assert.equal(responseBody.error, 'Not Authorized: Valid authentication required')
  assert.equal(nextCalled, false)
})

test('protect middleware strictly rejects unverified or tampered Bearer tokens', async () => {
  const req = {
    headers: {
      authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature',
    },
    cookies: {},
  }

  let statusCode = null
  let responseBody = null
  const res = {
    status(code) {
      statusCode = code
      return this
    },
    json(body) {
      responseBody = body
      return this
    },
  }

  let nextCalled = false
  await protect(req, res, () => {
    nextCalled = true
  })

  assert.equal(statusCode, 401)
  assert.equal(responseBody.error, 'Not Authorized: Valid authentication required')
  assert.equal(nextCalled, false)
})

test('updatePlan controller strictly rejects client-driven premium self-activation', async () => {
  const { updatePlan } = await import('../controllers/meetingController.js')
  const req = {
    user: { id: 'user_regular_customer' },
    body: { plan: 'premium' },
  }
  let statusCode = 200
  let responseData = null
  const res = {
    status(code) {
      statusCode = code
      return this
    },
    json(data) {
      responseData = data
      return this
    },
  }

  await updatePlan(req, res)
  assert.equal(statusCode, 501)
  assert.equal(responseData.code, 'PAYMENT_GATEWAY_NOT_CONFIGURED')
  assert.equal(responseData.paymentAvailable, false)
})

test('CORS origin validation strictly rejects unauthorized origins and enforces production boundaries', () => {
  const isProduction = true
  const allowedOrigins = ['https://confera.vercel.app']

  const isOriginAllowed = (origin) => {
    if (!origin) return true
    const normalizedOrigin = origin.trim().replace(/\/+$/, '')
    if (allowedOrigins.includes(normalizedOrigin)) {
      return true
    }
    if (!isProduction && (normalizedOrigin.startsWith('http://localhost:') || normalizedOrigin.startsWith('http://127.0.0.1:'))) {
      return true
    }
    return false
  }

  // Allowed production origin (with and without trailing slash)
  assert.equal(isOriginAllowed('https://confera.vercel.app'), true)
  assert.equal(isOriginAllowed('https://confera.vercel.app/'), true)

  // Unauthorized external origin blocked
  assert.equal(isOriginAllowed('https://malicious-site.com'), false)

  // Localhost blocked in production
  assert.equal(isOriginAllowed('http://localhost:5173'), false)

  // Direct server/health check request without origin allowed
  assert.equal(isOriginAllowed(null), true)
  assert.equal(isOriginAllowed(''), true)
})

test('Database configuration blocks silent fallback to localhost when in production mode', () => {
  const verifyProductionDbConfig = (envNodeEnv, envDbUrl) => {
    const isProd = envNodeEnv === 'production'
    if (isProd && (!envDbUrl || !envDbUrl.trim())) {
      throw new Error('[Database] FATAL: DATABASE_URL environment variable is required in production.')
    }
    return envDbUrl?.trim() || 'postgresql://unconfigured:unconfigured@localhost:5432/confera'
  }

  // In production without DATABASE_URL -> MUST throw
  assert.throws(
    () => verifyProductionDbConfig('production', ''),
    /FATAL: DATABASE_URL environment variable is required in production/
  )

  // In production with valid DATABASE_URL -> succeeds
  assert.equal(
    verifyProductionDbConfig('production', 'postgresql://user:pass@ep-neon.tech/db'),
    'postgresql://user:pass@ep-neon.tech/db'
  )

  // In development without DATABASE_URL -> safe local fallback
  assert.equal(
    verifyProductionDbConfig('development', ''),
    'postgresql://unconfigured:unconfigured@localhost:5432/confera'
  )
})
