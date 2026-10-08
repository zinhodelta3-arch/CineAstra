import { ApiError } from '../utils/ApiError.js';
import { normalizeImage, IMAGE_LIMITS, checkUploadSignal } from './imageProcessor.js';

export function createImageUploadService({ storage, authorize, processor = normalizeImage }) {
    let active = 0;
    return {
        acquire() {
            if (active >= IMAGE_LIMITS.concurrency) throw new ApiError('Uploads ocupados; tente novamente', 503, null, 'UPLOAD_BUSY');
            active++;
            let released = false;
            return () => { if (!released) { released = true; active--; } };
        },
        async upload(file, context) {
            const image = await processor(file, context.signal);
            // Revalidar sessão após o trabalho de CPU, antes de persistir. Nenhum I/O de imagem dentro do lock SQL.
            await authorize(context);
            checkUploadSignal(context.signal);
            const saved = await storage.put(image, context.signal);
            try { checkUploadSignal(context.signal); } catch (error) { await storage.remove(saved.key); throw error; }
            return { ...saved, width: image.width, height: image.height, bytes: image.bytes, contentType: image.contentType, previewUrl: `/api/admin/uploads/images/${saved.key}` };
        },
        read: key => storage.read(key),
        remove: key => storage.remove(key)
    };
}
