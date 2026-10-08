import SwaggerParser from '@apidevtools/swagger-parser';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { infrastructureOperations } from '../routes/infrastructureRoutes.js';
import { identityOperations } from '../routes/identityRoutes.js';
import { catalogOperations } from '../routes/catalogRoutes.js';
import { imageUploadOperations } from '../routes/imageUploadRoutes.js';

export async function validateOpenapi() {
    const spec = JSON.parse(await readFile(new URL('../docs/openapi.json', import.meta.url), 'utf8'));
    await SwaggerParser.validate(structuredClone(spec));
    const ids = new Set();
    const operations = Object.entries(spec.paths).flatMap(([path, methods]) => Object.entries(methods).map(([method, op]) => ({ path, method, op })));
    const registered = [...infrastructureOperations, ...identityOperations, ...catalogOperations, ...imageUploadOperations];
    if (operations.length !== registered.length) throw new Error('OpenAPI diverge das rotas registradas');
    for (const route of registered) {
        const op = spec.paths[route.path]?.[route.method];
        if (!op || op.operationId !== route.operationId || ids.has(op.operationId) || !op.tags?.length || !op.responses || !Array.isArray(op.security)) throw new Error('Contrato OpenAPI inválido');
        ids.add(op.operationId);
    }
    return spec;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    await validateOpenapi();
    console.info('OpenAPI 3.0.3 válido; infraestrutura, identidade, catálogo e uploads conferidos.');
}
