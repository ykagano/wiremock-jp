import Fastify from 'fastify'
import cors from '@fastify/cors'
import fastifyStatic from '@fastify/static'
import { PrismaClient } from '@prisma/client'
import { projectRoutes } from './routes/projects.js'
import { stubRoutes } from './routes/stubs.js'
import { wiremockInstanceRoutes } from './routes/wiremock-instances.js'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const prisma = new PrismaClient()

const fastify = Fastify({
  logger: true
})

// Register plugins
await fastify.register(cors, {
  origin: true,
  credentials: true
})

// Decorate fastify with prisma
fastify.decorate('prisma', prisma)

// Register routes
await fastify.register(projectRoutes, { prefix: '/api/projects' })
await fastify.register(stubRoutes, { prefix: '/api/stubs' })
await fastify.register(wiremockInstanceRoutes, { prefix: '/api/wiremock-instances' })

// Health check
fastify.get('/api/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() }
})

// Serve frontend static files in production
if (process.env.NODE_ENV === 'production') {
  // __dirname is /app/packages/backend/dist
  // Go up to /app/packages/backend, then to ../frontend/dist
  const frontendPath = path.join(__dirname, '../../frontend/dist')
  await fastify.register(fastifyStatic, {
    root: frontendPath,
    prefix: '/',
  })

  // SPA fallback - serve index.html for all non-API routes
  fastify.setNotFoundHandler((request, reply) => {
    if (request.url.startsWith('/api/')) {
      reply.code(404).send({ error: 'Not Found' })
    } else {
      reply.sendFile('index.html')
    }
  })
}

// Graceful shutdown
const closeGracefully = async (signal: string) => {
  console.log(`Received signal to terminate: ${signal}`)
  await fastify.close()
  await prisma.$disconnect()
  process.exit(0)
}

process.on('SIGINT', () => closeGracefully('SIGINT'))
process.on('SIGTERM', () => closeGracefully('SIGTERM'))

// Start server
const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3000', 10)
    const host = process.env.HOST || '0.0.0.0'

    await fastify.listen({ port, host })
    console.log(`Server is running on http://${host}:${port}`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()

// Type augmentation for Fastify
declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient
  }
}
