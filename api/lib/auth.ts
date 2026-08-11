import { sql } from './db'
import bcryptjs from 'bcryptjs'
import { createHash, randomBytes } from 'crypto'
import { ApiError, ErrorCodes } from './errors'
import type { MinimalRequest, User } from './types'

const SESSION_COOKIE_NAME = 'session_token'
const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60

export async function hashPassword(password: string): Promise<string> {
  return bcryptjs.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcryptjs.compare(password, hash)
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

function generateToken(): string {
  return randomBytes(32).toString('hex')
}

export async function createUser(username: string, password: string): Promise<User> {
  const lowerUsername = username.toLowerCase()

  const existing = await sql`
    SELECT id FROM users WHERE LOWER(username) = LOWER(${username})
  `

  if (existing.length > 0) {
    throw new ApiError(409, ErrorCodes.USERNAME_TAKEN, 'Username already taken')
  }

  const passwordHash = await hashPassword(password)

  const result = await sql`
    INSERT INTO users (username, password_hash)
    VALUES (${username}, ${passwordHash})
    RETURNING id, username, created_at
  `

  const row = result[0]
  return {
    id: row.id,
    username: row.username,
    createdAt: row.created_at
  }
}

export async function findUserByUsername(username: string): Promise<User | null> {
  const result = await sql`
    SELECT id, username, created_at FROM users WHERE LOWER(username) = LOWER(${username})
  `

  if (result.length === 0) {
    return null
  }

  const row = result[0]
  return {
    id: row.id,
    username: row.username,
    createdAt: row.created_at
  }
}

export async function getUserById(id: number): Promise<User | null> {
  const result = await sql`
    SELECT id, username, created_at FROM users WHERE id = ${id}
  `

  if (result.length === 0) {
    return null
  }

  const row = result[0]
  return {
    id: row.id,
    username: row.username,
    createdAt: row.created_at
  }
}

export async function getUserPasswordHash(username: string): Promise<string | null> {
  const result = await sql`
    SELECT password_hash FROM users WHERE LOWER(username) = LOWER(${username})
  `

  if (result.length === 0) {
    return null
  }

  return result[0].password_hash
}

export async function createAuthSession(userId: number): Promise<string> {
  const token = generateToken()
  const tokenHash = hashToken(token)
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000)

  await sql`
    INSERT INTO auth_sessions (token_hash, user_id, expires_at)
    VALUES (${tokenHash}, ${userId}, ${expiresAt.toISOString()})
  `

  return token
}

export async function validateAuthSession(token: string): Promise<User | null> {
  const tokenHash = hashToken(token)

  const result = await sql`
    SELECT u.id, u.username, u.created_at
    FROM auth_sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ${tokenHash} AND s.expires_at > now()
  `

  if (result.length === 0) {
    return null
  }

  const row = result[0]
  return {
    id: row.id,
    username: row.username,
    createdAt: row.created_at
  }
}

export async function deleteAuthSession(token: string): Promise<void> {
  const tokenHash = hashToken(token)
  await sql`DELETE FROM auth_sessions WHERE token_hash = ${tokenHash}`
}

export function parseCookieHeader(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader) return {}

  return cookieHeader.split(';').reduce(
    (acc, cookie) => {
      const [name, value] = cookie.trim().split('=')
      if (name && value) {
        acc[name] = value
      }
      return acc
    },
    {} as Record<string, string>
  )
}

export function buildSessionCookie(token: string): string {
  const secure = process.env.VERCEL === '1' ? '; Secure' : ''
  return `${SESSION_COOKIE_NAME}=${token}; HttpOnly; Path=/; SameSite=Lax${secure}; Max-Age=${SESSION_TTL_SECONDS}`
}

export function buildClearCookie(): string {
  return `${SESSION_COOKIE_NAME}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`
}

export async function requireAuth(req: MinimalRequest): Promise<User> {
  const cookieHeader = req.headers.cookie
  const cookies = parseCookieHeader(cookieHeader)
  const token = cookies[SESSION_COOKIE_NAME]

  if (!token) {
    throw new ApiError(401, ErrorCodes.AUTH_REQUIRED, 'Not authenticated')
  }

  const user = await validateAuthSession(token)
  if (!user) {
    throw new ApiError(401, ErrorCodes.AUTH_REQUIRED, 'Session invalid or expired')
  }

  return user
}
