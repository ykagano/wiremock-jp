import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import axios from 'axios'

const createInstanceSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(1),
  url: z.string().url()
})

const updateInstanceSchema = z.object({
  name: z.string().min(1).optional(),
  url: z.string().url().optional(),
  isActive: z.boolean().optional()
})

export async function wiremockInstanceRoutes(fastify: FastifyInstance) {
  // Helper to check project exists
  async function checkProjectExists(projectId: string) {
    const project = await fastify.prisma.project.findUnique({
      where: { id: projectId }
    })
    return project
  }

  // List instances for a project
  fastify.get('/', async (request: FastifyRequest<{ Querystring: { projectId: string } }>, reply: FastifyReply) => {
    const { projectId } = request.query

    if (!projectId) {
      return reply.status(400).send({
        success: false,
        error: 'projectId is required'
      })
    }

    const project = await checkProjectExists(projectId)
    if (!project) {
      return reply.status(404).send({
        success: false,
        error: 'Project not found'
      })
    }

    const instances = await fastify.prisma.wiremockInstance.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' }
    })

    return reply.send({
      success: true,
      data: instances
    })
  })

  // Get single instance with health status
  fastify.get('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params

    const instance = await fastify.prisma.wiremockInstance.findUnique({
      where: { id },
      include: { project: true }
    })

    if (!instance) {
      return reply.status(404).send({
        success: false,
        error: 'Instance not found'
      })
    }

    // Check WireMock health
    let isHealthy = false
    try {
      const response = await axios.get(`${instance.url}/__admin/mappings`, {
        timeout: 5000
      })
      isHealthy = response.status === 200
    } catch {
      isHealthy = false
    }

    return reply.send({
      success: true,
      data: {
        ...instance,
        isHealthy
      }
    })
  })

  // Create instance
  fastify.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = createInstanceSchema.parse(request.body)

      const project = await checkProjectExists(body.projectId)
      if (!project) {
        return reply.status(404).send({
          success: false,
          error: 'Project not found'
        })
      }

      const instance = await fastify.prisma.wiremockInstance.create({
        data: body
      })

      return reply.status(201).send({
        success: true,
        data: instance
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: 'Validation error',
          details: error.errors
        })
      }
      throw error
    }
  })

  // Update instance
  fastify.put('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params
      const body = updateInstanceSchema.parse(request.body)

      const existing = await fastify.prisma.wiremockInstance.findUnique({
        where: { id }
      })

      if (!existing) {
        return reply.status(404).send({
          success: false,
          error: 'Instance not found'
        })
      }

      const instance = await fastify.prisma.wiremockInstance.update({
        where: { id },
        data: body
      })

      return reply.send({
        success: true,
        data: instance
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: 'Validation error',
          details: error.errors
        })
      }
      throw error
    }
  })

  // Delete instance
  fastify.delete('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params

    const existing = await fastify.prisma.wiremockInstance.findUnique({
      where: { id }
    })

    if (!existing) {
      return reply.status(404).send({
        success: false,
        error: 'Instance not found'
      })
    }

    await fastify.prisma.wiremockInstance.delete({
      where: { id }
    })

    return reply.send({
      success: true,
      message: 'Instance deleted successfully'
    })
  })

  // Get mappings from WireMock instance
  fastify.get('/:id/mappings', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params

    const instance = await fastify.prisma.wiremockInstance.findUnique({
      where: { id },
      include: { project: true }
    })

    if (!instance) {
      return reply.status(404).send({
        success: false,
        error: 'Instance not found'
      })
    }

    try {
      const response = await axios.get(`${instance.url}/__admin/mappings`, {
        timeout: 10000
      })

      return reply.send({
        success: true,
        data: response.data
      })
    } catch (error: any) {
      return reply.status(502).send({
        success: false,
        error: 'Failed to fetch mappings from WireMock',
        details: error.message
      })
    }
  })

  // Get requests from WireMock instance
  fastify.get('/:id/requests', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params

    const instance = await fastify.prisma.wiremockInstance.findUnique({
      where: { id },
      include: { project: true }
    })

    if (!instance) {
      return reply.status(404).send({
        success: false,
        error: 'Instance not found'
      })
    }

    try {
      const response = await axios.get(`${instance.url}/__admin/requests`, {
        timeout: 10000
      })

      return reply.send({
        success: true,
        data: response.data
      })
    } catch (error: any) {
      return reply.status(502).send({
        success: false,
        error: 'Failed to fetch requests from WireMock',
        details: error.message
      })
    }
  })

  // Get unmatched requests from WireMock instance
  fastify.get('/:id/requests/unmatched', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params

    const instance = await fastify.prisma.wiremockInstance.findUnique({
      where: { id },
      include: { project: true }
    })

    if (!instance) {
      return reply.status(404).send({
        success: false,
        error: 'Instance not found'
      })
    }

    try {
      const response = await axios.get(`${instance.url}/__admin/requests/unmatched`, {
        timeout: 10000
      })

      return reply.send({
        success: true,
        data: response.data
      })
    } catch (error: any) {
      return reply.status(502).send({
        success: false,
        error: 'Failed to fetch unmatched requests from WireMock',
        details: error.message
      })
    }
  })

  // Clear requests from WireMock instance
  fastify.delete('/:id/requests', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params

    const instance = await fastify.prisma.wiremockInstance.findUnique({
      where: { id },
      include: { project: true }
    })

    if (!instance) {
      return reply.status(404).send({
        success: false,
        error: 'Instance not found'
      })
    }

    try {
      await axios.delete(`${instance.url}/__admin/requests`, {
        timeout: 10000
      })

      return reply.send({
        success: true,
        message: 'Request log cleared successfully'
      })
    } catch (error: any) {
      return reply.status(502).send({
        success: false,
        error: 'Failed to clear requests from WireMock',
        details: error.message
      })
    }
  })

  // Reset WireMock instance
  fastify.post('/:id/reset', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params

    const instance = await fastify.prisma.wiremockInstance.findUnique({
      where: { id },
      include: { project: true }
    })

    if (!instance) {
      return reply.status(404).send({
        success: false,
        error: 'Instance not found'
      })
    }

    try {
      await axios.post(`${instance.url}/__admin/reset`, {}, {
        timeout: 10000
      })

      return reply.send({
        success: true,
        message: 'WireMock instance reset successfully'
      })
    } catch (error: any) {
      return reply.status(502).send({
        success: false,
        error: 'Failed to reset WireMock instance',
        details: error.message
      })
    }
  })
}
