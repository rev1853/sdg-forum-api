const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'SDG Threads API',
      version: '1.0.0',
      description: 'API documentation for the SDG-themed discussion platform'
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        UserSummary: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            username: { type: 'string' },
            name: { type: 'string', nullable: true }
          }
        },
        Category: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            sdg_number: { type: 'integer' }
          }
        },
        ChatGroup: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            categories: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  category: { $ref: '#/components/schemas/Category' }
                }
              }
            },
            _count: {
              type: 'object',
              properties: {
                members: { type: 'integer' },
                messages: { type: 'integer' }
              }
            }
          }
        },
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer' },
            pageSize: { type: 'integer' },
            total: { type: 'integer' },
            totalPages: { type: 'integer' }
          }
        },
        ChatMessage: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            group_id: { type: 'string' },
            body: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
            user: { $ref: '#/components/schemas/UserSummary' },
            reply_to: {
              type: 'object',
              nullable: true,
              properties: {
                id: { type: 'string' },
                body: { type: 'string' },
                user: { $ref: '#/components/schemas/UserSummary' }
              }
            }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            status: { type: 'string' },
            details: { type: 'object' }
          }
        }
      },
      responses: {
        Unauthorized: {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        },
        NotFound: {
          description: 'Not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        },
        BadRequest: {
          description: 'Bad request',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        }
      }
    },
    security: []
  },
  apis: [path.join(__dirname, '../routes/*.js')]
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
