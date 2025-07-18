import * as express from 'express';
import * as auth from 'basic-auth';
import * as bodyParser from 'body-parser';

type Request = express.Request;
type Response = express.Response;
type NextFunction = express.NextFunction;
type Router = express.Router;

/**
 * Comparable Express implementation for benchmarking
 */

// Same mock repository as Fastify version
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

// Express abstract service pattern (similar to current implementation)
class ExpressAbstractService {
  protected repository: MockRepository;
  protected basePath: string;

  constructor(parent: Router, repository: MockRepository, basePath: string) {
    this.repository = repository;
    this.basePath = basePath;
    this.registerRoutes(parent);
  }

  private registerRoutes(parent: Router) {
    const router = express.Router({ mergeParams: true });

    router.get('/', this.getCollection.bind(this));
    router.get('/:id', this.getById.bind(this));
    router.post('/', this.create.bind(this));
    router.delete('/:id', this.deleteById.bind(this));

    parent.use(`/${this.basePath}`, router);
  }

  getCollection(request: Request, response: Response) {
    const result = this.repository.query();
    response.status(200).send(result);
  }

  getById(request: Request, response: Response) {
    const resource = this.repository.get(request.params.id);
    if (!resource) {
      response.status(404).send({
        statusCode: 404,
        message: `Resource with ID '${request.params.id}' was not found.`,
        errors: [{
          code: 'ResourceNotFound',
          message: `Resource with ID '${request.params.id}' was not found.`,
        }],
      });
      return;
    }
    response.status(200).send(resource);
  }

  create(request: Request, response: Response) {
    const resource = this.repository.create(request.body);
    response.status(201).send(resource);
  }

  deleteById(request: Request, response: Response) {
    const resource = this.repository.delete(request.params.id);
    if (!resource) {
      response.status(404).send({ statusCode: 404 });
      return;
    }
    response.status(200).send(resource);
  }
}

// Express OAuth2 server
class ExpressOAuth2Server {
  createRouter() {
    const router = express.Router();
    router.use(bodyParser.urlencoded({ extended: true }));
    router.use(this.validateClientCredentials.bind(this));
    router.post('/token', this.tokenHandler.bind(this));
    router.post('/:projectKey/customers/token', this.customerTokenHandler.bind(this));
    return router;
  }

  validateClientCredentials(request: Request, response: Response, next: NextFunction) {
    const authHeader = request.header('Authorization');
    if (!authHeader) {
      return response.status(401).send({
        code: 'invalid_client',
        message: 'Please provide valid client credentials using HTTP Basic Authentication.',
      });
    }

    const credentials = auth.parse(authHeader);
    if (!credentials) {
      return response.status(400).send({
        code: 'invalid_client',
        message: 'Please provide valid client credentials using HTTP Basic Authentication.',
      });
    }

    // Mock validation
    if (credentials.name === 'test' && credentials.pass === 'test') {
      next();
    } else {
      response.status(401).send({
        code: 'invalid_client',
        message: 'Invalid credentials.',
      });
    }
  }

  tokenHandler(request: Request, response: Response, next: NextFunction) {
    const grantType = request.query.grant_type || request.body?.grant_type;
    
    if (!grantType) {
      return response.status(400).send({
        code: 'invalid_request',
        message: 'Missing required parameter: grant_type.',
      });
    }

    if (grantType === 'client_credentials') {
      const token = {
        access_token: 'mock-access-token',
        token_type: 'Bearer' as const,
        expires_in: 3600,
        scope: 'manage_project',
      };
      response.status(200).send(token);
      return;
    }

    response.status(400).send({
      code: 'unsupported_grant_type',
      message: `Invalid grant type: ${grantType}`,
    });
  }

  customerTokenHandler(request: Request, response: Response) {
    response.status(200).send({
      access_token: 'mock-customer-token',
      token_type: 'Bearer' as const,
      expires_in: 3600,
      scope: 'customer',
    });
  }
}

// Main Express app factory
export function createExpressApp() {
  const app = express();
  
  // Set limit to 16mb to match Fastify
  app.use(express.json({ limit: '16mb' }));

  const oauth2 = new ExpressOAuth2Server();
  app.use('/oauth', oauth2.createRouter());

  // Project router
  const projectRouter = express.Router({ mergeParams: true });
  
  // Mock auth middleware
  projectRouter.use((request: Request, response: Response, next: NextFunction) => {
    // Mock authentication - in real implementation would validate JWT
    next();
  });

  // Register services
  const repository = new MockRepository();
  new ExpressAbstractService(projectRouter, repository, 'products');
  new ExpressAbstractService(projectRouter, repository, 'customers');
  new ExpressAbstractService(projectRouter, repository, 'carts');

  app.use('/:projectKey', projectRouter);

  // Error handler
  app.use((err: Error, req: Request, resp: Response, next: NextFunction) => {
    if ('statusCode' in err) {
      resp.status((err as any).statusCode).send({
        statusCode: (err as any).statusCode,
        message: err.message,
        errors: [{ code: 'Error', message: err.message }],
      });
      return;
    }
    
    resp.status(500).send({
      statusCode: 500,
      message: err.message,
      errors: [{ code: 'InternalError', message: err.message }],
    });
  });

  return app;
}

// Export for benchmarking
export { ExpressAbstractService, MockRepository };