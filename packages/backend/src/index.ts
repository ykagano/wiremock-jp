import Fastify from 'fastify'
import cors from '@fastify/cors'
import { PrismaClient } from '@prisma/client'
import { projectRoutes } from './routes/projects.js'
import { stubRoutes } from './routes/stubs.js'
import { wiremockInstanceRoutes } from './routes/wiremock-instances.js'

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
