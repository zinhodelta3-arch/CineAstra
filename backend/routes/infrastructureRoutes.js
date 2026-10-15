import { Router } from 'express';

export const infrastructureOperations = Object.freeze([
    { method: 'get', path: '/', operationId: 'getApiInfo' },
    { method: 'get', path: '/health', operationId: 'getLiveness' },
    { method: 'get', path: '/ready', operationId: 'getReadiness' },
    { method: 'get', path: '/openapi.json', operationId: 'getOpenApi' },
    { method: 'get', path: '/api-docs', operationId: 'getSwaggerUi' }
]);
export function infrastructureRoutes(controller) {
    const router = Router();
    router.get('/', controller.root);
    router.get('/health', controller.live);
    router.get('/ready', controller.ready);
    return router;
}
