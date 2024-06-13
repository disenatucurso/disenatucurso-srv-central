import { Router } from 'express';
import { serve, setup } from 'swagger-ui-express';

const router = Router();
const swaggerSpec = {
    openapi: '3.0.0',
    info: {
      title: 'Diseña tu Curso API',
      version: '1.0.0',
      description: 'Documentación de la API',
    },
    components: {
        securitySchemes: {
            BearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
            },
        },
    },
    tags: [
      {
        name: 'Público', // Nombre del primer controlador
        description: 'Endpoints que no requieren Autenticación',
      },
      {
        name: 'Usuarios', // Nombre del segundo controlador
        description: 'Endpoints que requieren un usuario Autenticado',
      },
      {
        name: 'Administrador', // Nombre del segundo controlador
        description: 'Endpoints que requieren un usuario Autenticado con el Rol Administrador',
      },
    ],
    paths: {
      '/api/login': {
        post: {
          tags: ['Público'],
          summary: 'Iniciar sesión',
          description: 'Inicia sesión con credenciales de usuario. Devuelve Token de Autorización.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    username: { type: 'string' },
                    password: { type: 'string' },
                  },
                  required: ['password', 'username'],
                },
              },
            },
          },
          responses: {
            '200': {
              description: '',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      token: { type: 'string' },
                    },
                  },
                },
              },
              headers: {
                Authorization: {
                  description: 'Token de autorización',
                  schema: {
                    type: 'string',
                  },
                },
              },
            },
          },
        },
      },
      '/api/forgotPass': {
        post: {
          tags: ['Público'],
          summary: 'Proceso para restablecer la contraseña',
          description: 'Envía un email al usuario con una nueva contraseña',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    username: { type: 'string' }
                  },
                  required: ['username']
                },
              },
            },
          },
          responses: {
            '200': {
              description: '200 OK si envió email correctamente',
            }
          },
        },
      },
      '/api/institucion': {
        get: {
          tags: ['Público'],
          summary: 'Nombre de la Institución',
          description: 'Devuelve el nombre de la Institución',
          responses: {
            '200': {
              description: '',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      nombre: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/bajarCurso': {
        get: {
          tags: ['Público'],
          summary: 'Devuelve base64 de curso',
          description: 'Devuelve la representación string base64 del binario de un curso subido al servidor central',
          parameters: [
            {
                in: 'query',
                name: 'idCurso',
                schema: {
                    type: 'integer'
                },
                required: true,
                description: 'ID del curso a descargar'
            }
          ],
          responses: {
            '200': {
              description: 'Devuelvo base64 del curso',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      idCurso: { type: 'integer' },
                      version: { type: 'integer' },
                      base64: { type: 'string' }
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/listarCursos': {
        get: {
          tags: ['Público'],
          summary: 'Devuelve una lista de cursos',
          description: 'Devuelve una lista con información sobre los cursos, pudiendo filtrar por parámetro',
          parameters: [
            {
                in: 'query',
                name: 'criterio',
                schema: {
                    type: 'string'
                },
                required: false,
                description: 'Criterio de búsqueda de los cursos'
            }
          ],
          responses: {
            '200': {
              description: '',
              content: {
                'application/json': {
                    schema: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                              idCurso: { type: 'integer' },
                              version: { type: 'integer' },
                              nombreCurso:{ type: 'string' },
                              username: { type: 'string' },
                              nombreUsuario: { type: 'string' }
                            }
                        }
                    }
                }
              },
            },
          },
        },
      },
      '/api/bajarSchema': {
        get: {
          tags: ['Público'],
          summary: 'Devuelve base64 del schema',
          description: 'Devuelve la representación string base64 del binario de un schema subido al servidor central',
          parameters: [
            {
                in: 'query',
                name: 'schemaVersion',
                schema: {
                    type: 'integer'
                },
                required: true,
                description: 'ID del schema a descargar'
            }
          ],
          responses: {
            '200': {
              description: 'Devuelvo base64 del schema',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      schemaVersion: { type: 'integer' },
                      base64: { type: 'string' }
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/nuevaIncidencia': {
        post: {
          tags: ['Usuarios'],
          summary: 'Registra una incidencia',
          description: 'Registra una incidencia',
          security: [
            {
                BearerAuth: []
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    titulo: { type: 'string' },
                    descripcion: { type: 'string' },
                    categoria: { type: 'string' }
                  },
                  required: ['titulo', 'descripcion','categoria'],
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Retorno idIncidencia',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      idIncidencia: { type: 'integer' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/subirCurso': {
        post: {
          tags: ['Usuarios'],
          summary: 'Guarda un curso en el servidor central',
          description: 'Guarda o actualiza un curso en el servidor',
          security: [
            {
                BearerAuth: []
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    base64: { type: 'string' }
                  },
                  required: ['base64'],
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Retorno curso modificado',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      idCurso: { type: 'integer' },
                      version: { type: 'integer' },
                      base64: { type: 'string' }
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/cambiarPass': {
        post: {
          tags: ['Usuarios'],
          summary: 'Proceso para restablecer la contraseña',
          description: 'Envía un email al usuario con una nueva contraseña',
          security: [
            {
                BearerAuth: []
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    oldPass: { type: 'string' },
                    newPass: { type: 'string' },
                  },
                  required: ['oldPass', 'newPass'],
                },
              },
            },
          },
          responses: {
            '200': {
              description: '200 OK cambio de password correctamente',
            }
          },
        },
      },
      '/api/registrar': {
        post: {
          tags: ['Administrador'],
          summary: 'Registrar usuario',
          description: 'Registra la lista de usuarios',
          security: [
            {
                BearerAuth: []
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      username: { type: 'string' },
                      email: { type: 'string' }
                    },
                    required: ['username','email']
                  }
                }
              }
            },
          },
          responses: {
            '200': {
              description: '',
              content: {
                'application/json': {
                    schema: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                              username: { type: 'string' },
                              email: { type: 'string' },
                              creado: { type: 'boolean' }
                          }
                        }
                    }
                }
              },
            },
          },
        },
      },
    },
};

// Montar la interfaz de Swagger
router.use('/', serve);
router.get('/', setup(swaggerSpec));

export { router as swaggerRouter, swaggerSpec };
