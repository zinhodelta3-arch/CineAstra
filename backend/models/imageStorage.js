import { mkdir, readdir, lstat, writeFile, rename, unlink, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { ApiError } from '../utils/ApiError.js';
import { IMAGE_LIMITS, checkUploadSignal } from '../services/imageProcessor.js';

export const IMAGE_KEY = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.webp$/;
export const STAGING_TTL_MS = 24 * 60 * 60 * 1000;
// Staging privado por conta, nunca express.static; galerias promovem cópias.
export function createImageStorage({ directory, maxFiles = 200, now = Date.now, expiresAfterMs = STAGING_TTL_MS, enforceOwner = false } = {}) {
    const root = directory ? resolve(directory) : null;
    let writing = false;
    function path(key) {
        if (!root) throw ApiError.indisponivel();
        if (!IMAGE_KEY.test(key)) throw ApiError.naoEncontrado();
        return join(root, key);
    }
    async function owner(key, ownerId) {
        if (!enforceOwner) return;
        if (!ownerId) throw ApiError.acessoNegado();
        let stored; try { stored = await readFile(`${path(key)}.owner`, 'utf8'); } catch (e) { if (e.code === 'ENOENT') throw ApiError.acessoNegado(); throw e; }
        if (stored !== String(ownerId)) throw ApiError.acessoNegado();
    }
    async function remove(key, ownerId) {
        try { await lstat(path(key)); } catch (e) { if (e.code === 'ENOENT') return; throw e; }
        await owner(key, ownerId);
        try { await unlink(path(key)); } catch (e) { if (e.code !== 'ENOENT') throw e; }
        if (enforceOwner) try { await unlink(`${path(key)}.owner`); } catch (e) { if (e.code !== 'ENOENT') throw e; }
    }
    async function prune() {
        let count = 0;
        for (const entry of await readdir(root, { withFileTypes: true })) {
            const key = entry.name.replace(/\.part$/, '');
            if (!IMAGE_KEY.test(key) || !entry.isFile()) continue;
            const target = join(root, entry.name);
            try {
                const stat = await lstat(target);
                if (expiresAfterMs !== null && now() - stat.mtimeMs >= expiresAfterMs) { await unlink(target); if (enforceOwner) await unlink(`${target}.owner`).catch(e => { if (e.code !== 'ENOENT') throw e; }); } else count++;
            } catch (error) { if (error.code !== 'ENOENT') throw error; }
        }
        if (count >= maxFiles) throw new ApiError('Armazenamento temporário cheio', 503, null, 'UPLOAD_STORAGE_FULL');
    }
    return {
        async put(image, signal, ownerId) {
            if (!root || writing) throw ApiError.indisponivel();
            if (enforceOwner && !ownerId) throw ApiError.acessoNegado();
            writing = true;
            const key = `${randomUUID()}.webp`, target = path(key), temporary = `${target}.part`;
            let published = false;
            try {
                checkUploadSignal(signal);
                await mkdir(root, { recursive: true, mode: 0o700 });
                if ((await lstat(root)).isSymbolicLink()) throw ApiError.indisponivel();
                await prune();
                await writeFile(temporary, image.buffer, { flag: 'wx', mode: 0o600, signal });
                checkUploadSignal(signal);
                await rename(temporary, target); published = true;
                if (enforceOwner) await writeFile(`${target}.owner`, String(ownerId), { flag: 'wx', mode: 0o600 });
                checkUploadSignal(signal);
                return { key, expiresAt: expiresAfterMs === null ? null : new Date(now() + expiresAfterMs).toISOString() };
            } catch (error) {
                try { await unlink(published ? target : temporary); } catch (e) { if (e.code !== 'ENOENT') throw e; }
                if (enforceOwner) try { await unlink(`${target}.owner`); } catch (e) { if (e.code !== 'ENOENT') throw e; }
                checkUploadSignal(signal);
                throw error;
            } finally { writing = false; }
        },
        async read(key, ownerId) {
            try {
                const target = path(key), stat = await lstat(target);
                await owner(key, ownerId);
                if (!stat.isFile() || stat.isSymbolicLink() || stat.size > IMAGE_LIMITS.bytes) throw ApiError.naoEncontrado();
                if (expiresAfterMs !== null && now() - stat.mtimeMs >= expiresAfterMs) { await remove(key, ownerId); throw ApiError.naoEncontrado(); }
                return await readFile(target);
            } catch (e) { if (e.code === 'ENOENT') throw ApiError.naoEncontrado(); throw e; }
        },
        remove
    };
}
