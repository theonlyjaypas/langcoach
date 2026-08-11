import { VercelRequest, VercelResponse } from '@vercel/node'
import { enableCors, handleOptionsRequest } from './lib/middleware'
import { sendError } from './lib/errors'
import { dispatch } from './lib/router'
import type { MinimalRequest, MinimalResponse } from './lib/types'

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    if (handleOptionsRequest(req, res)) {
      return
    }

    enableCors(req, res)

    const url = req.url || ''
    const pathname = new URL(url, `http://${req.headers.host || 'localhost'}`).pathname
    const method = (req.method || 'GET').toUpperCase()

    let body = req.body
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body)
      } catch {
        body = {}
      }
    }

    const minimalReq: MinimalRequest = {
      method,
      url: req.url,
      headers: req.headers as Record<string, string>,
      body
    }
    const minimalRes = res as unknown as MinimalResponse

    const handled = await dispatch(minimalReq, minimalRes, pathname)
    if (!handled) {
      res.status(404).json({ error: 'Endpoint not found', code: 'NOT_FOUND' })
    }
  } catch (error) {
    sendError(res, error)
  }
}
