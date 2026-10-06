import multer from 'multer';
import { ApiError } from '../utils/ApiError.js';

// Não há rota de upload neste módulo. Montar SOMENTE depois de autenticação,
// escopo e limiter. Storage/assinatura real/decodificação/compensação ficam no 03.
export function createImageUpload({ maxFileSize = 5242880 } = {}) {
    return multer({ storage: multer.memoryStorage(), limits: { fileSize: maxFileSize, files: 1, fields: 4, parts: 5, fieldSize: 2048, fieldNameSize: 80 },
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
