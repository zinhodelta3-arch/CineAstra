import { success } from '../utils/dto.js';
const context = req => ({ actor: req.usuario, signal: req.signal, requestId: req.res.locals.requestId });
export function createCommerceGalleryController(service) {
    return {
        list: (type, admin) => async (req, res) => success(res, await service.list(type, req.params.id, req.galleryQuery, admin)),
        create: type => async (req, res) => { const image = await service.create(type, req.params.id, req.input, context(req)); res.location(`/api/${type === 'inputs' ? 'inputs' : 'admin/combos'}/${req.params.id}/images/${image.id_imagem}`); success(res, image, 201); },
        patch: type => async (req, res) => success(res, await service.patch(type, req.params.id, req.params.imageId, req.input, context(req))),
        remove: type => async (req, res) => { await service.remove(type, req.params.id, req.params.imageId, context(req)); res.sendStatus(204); },
        content: type => async (req, res) => { const bytes = await service.content(type, req.params.key); res.set({ 'Content-Type': 'image/webp', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'none'; sandbox" }); res.send(bytes); },
        reconcile: type => async (req, res) => success(res, await service.reconcile(type, req.params.id, context(req)))
    };
}
