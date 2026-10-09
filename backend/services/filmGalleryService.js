import { ApiError } from '../utils/ApiError.js';
import { idString } from '../utils/dto.js';
import { galleryKey, galleryUrl } from '../models/galleryStorage.js';
import { report } from '../utils/telemetry.js';

const found = row => { if (!row) throw ApiError.naoEncontrado(); return row; };
export const galleryDto = row => ({ id_imagem: idString(row.id_imagem), id_filme: idString(row.id_filme), tipo: row.tipo, url: row.url, texto_alternativo: row.texto_alternativo, ordem: row.ordem, principal: Boolean(row.principal) });
export function createFilmGalleryService({ model, identity, storage }) {
    async function lock(c, id, context) {
        if ((await identity.activeActor(c, context)).tipo_usuario !== 'ADMIN') throw ApiError.acessoNegado();
        return found(await model.lockFilm(c, id));
    }
    async function settle(id, key) {
        try {
            // Espera o lock do pai: resolve COMMIT ambíguo antes de decidir apagar arquivo.
            const referenced = await identity.transaction(async c => { await model.lockFilm(c, id); return Boolean(await model.reference(c, galleryUrl(key))); });
            await storage.settle(key, referenced); return true;
        } catch { report('gallery_storage_reconciliation_pending'); return false; }
    }
    return {
        async list(id, query, admin = false) {
            found(await model.film(id, admin));
            const rows = await model.list(id, query, admin), items = rows.slice(0, query.limit);
            return { items: items.map(galleryDto), pagination: { limit: query.limit, nextCursor: rows.length > query.limit ? `${items.at(-1).ordem}:${idString(items.at(-1).id_imagem)}` : null } };
        },
        async create(id, input, context) {
            await identity.transaction(c => lock(c, id, context), context);
            const saved = await storage.promote(input.stagingKey, id, context.signal, context.actor.id);
            try {
                return await identity.transaction(async c => {
                    await lock(c, id, context);
                    if (input.principal) await model.clearPrincipal(c, id, input.tipo);
                    const imageId = await model.insert(c, id, { ...input, url: saved.url });
                    await model.syncCover(c, id); await identity.audit(c, 'GALLERY.IMAGE_CREATED', id, context);
                    return galleryDto(found(await model.image(c, id, imageId)));
                }, context);
            } finally { await settle(id, saved.key); }
        },
        async patch(id, imageId, input, context) {
            return identity.transaction(async c => {
                await lock(c, id, context);
                const previous = found(await model.image(c, id, imageId)), next = { ...previous, ...input };
                if (next.principal) {
                    await model.clearPrincipal(c, id, next.tipo);
                    // clearPrincipal pode ter desmarcado o próprio alvo.
                    input = { ...input, principal: true };
                }
                await model.patch(c, id, imageId, input); await model.syncCover(c, id);
                await identity.audit(c, 'GALLERY.IMAGE_CHANGED', id, context);
                return galleryDto(found(await model.image(c, id, imageId)));
            }, context);
        },
        async remove(id, imageId, context) {
            // Descobrir a chave autorizada antes do I/O de journal; revalidar sob lock na mutação.
            const row = await identity.transaction(async c => { await lock(c, id, context); return found(await model.image(c, id, imageId)); }, context);
            const key = galleryKey(row.url);
            if (key) await storage.mark(key, id);
            try {
                await identity.transaction(async c => {
                    await lock(c, id, context); found(await model.image(c, id, imageId));
                    await model.remove(c, id, imageId); await model.syncCover(c, id); await identity.audit(c, 'GALLERY.IMAGE_DELETED', id, context);
                }, context);
            } finally { if (key) await settle(id, key); }
        },
        async content(key) { found(await model.publicReference(galleryUrl(key))); return storage.read(key); },
        async reconcile(id, context) {
            await identity.transaction(c => lock(c, id, context), context);
            const keys = await storage.pending(id); let completed = 0;
            for (const key of keys) if (await settle(id, key)) completed++;
            return { examined: keys.length, completed, pending: keys.length - completed };
        }
    };
}
