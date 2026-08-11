import { VercelRequest, VercelResponse } from '@vercel/node'
import { ApiError, ErrorCodes, validateHttpMethod } from './errors'
import type { MinimalRequest, MinimalResponse } from './types'

export interface MiddlewareOptions {
  methods?: string[]
}

export function enableCors(req: VercelRequest | MinimalRequest, res: VercelResponse | MinimalResponse): void {
  const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173', 'http://localhost:3000']

  let requestOrigin = allowedOrigins[0]
  const origin = req.headers.origin
  if (origin && allowedOrigins.includes(origin)) {
    requestOrigin = origin
  }

  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', requestOrigin)
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )
  res.setHeader('Content-Type', 'application/json')
}

export function handleOptionsRequest(req: VercelRequest | MinimalRequest, res: VercelResponse | MinimalResponse): boolean {
  if (req.method === 'OPTIONS') {
    enableCors(req, res)
    res.status(200).end?.()
    return true
  }
  return false
}

export function validateRequest(
  req: VercelRequest | MinimalRequest,
  res: VercelResponse | MinimalResponse,
  options: MiddlewareOptions = {}
): void {
  enableCors(req, res)

  const allowedMethods = options.methods || ['POST']
  validateHttpMethod(req.method || 'GET', allowedMethods)
}

export function validateRequiredFields(data: Record<string, any>, fields: string[]): void {
  for (const field of fields) {
    if (!data[field]) {
      throw new ApiError(
        400,
        ErrorCodes.MISSING_PARAM,
        `Missing required parameter: ${field}`
      )
    }
  }
}

export function validateNonEmpty(value: string | null | undefined, fieldName: string): void {
  if (!value || !value.trim()) {
    throw new ApiError(
      400,
      ErrorCodes.INVALID_INPUT,
      `${fieldName} cannot be empty`
    )
  }
}
