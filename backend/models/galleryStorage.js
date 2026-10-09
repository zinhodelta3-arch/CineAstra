import { mkdir, writeFile, readFile, readdir, unlink, lstat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { createImageStorage, IMAGE_KEY } from './imageStorage.js';
import { ApiError } from '../utils/ApiError.js';
export const galleryUrl = key => `/api/film-images/${key}`;
export function galleryKey(url) { const key = typeof url === 'string' && url.startsWith('/api/film-images/') ? url.slice('/api/film-images/'.length) : ''; return IMAGE_KEY.test(key) ? key : null; }

// Journal de compensação independente do SQL, nunca disponibilizado como arquivo HTTP.
export function createGalleryStorage({ directory, staging, namespace = 'film-images' }) {
    if (!['film-images', 'input-images', 'combo-images'].includes(namespace)) throw new TypeError('Galeria inválida');
    const url = key => `/api/${namespace}/${key}`;
    const keyFromUrl = value => { const key = typeof value === 'string' && value.startsWith(`/api/${namespace}/`) ? value.slice(`/api/${namespace}/`.length) : ''; return IMAGE_KEY.test(key) ? key : null; };
    const root = directory ? resolve(directory) : null;
    const files = createImageStorage({ directory, expiresAfterMs: null, maxFiles: 2000 });
    const journal = key => { if (!root) throw ApiError.indisponivel(); if (!IMAGE_KEY.test(key)) throw ApiError.naoEncontrado(); return join(root, `${key}.json`); };
    async function mark(key, filmId) {
        const target = journal(key);
        await mkdir(root, { recursive: true, mode: 0o700 });
        if ((await lstat(root)).isSymbolicLink()) throw ApiError.indisponivel();
        // Registro mínimo estável; duas remoções da mesma imagem não truncam o journal.
        try { await writeFile(target, JSON.stringify({ key, filmId }), { flag: 'wx', mode: 0o600 }); } catch (e) { if (e.code !== 'EEXIST') throw e; }
    }
    return {
        async promote(stagingKey, filmId, signal, ownerId) {
            const buffer = await staging.read(stagingKey, ownerId);
            const saved = await files.put({ buffer }, signal);
            try { await mark(saved.key, filmId); } catch (error) { await files.remove(saved.key); throw error; }
            return { key: saved.key, url: url(saved.key) };
        },
        mark, url, keyFromUrl,
        async settle(key, referenced) {
            if (!referenced) await files.remove(key);
            try { await unlink(journal(key)); } catch (error) { if (error.code !== 'ENOENT') throw error; }
        },
        async pending(filmId) {
            if (!root) throw ApiError.indisponivel();
            let entries; try { entries = await readdir(root); } catch (e) { if (e.code === 'ENOENT') return []; throw e; }
            const results = [];
            for (const name of entries) {
                const key = name.endsWith('.webp.json') ? name.slice(0, -5) : '';
                if (!IMAGE_KEY.test(key)) continue;
                try { const entry = JSON.parse(await readFile(journal(key), 'utf8')); if (entry.filmId === filmId && entry.key === key) results.push(key); } catch (e) { if (e.code !== 'ENOENT') throw e; }
                if (results.length >= 100) break;
            }
            return results;
        },
        read: key => files.read(key)
    };
}
