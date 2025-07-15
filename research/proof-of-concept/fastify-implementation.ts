import fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import basicAuth from '@fastify/basic-auth';
import formbody from '@fastify/formbody';

/**
 * Proof-of-concept Fastify implementation mirroring current Express patterns
 */

// Simulate a simple repository pattern like the current implementation
interface MockResource {
  id: string;
  version: number;
  createdAt: string;
  lastModifiedAt: string;
  [key: string]: any;
}

class MockRepository {
  private data: Map<string, MockResource> = new Map();

  get(id: string): MockResource | undefined {
    return this.data.get(id);
  }

  create(draft: any): MockResource {
    const resource: MockResource = {
      id: `mock-${Date.now()}`,
      version: 1,
      createdAt: new Date().toISOString(),
      lastModifiedAt: new Date().toISOString(),
      ...draft,
    };
    this.data.set(resource.id, resource);
    return resource;
  }

  query(): { results: MockResource[]; count: number } {
    const results = Array.from(this.data.values());
    return { results, count: results.length };
  }

  delete(id: string): MockResource | undefined {
    const resource = this.data.get(id);
    if (resource) {
      this.data.delete(id);
    }
    return resource;
  }
}

// Fastify equivalent of Express abstract service pattern
class FastifyAbstractService {
  protected repository: MockRepository;
  protected basePath: string;

  constructor(fastify: FastifyInstance, repository: MockRepository, basePath: string) {
    this.repository = repository;
    this.basePath = basePath;
    this.registerRoutes(fastify);
  }

  private registerRoutes(fastify: FastifyInstance) {
    // GET collection
    fastify.get(`/${this.basePath}`, this.getCollection.bind(this));
    
    // GET by ID
    fastify.get(`/${this.basePath}/:id`, this.getById.bind(this));
    
    // CREATE
    fastify.post(`/${this.basePath}`, this.create.bind(this));
    
    // DELETE
    fastify.delete(`/${this.basePath}/:id`, this.deleteById.bind(this));
  }

  async getCollection(request: FastifyRequest, reply: FastifyReply) {
    const result = this.repository.query();
    reply.status(200).send(result);
  }

  async getById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const resource = this.repository.get(request.params.id);
    if (!resource) {
      reply.status(404).send({
        statusCode: 404,
        message: `Resource with ID '${request.params.id}' was not found.`,
        errors: [{
          code: 'ResourceNotFound',
          message: `Resource with ID '${request.params.id}' was not found.`,
        }],
      });
      return;
    }
    reply.status(200).send(resource);
  }

  async create(request: FastifyRequest<{ Body: any }>, reply: FastifyReply) {
    const resource = this.repository.create(request.body);
    reply.status(201).send(resource);
  }

  async deleteById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const resource = this.repository.delete(request.params.id);
    if (!resource) {
      reply.status(404).send({ statusCode: 404 });
      return;
    }
    reply.status(200).send(resource);
  }
}

// OAuth2 equivalent in Fastify
class FastifyOAuth2Server {
  private fastify: FastifyInstance;

  constructor(fastify: FastifyInstance) {
    this.fastify = fastify;
    this.registerRoutes();
  }

  private registerRoutes() {
    // Basic auth validation hook
    this.fastify.addHook('preHandler', async (request, reply) => {
      if (request.url.startsWith('/oauth/')) {
        try {
          await (request as any).basicAuth();
        } catch (err) {
          reply.status(401).send({
            code: 'invalid_client',
            message: 'Please provide valid client credentials using HTTP Basic Authentication.',
          });
        }
      }
    });

    // Token endpoint
    this.fastify.post('/oauth/token', this.tokenHandler.bind(this));
    this.fastify.post('/oauth/:projectKey/customers/token', this.customerTokenHandler.bind(this));
  }

  async tokenHandler(request: FastifyRequest<{ Body: { grant_type?: string } }>, reply: FastifyReply) {
    const grantType = request.body?.grant_type;
    
    if (!grantType) {
      reply.status(400).send({
        code: 'invalid_request',
        message: 'Missing required parameter: grant_type.',
      });
      return;
    }

    if (grantType === 'client_credentials') {
      const token = {
        access_token: 'mock-access-token',
        token_type: 'Bearer' as const,
        expires_in: 3600,
        scope: 'manage_project',
      };
      reply.status(200).send(token);
      return;
    }

    reply.status(400).send({
      code: 'unsupported_grant_type',
      message: `Invalid grant type: ${grantType}`,
    });
  }

  async customerTokenHandler(request: FastifyRequest, reply: FastifyReply) {
    // Mock customer token implementation
    reply.status(200).send({
      access_token: 'mock-customer-token',
      token_type: 'Bearer' as const,
      expires_in: 3600,
      scope: 'customer',
    });
  }
}

// Main Fastify app factory
export function createFastifyApp() {
  const app = fastify({
    logger: true,
    bodyLimit: 16 * 1024 * 1024, // 16MB like Express version
  });

  // Register plugins
  app.register(basicAuth, {
    validate: async function (username: string, password: string, req, reply, done) {
      // Mock authentication - in real implementation this would validate credentials
      if (username === 'test' && password === 'test') {
        done(); // Success
      } else {
        done(new Error('Invalid credentials'));
      }
    },
  });

  app.register(formbody);

  // Error handler
  app.setErrorHandler(async (error, request, reply) => {
    if (error.statusCode) {
      reply.status(error.statusCode).send({
        statusCode: error.statusCode,
        message: error.message,
        errors: [{ code: 'Error', message: error.message }],
      });
      return;
    }
    
    reply.status(500).send({
      statusCode: 500,
      message: error.message,
      errors: [{ code: 'InternalError', message: error.message }],
    });
  });

  // Register OAuth2 server
  new FastifyOAuth2Server(app);

  // Register services with project context
  app.register(async function projectRoutes(fastify) {
    const repository = new MockRepository();
    
    // Simulate project-scoped routes
    fastify.addHook('preHandler', async (request, reply) => {
      // Mock authentication middleware equivalent
      // In real implementation, this would validate JWT tokens
    });

    new FastifyAbstractService(fastify, repository, 'products');
    new FastifyAbstractService(fastify, repository, 'customers');
    new FastifyAbstractService(fastify, repository, 'carts');
  }, { prefix: '/:projectKey' });

  return app;
}

// Export for benchmarking
export { FastifyAbstractService, MockRepository };