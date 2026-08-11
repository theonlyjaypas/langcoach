import { ApiError, ErrorCodes } from './errors'
import {
  createUser,
  findUserByUsername,
  getUserPasswordHash,
  verifyPassword,
  createAuthSession,
  deleteAuthSession,
  requireAuth,
  buildSessionCookie,
  buildClearCookie,
  parseCookieHeader
} from './auth'
import type { MinimalRequest, MinimalResponse, SignupRequest, LoginRequest, AuthResponse } from './types'

export async function handleSignup(req: MinimalRequest, res: MinimalResponse): Promise<void> {
  const body = req.body as SignupRequest

  if (!body.username || !body.password) {
    throw new ApiError(400, ErrorCodes.MISSING_PARAM, 'Username and password are required')
  }

  if (body.password.length < 8) {
    throw new ApiError(400, ErrorCodes.INVALID_INPUT, 'Password must be at least 8 characters')
  }

  const user = await createUser(body.username, body.password)
  const token = await createAuthSession(user.id)

  res.setHeader('Set-Cookie', buildSessionCookie(token))
  const response: AuthResponse = {
    success: true,
    user: { id: user.id, username: user.username }
  }
  res.status(201).json(response)
}

export async function handleLogin(req: MinimalRequest, res: MinimalResponse): Promise<void> {
  const body = req.body as LoginRequest

  if (!body.username || !body.password) {
    throw new ApiError(400, ErrorCodes.MISSING_PARAM, 'Username and password are required')
  }

  const user = await findUserByUsername(body.username)
  if (!user) {
    throw new ApiError(401, ErrorCodes.AUTH_FAILED, 'Invalid username or password')
  }

  const hash = await getUserPasswordHash(body.username)
  if (!hash) {
    throw new ApiError(401, ErrorCodes.AUTH_FAILED, 'Invalid username or password')
  }

  const isValid = await verifyPassword(body.password, hash)
  if (!isValid) {
    throw new ApiError(401, ErrorCodes.AUTH_FAILED, 'Invalid username or password')
  }

  const token = await createAuthSession(user.id)

  res.setHeader('Set-Cookie', buildSessionCookie(token))
  const response: AuthResponse = {
    success: true,
    user: { id: user.id, username: user.username }
  }
  res.status(200).json(response)
}

export async function handleLogout(req: MinimalRequest, res: MinimalResponse): Promise<void> {
  const cookieHeader = req.headers.cookie
  const cookies = parseCookieHeader(cookieHeader)
  const token = cookies['session_token']

  if (token) {
    await deleteAuthSession(token)
  }

  res.setHeader('Set-Cookie', buildClearCookie())
  res.status(200).json({ success: true })
}

export async function handleMe(req: MinimalRequest, res: MinimalResponse): Promise<void> {
  const user = await requireAuth(req)
  res.status(200).json({ user: { id: user.id, username: user.username } })
}
