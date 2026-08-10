import { VercelResponse } from '@vercel/node'
import { ApiErrorResponse } from './types'

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export const ErrorCodes = {
  INVALID_METHOD: 'INVALID_METHOD',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_PARAM: 'MISSING_PARAM',
  TRANSCRIPTION_FAILED: 'TRANSCRIPTION_FAILED',
  CHAT_FAILED: 'CHAT_FAILED',
  TTS_FAILED: 'TTS_FAILED',
  SUMMARIZE_FAILED: 'SUMMARIZE_FAILED',
  AUTH_FAILED: 'AUTH_FAILED',
  INTERNAL_ERROR: 'INTERNAL_ERROR'
}

export function sendError(res: VercelResponse, error: unknown): void {
  console.error('Error:', error)

  if (error instanceof ApiError) {
    const response: ApiErrorResponse = {
      error: error.message,
      code: error.code
    }
    res.status(error.statusCode).json(response)
    return
  }

  if (error instanceof Error) {
    const response: ApiErrorResponse = {
      error: 'Internal server error',
      message: error.message,
      code: ErrorCodes.INTERNAL_ERROR
    }
    res.status(500).json(response)
    return
  }

  const response: ApiErrorResponse = {
    error: 'Unknown error occurred',
    code: ErrorCodes.INTERNAL_ERROR
  }
  res.status(500).json(response)
}

export function validateHttpMethod(method: string, allowed: string[]): void {
  if (!allowed.includes(method)) {
    throw new ApiError(
      405,
      ErrorCodes.INVALID_METHOD,
      'Method not allowed'
    )
  }
}
