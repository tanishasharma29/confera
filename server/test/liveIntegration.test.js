import test from 'node:test'
import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { app } from '../server.js'

function mockRequest(app, { method = 'GET', url = '/', headers = {}, body = null }) {
  return new Promise((resolve) => {
    const req = new EventEmitter()
    req.method = method
    req.url = url
    req.originalUrl = url
    req.headers = { host: 'localhost:3000', ...headers }
    req.connection = { remoteAddress: '127.0.0.1' }
    req.socket = { remoteAddress: '127.0.0.1' }
    req.query = {}
    req.params = {}

    let statusCode = 200
    const resHeaders = {}
    let responseBody = ''

    const res = {
      statusCode: 200,
      locals: {},
      _headers: resHeaders,
      appendHeader(name, value) {
        const lower = name.toLowerCase()
        if (resHeaders[lower]) {
          resHeaders[lower] = Array.isArray(resHeaders[lower])
            ? [...resHeaders[lower], value]
            : [resHeaders[lower], value]
        } else {
          resHeaders[lower] = value
        }
      },
      setHeader(name, value) {
        resHeaders[name.toLowerCase()] = value
      },
      getHeader(name) {
        return resHeaders[name.toLowerCase()]
      },
      getHeaders() {
        return resHeaders
      },
      hasHeader(name) {
        return name.toLowerCase() in resHeaders
      },
      status(code) {
        statusCode = code
        this.statusCode = code
        return this
      },
      json(data) {
        this.setHeader('content-type', 'application/json')
        responseBody = JSON.stringify(data)
        resolve({
          status: statusCode,
          headers: resHeaders,
          body: data,
          text: responseBody,
        })
        return this
      },
      send(data) {
        responseBody = typeof data === 'object' ? JSON.stringify(data) : String(data)
        resolve({
          status: statusCode,
          headers: resHeaders,
          body: data,
          text: responseBody,
        })
        return this
      },
      end(data) {
        if (data) responseBody = String(data)
        resolve({
          status: statusCode,
          headers: resHeaders,
          body: responseBody,
          text: responseBody,
        })
        return this
      },
    }

    app(req, res)

    if (body) {
      req.emit('data', typeof body === 'object' ? JSON.stringify(body) : body)
    }
    req.emit('end')
  })
}

test('Health and API routes respond correctly through Express app stack', async () => {
  // 1. Root route
  const root = await mockRequest(app, { method: 'GET', url: '/' })
  assert.equal(root.status, 200)
  assert.equal(root.body.status, 'ok')
  assert.equal(root.body.app, 'Confera API')

  // 2. Health check route: checks actual DB connectivity and returns appropriate status
  const health = await mockRequest(app, { method: 'GET', url: '/health' })
  assert.ok(health.status === 200 || health.status === 503)
  assert.ok(health.body.status === 'healthy' || health.body.status === 'unhealthy')
  assert.ok(health.body.timestamp)

  // 3. Security headers
  assert.equal(root.headers['x-content-type-options'], 'nosniff')
  assert.equal(root.headers['x-frame-options'], 'DENY')

  // 4. Protected route without auth returns 401
  const protectedStats = await mockRequest(app, { method: 'GET', url: '/api/meetings/stats' })
  assert.equal(protectedStats.status, 401)
  assert.equal(protectedStats.body.error, 'Not Authorized: Valid authentication required')

  // 5. Forged x-user-id header is strictly rejected with 401
  const forgedHeaderRes = await mockRequest(app, {
    method: 'GET',
    url: '/api/meetings/stats',
    headers: { 'x-user-id': 'user_attacker_999' },
  })
  assert.equal(forgedHeaderRes.status, 401)
  assert.equal(forgedHeaderRes.body.error, 'Not Authorized: Valid authentication required')
})
