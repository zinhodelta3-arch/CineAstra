import { createImageUpload } from '../middlewares/uploadMiddleware.js';
import { checkUploadSignal } from '../services/imageProcessor.js';
import { success } from '../utils/dto.js';
import { ApiError } from '../utils/ApiError.js';

const parser = createImageUpload().single('image');
export function createImageUploadController(service) {
    return {
        async upload(req, res) {
            const release = service.acquire();
            let saved;
            try {
                if (!req.is('multipart/form-data')) throw new ApiError('Envie multipart/form-data', 415, null, 'UNSUPPORTED_MEDIA');
                await new Promise((resolve, reject) => {
                    const abort = () => { if (!req.complete) req.destroy(); reject(new ApiError('Upload interrompido', 408, null, 'UPLOAD_ABORTED')); };
                    req.signal?.addEventListener('abort', abort, { once: true });
                    parser(req, res, error => {
                        req.signal?.removeEventListener('abort', abort);
                        if (error) reject(error instanceof ApiError || error.name === 'MulterError' ? error : new ApiError('Multipart inválido', 400, null, 'INVALID_UPLOAD'));
                        else resolve();
                    });
                    if (req.signal?.aborted) abort();
                });
                checkUploadSignal(req.signal);
                saved = await service.upload(req.file, { actor: req.usuario, signal: req.signal, requestId: req.requestId });
                if (req.usuario.tipo === 'FORNECEDOR') saved.previewUrl = `/api/uploads/images/${saved.key}`;
                checkUploadSignal(req.signal);
                // Só conservar o objeto se a resposta foi encerrada normalmente.
                await new Promise((resolve, reject) => {
                    const close = () => { if (!res.writableFinished) reject(new ApiError('Upload interrompido', 408, null, 'UPLOAD_ABORTED')); };
                    res.once('close', close);
                    res.once('finish', () => { res.off('close', close); resolve(); });
                    res.location(saved.previewUrl); success(res, saved, 201);
                });
            } catch (error) { if (saved) await service.remove(saved.key, req.usuario?.id); throw error; }
            finally { if (req.file) delete req.file.buffer; release(); }
        },
        async preview(req, res) {
            const data = await service.read(req.params.key, req.usuario.id);
            res.set({ 'Content-Type': 'image/webp', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'none'; sandbox", 'Content-Disposition': 'inline; filename="preview.webp"' });
            res.send(data);
        },
        async remove(req, res) { await service.remove(req.params.key, req.usuario.id); res.sendStatus(204); }
    };
}
