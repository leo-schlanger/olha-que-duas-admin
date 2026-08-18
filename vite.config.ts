import type { IncomingMessage, ServerResponse } from 'node:http'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { handleUmamiProxy } from './api/umami-share'

function umamiDevProxy(): Plugin {
  const serve = async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const path = req.url?.split('?')[0]
    if (path !== '/api/umami-proxy') {
      next()
      return
    }

    try {
      const response = await handleUmamiProxy(`http://local${req.url ?? ''}`)
      const body = await response.text()
      res.statusCode = response.status
      res.setHeader('Content-Type', response.headers.get('Content-Type') || 'application/json')
      res.setHeader('Cache-Control', 'no-store')
      res.end(body)
    } catch (error) {
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({
        error: error instanceof Error ? error.message : 'Proxy error',
      }))
    }
  }

  return {
    name: 'umami-dev-proxy',
    configureServer(server) {
      server.middlewares.use(serve)
    },
    configurePreviewServer(server) {
      server.middlewares.use(serve)
    },
  }
}

export default defineConfig({
  plugins: [react(), umamiDevProxy()],
})
