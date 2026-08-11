import { VercelRequest, VercelResponse } from '@vercel/node'
import { enableCors, handleOptionsRequest } from './middleware'
import { sendError } from './errors'
import { dispatch } from './router'
import type { MinimalRequest, MinimalResponse } from './types'

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    if (handleOptionsRequest(req, res)) {
      return
    }

    enableCors(req, res)

    const url = req.url || ''
    const pathname = new URL(url, `http://${req.headers.host || 'localhost'}`).pathname

    const minimalReq: MinimalRequest = {
      method: req.method,
      url: req.url,
      headers: req.headers as Record<string, string>,
      body: req.body
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
