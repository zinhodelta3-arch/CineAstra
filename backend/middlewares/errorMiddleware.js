import { ApiError } from '../utils/ApiError.js';
import { report } from '../utils/telemetry.js';

export function errorMiddleware(error, req, res, next) {
    if (res.headersSent) {
        report('request_failed_after_headers', { requestId: res.locals.requestId });
        if (!res.writableEnded) res.destroy();
        return;
    }
    let safe = error instanceof ApiError ? error : ApiError.erroInterno();
    if (error.type === 'entity.too.large' || error.code === 'LIMIT_FILE_SIZE') safe = new ApiError('Payload excessivo', 413, null, 'PAYLOAD_TOO_LARGE');
    else if (error.type === 'entity.parse.failed') safe = new ApiError('JSON inválido', 400, null, 'MALFORMED_JSON');
    else if (['encoding.unsupported', 'charset.unsupported'].includes(error.type)) safe = new ApiError('Mídia não suportada', 415, null, 'UNSUPPORTED_MEDIA');
    else if (error.name === 'MulterError') safe = new ApiError('Upload inválido', 400, null, 'INVALID_UPLOAD');
    else if (error.type === 'parameters.too.many') safe = new ApiError('Payload excessivo', 413, null, 'PAYLOAD_TOO_LARGE');
    if (safe.statusCode >= 500) report('request_failed', { requestId: res.locals.requestId, status: safe.statusCode });
    if (safe.statusCode === 401) res.set('WWW-Authenticate', 'Bearer');
    if (safe.statusCode === 503) res.set('Retry-After', '5');
    res.status(safe.statusCode).json(safe.toJSON(res.locals.requestId));
}
