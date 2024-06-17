import express from 'express';
import apiRouter from './api.mjs';
import { swaggerRouter, swaggerSpec } from './swagger.mjs';
import * as OpenApiValidator from 'express-openapi-validator';
import cors from 'cors';
import constantes from './constantes.mjs';

const app = express();

// Configurar CORS antes de la validación de OpenAPI
app.use(cors({
  // origin: 'http://localhost:4200', // Permitir solicitudes solo desde este origen
  methods: ['GET', 'POST','OPTIONS'], // Permitir los métodos GET y POST
  allowedHeaders: ['Content-Type', 'Authorization'], // Permitir los encabezados Content-Type y Authorization
}));

// Configurar el validador de OpenAPI
app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: false }));
app.use(
    OpenApiValidator.middleware({
      apiSpec: swaggerSpec,
      validateRequests: true,
      //validateResponses: true,
      ignoreUndocumented: true
  }),
);

// Montar Swagger
app.use('/swagger-ui', swaggerRouter);
// Montar la API
app.use('/api', apiRouter);

// Manejador de errores de Express
app.use((err, req, res, next) => {
    // 7. Customize errors
    // Obtener la pila de llamadas (stack trace)
    const stackTrace = err.stack.split('\n');
    const filterStack = [];
    // Agrego el mensaje de error
    filterStack.push(stackTrace[0]);
    for (let i = 1; i < stackTrace.length; i++) {
      const elemento = stackTrace[i];
      // Check if element contains "example"
      if (elemento.includes(constantes.RUTA_CODIGO)) {
        filterStack.push(elemento);
      }
    }
    console.log("------------------------------------------");
    console.log("Error inesperado");
    console.log("Accion: "+req.method+" - "+req.url);
    console.log("User: "+req.user);
    console.log("RequestBody: ");
    console.log(JSON.stringify(req.body, null, 2).substring(0, 300));
    console.log("StackTrace:");
    for (let i = 0; i < filterStack.length; i++) {
      console.log(filterStack[i]);
    }
    console.log("------------------------------------------");
    // ||: Esto es el operador de coalescencia nula (nullish coalescing operator). 
    // Si err.status es null o undefined, entonces se utiliza el cod 500 como respuesta HTTP.
    res.status(err.status || 500).json({
      message: err.message,
      errors: err.errors,
    });
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
