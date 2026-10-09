import { ApiError } from '../utils/ApiError.js';
import { idString } from '../utils/dto.js';
import { report } from '../utils/telemetry.js';

const found = row => { if (!row) throw ApiError.naoEncontrado(); return row; };
const dto = (type, row) => ({ id_imagem: idString(row.id_imagem), [type === 'inputs' ? 'id_insumo' : 'id_combo']: idString(row[type === 'inputs' ? 'id_insumo' : 'id_combo']), tipo: row.tipo, url: row.url, texto_alternativo: row.texto_alternativo ?? null, ordem: row.ordem });
export function createCommerceGalleryService({ model, identity, storage }) {
    async function lock(type, c, id, context) {
        const actor = await identity.activeActor(c, context);
        const parent = found(await model.lockParent(type, c, id));
        if (actor.tipo_usuario === 'ADMIN') return parent;
        if (type !== 'inputs' || actor.tipo_usuario !== 'FORNECEDOR') throw ApiError.acessoNegado();
        const owner = found(await model.ownership(c, id));
        if (idString(owner.id_usuario) !== idString(actor.id_usuario) || owner.fornecedor_status !== 'ATIVO' || owner.usuario_status !== 'ATIVO' || owner.tipo_usuario !== 'FORNECEDOR' || owner.local_status !== 'ATIVO' || owner.vinculo_status !== 'ATIVO') throw ApiError.acessoNegado();
        return parent;
    }
    async function settle(type, id, key) {
        const files = storage[type];
        try {
            const referenced = await identity.transaction(async c => { await model.lockParent(type, c, id); return Boolean(await model.reference(type, c, files.url(key))); });
            await files.settle(key, referenced); return true;
        } catch { report('gallery_storage_reconciliation_pending'); return false; }
    }
    return {
        async list(type, id, q, admin = false) {
            if (admin) found(await model.parent(type, id));
            else found(await model.publicParent(type, id));
            const rows = await model.list(type, id, q), items = rows.slice(0, q.limit);
            return { items: items.map(row => dto(type, row)), pagination: { limit: q.limit, nextCursor: rows.length > q.limit ? `${items.at(-1).ordem}:${idString(items.at(-1).id_imagem)}` : null } };
        },
        async create(type, id, input, context) {
            await identity.transaction(c => lock(type, c, id, context), context);
            const files = storage[type], saved = await files.promote(input.stagingKey, id, context.signal, context.actor.id);
            try {
                return await identity.transaction(async c => {
                    await lock(type, c, id, context);
                    if (input.tipo === 'PRINCIPAL') await model.clearPrincipal(type, c, id);
                    const imageId = await model.insert(type, c, id, { ...input, url: saved.url });
                    await identity.audit(c, `GALLERY.${type.toUpperCase()}.CREATED`, id, context);
                    return dto(type, found(await model.image(type, c, id, imageId)));
                }, context);
            } finally { await settle(type, id, saved.key); }
        },
        async patch(type, id, imageId, input, context) {
            return identity.transaction(async c => {
                await lock(type, c, id, context); found(await model.image(type, c, id, imageId));
                if (input.tipo === 'PRINCIPAL') await model.clearPrincipal(type, c, id);
                await model.patch(type, c, id, imageId, input);
                await identity.audit(c, `GALLERY.${type.toUpperCase()}.CHANGED`, id, context);
                return dto(type, found(await model.image(type, c, id, imageId)));
            }, context);
        },
        async remove(type, id, imageId, context) {
            const row = await identity.transaction(async c => { await lock(type, c, id, context); return found(await model.image(type, c, id, imageId)); }, context);
            const files = storage[type], key = files.keyFromUrl(row.url);
            if (key) await files.mark(key, id);
            try {
                await identity.transaction(async c => {
                    await lock(type, c, id, context); found(await model.image(type, c, id, imageId));
                    await model.remove(type, c, id, imageId);
                    await identity.audit(c, `GALLERY.${type.toUpperCase()}.DELETED`, id, context);
                }, context);
            } finally { if (key) await settle(type, id, key); }
        },
        async content(type, key) { const files = storage[type]; found(await model.publicReference(type, files.url(key))); return files.read(key); },
        async reconcile(type, id, context) {
            await identity.transaction(c => lock(type, c, id, context), context);
            const keys = await storage[type].pending(id); let completed = 0;
            for (const key of keys) if (await settle(type, id, key)) completed++;
            return { examined: keys.length, completed, pending: keys.length - completed };
        }
    };
}
