// TEMPORARY one-time seed endpoint. Delete after use.
import { createFileRoute } from '@tanstack/react-router'

const TOKEN = 'nikkah-seed-2f8c1a9e4b7d'

export const Route = createFileRoute('/api/public/seed-test-data')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (request.headers.get('x-seed-token') !== TOKEN) {
          return new Response('Unauthorized', { status: 401 })
        }
        const { runSeed } = await import('@/lib/seed-test-data.server')
        try {
          const result = await runSeed()
          return Response.json(result)
        } catch (e) {
          return Response.json({ error: (e as Error).message, stack: (e as Error).stack }, { status: 500 })
        }
      },
    },
  },
})
