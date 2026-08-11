import 'dotenv/config'
import { createServer } from 'http'
import { enableCors, handleOptionsRequest } from './middleware'
import { sendError } from './errors'
import { dispatch } from './router'
import type { MinimalRequest, MinimalResponse } from './types'

const PORT = 3001

const server = createServer(async (req, res) => {
  let body = ''

  req.on('data', (chunk) => {
    body += chunk.toString()
  })

  req.on('end', async () => {
    let mockRes: MinimalResponse

    try {
      const parsedUrl = new URL(req.url || '', `http://${req.headers.host}`)
      const pathname = parsedUrl.pathname

      console.log(`[${new Date().toISOString()}] ${req.method} ${pathname}`)

      const mockReq: MinimalRequest = {
        method: req.method,
        url: req.url,
        headers: req.headers as Record<string, string>,
        body: body ? JSON.parse(body) : {}
      }

      mockRes = {
        status: (code: number) => {
          res.statusCode = code
          return mockRes
        },
        json: (data: any) => {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(data))
        },
        setHeader: (key: string, value: string) => {
          res.setHeader(key, value)
        },
        end: (data?: string) => {
          res.end(data)
        }
      }

      if (handleOptionsRequest(mockReq, mockRes)) {
        return
      }

      enableCors(mockReq, mockRes)

      const handled = await dispatch(mockReq, mockRes, pathname)
      if (!handled) {
        res.statusCode = 404
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ error: 'Endpoint not found', code: 'NOT_FOUND' }))
      }
    } catch (error) {
      if (mockRes) {
        sendError(mockRes as any, error)
      } else {
        res.statusCode = 500
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ error: 'Internal server error', code: 'INTERNAL_ERROR' }))
      }
    }
  })
})

server.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`)
  console.log('Ready for requests')
})
