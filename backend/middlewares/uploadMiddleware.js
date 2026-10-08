import multer from 'multer';
import { ApiError } from '../utils/ApiError.js';

// Montar somente após autenticação, autorização, rate limit e admissão de concorrência.
export function createImageUpload({ maxFileSize = 5242880 } = {}) {
    return multer({ storage: multer.memoryStorage(), limits: { fileSize: maxFileSize, files: 1, fields: 0, parts: 2, fieldSize: 0, fieldNameSize: 80, headerPairs: 20 },
        fileFilter: (req, file, cb) => {
            if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) return cb(new ApiError('Mídia não suportada', 415, null, 'UNSUPPORTED_MEDIA'));
            cb(null, true);
        } });
}
// MIME é só prefilter; não publicar bytes sem validador de conteúdo real.
export function requireUploadContentValidator(validator) {
    return async (req, res, next) => {
        if (!validator) throw ApiError.indisponivel();
        if (!req.file || await validator(req.file.buffer) !== true) throw new ApiError('Arquivo inválido', 415, null, 'UNSUPPORTED_MEDIA');
        next();
    };
}
