import { VercelRequest, VercelResponse } from '@vercel/node'
import { enableCors, handleOptionsRequest, validateRequest, validateRequiredFields } from '../middleware'
import { sendError, ApiError, ErrorCodes } from '../errors'

interface LoginRequest {
  username: string
  password: string
}

interface LoginResponse {
  success: boolean
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    // Handle CORS preflight
    if (handleOptionsRequest(req, res)) {
      return
    }

    // Validate request
    validateRequest(req, res, { methods: ['POST'] })

    // Parse and validate request body
    const { username, password } = req.body as LoginRequest

    validateRequiredFields({ username, password }, ['username', 'password'])

    // Get credentials from environment variables
    const validUsername = process.env.AUTH_USERNAME
    const validPassword = process.env.AUTH_PASSWORD

    if (!validUsername || !validPassword) {
      throw new ApiError(
        500,
        ErrorCodes.INTERNAL_ERROR,
        'Authentication not configured'
      )
    }

    // Validate credentials
    if (username === validUsername && password === validPassword) {
      const responseData: LoginResponse = { success: true }
      res.status(200).json(responseData)
      return
    }

    throw new ApiError(401, ErrorCodes.AUTH_FAILED, 'Invalid credentials')
  } catch (error) {
    sendError(res, error)
  }
}
