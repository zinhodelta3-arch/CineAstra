import { readFile, writeFile } from 'node:fs/promises';
import { imageUploadOperations } from '../routes/imageUploadRoutes.js';
const file = new URL('../docs/openapi.json', import.meta.url);
const spec = JSON.parse(await readFile(file, 'utf8'));
spec.info.version = '1.3.0';
spec.tags = [...spec.tags.filter(t => t.name !== 'Uploads'), { name: 'Uploads', description: 'Staging privado por usuário ADMIN ou FORNECEDOR; não publica galeria.' }];
const key = { type: 'string', pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\\.webp$' };
for (const r of imageUploadOperations) {
    const responses = Object.fromEntries([400, 401, 403, 404, 408, 413, 415, 429, 500, 503].map(code => [code, { description: 'Erro padronizado: multipart, autenticação/2FA, autorização, chave, interrupção, limite, conteúdo ou dependência indisponível.', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }]));
    const op = { operationId: r.operationId, tags: ['Uploads'], security: [{ bearerAuth: [] }], summary: { post: 'Enviar imagem para staging', get: 'Prévia privada da imagem', delete: 'Excluir imagem de staging' }[r.method],
        description: `${r.path.startsWith('/api/admin/') ? 'ADMIN com sessão ativa e 2FA' : 'FORNECEDOR com sessão ativa'}. Staging vinculado à conta autenticada; outro usuário não lê, remove nem promove a imagem. Sem cookies. Staging local de instância única, TTL de 24h, máximo 200 arquivos. Sem associação automática ao catálogo. Ausência de storage configurado em produção: 503. Cache-Control: no-store.`, responses };
    if (r.method === 'post') {
        op.description += ' Um campo image, um arquivo, nenhum campo textual. Até 5 MiB JPEG/PNG/WebP, assinatura e MIME consistentes; decodificação real, sem animação, até 8192 por eixo e 16 milhões de pixels. Saída WebP até 2048 por eixo, sem metadados. Até dois uploads em andamento; falha/abort remove staging criado. Não aceita URLs.';
        op.requestBody = { required: true, content: { 'multipart/form-data': { schema: { type: 'object', required: ['image'], additionalProperties: false, properties: { image: { type: 'string', format: 'binary' } } }, encoding: { image: { contentType: 'image/jpeg, image/png, image/webp' } } } } };
        responses['201'] = { description: 'Imagem reprocessada armazenada por até 24h', headers: { Location: { schema: { type: 'string' }, description: 'URL relativa da prévia autenticada' } }, content: { 'application/json': { schema: { type: 'object', required: ['success', 'data', 'requestId'], properties: { success: { type: 'boolean', enum: [true] }, requestId: { type: 'string', format: 'uuid' }, data: { type: 'object', required: ['key', 'previewUrl', 'expiresAt', 'width', 'height', 'bytes', 'contentType'], properties: { key, previewUrl: { type: 'string' }, expiresAt: { type: 'string', format: 'date-time' }, width: { type: 'integer', minimum: 1, maximum: 2048 }, height: { type: 'integer', minimum: 1, maximum: 2048 }, bytes: { type: 'integer', maximum: 5242880 }, contentType: { type: 'string', enum: ['image/webp'] } } } } }, example: { success: true, requestId: '00000000-0000-4000-8000-000000000001', data: { key: '00000000-0000-4000-8000-000000000001.webp', previewUrl: `${r.path.startsWith('/api/admin/') ? '/api/admin' : '/api'}/uploads/images/00000000-0000-4000-8000-000000000001.webp`, expiresAt: '2026-10-09T12:00:00.000Z', width: 320, height: 200, bytes: 2048, contentType: 'image/webp' } } } } };
    } else {
        op.parameters = [{ name: 'key', in: 'path', required: true, schema: key }];
        if (r.method === 'get') responses['200'] = { description: 'Somente bytes WebP reprocessados. Chave vencida/inválida/ausente: 404.', content: { 'image/webp': { schema: { type: 'string', format: 'binary' } } } };
        else responses['204'] = { description: 'Removido ou já ausente. Não exclui nenhuma imagem de galeria.' };
    }
    (spec.paths[r.path] ??= {})[r.method] = op;
}
await writeFile(file, `${JSON.stringify(spec, null, 2)}\n`);
console.info(`Uploads: ${imageUploadOperations.length} operações documentadas.`);
