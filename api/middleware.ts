import { VercelRequest, VercelResponse } from '@vercel/node'
import { ApiError, ErrorCodes, validateHttpMethod } from './errors'

export interface MiddlewareOptions {
  methods?: string[]
}

export function enableCors(res: VercelResponse): void {
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )
  res.setHeader('Content-Type', 'application/json')
}

export function handleOptionsRequest(req: VercelRequest, res: VercelResponse): boolean {
  if (req.method === 'OPTIONS') {
    enableCors(res)
    res.status(200).end()
    return true
  }
  return false
}

export function validateRequest(
  req: VercelRequest,
  res: VercelResponse,
  options: MiddlewareOptions = {}
): void {
  enableCors(res)

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
