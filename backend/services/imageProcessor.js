import sharp from 'sharp';
import { ApiError } from '../utils/ApiError.js';

export const IMAGE_LIMITS = Object.freeze({ bytes: 5 * 1024 * 1024, pixels: 16000000, dimension: 8192, outputDimension: 2048, concurrency: 2 });
const invalid = () => new ApiError('Imagem inválida ou não suportada', 415, null, 'UNSUPPORTED_MEDIA');
export function checkUploadSignal(signal) { if (signal?.aborted) throw new ApiError('Upload interrompido', 408, null, 'UPLOAD_ABORTED'); }
function signature(b) {
    if (b.length >= 8 && b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'png';
    if (b.length >= 3 && b[0] === 255 && b[1] === 216 && b[2] === 255) return 'jpeg';
    if (b.length >= 12 && b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') return 'webp';
    throw invalid();
}
export async function normalizeImage(file, signal) {
    checkUploadSignal(signal);
    if (!file || !Buffer.isBuffer(file.buffer) || !file.buffer.length) throw ApiError.validacao('Envie uma imagem no campo image');
    if (file.buffer.length > IMAGE_LIMITS.bytes) throw new ApiError('Payload excessivo', 413, null, 'PAYLOAD_TOO_LARGE');
    const format = signature(file.buffer);
    if (file.mimetype !== `image/${format}`) throw invalid();
    const decoder = sharp(file.buffer, { failOn: 'warning', limitInputPixels: IMAGE_LIMITS.pixels, sequentialRead: true }).timeout({ seconds: 3 });
    try {
        const meta = await decoder.metadata();
        checkUploadSignal(signal);
        if (meta.format !== format || !meta.width || !meta.height || meta.width > IMAGE_LIMITS.dimension || meta.height > IMAGE_LIMITS.dimension || meta.width * meta.height > IMAGE_LIMITS.pixels || (meta.pages ?? 1) !== 1) throw invalid();
        // Reencodar pixels: não conservar EXIF, ICC, nomes originais ou bytes anexados.
        const { data, info } = await decoder.rotate().resize(IMAGE_LIMITS.outputDimension, IMAGE_LIMITS.outputDimension, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 85, effort: 3 }).toBuffer({ resolveWithObject: true });
        checkUploadSignal(signal);
        if (data.length > IMAGE_LIMITS.bytes) throw invalid();
        return { buffer: data, width: info.width, height: info.height, bytes: data.length, contentType: 'image/webp' };
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw invalid();
    } finally { decoder.destroy(); }
}
