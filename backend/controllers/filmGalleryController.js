import { success } from '../utils/dto.js';
const context = req => ({ actor: req.usuario, signal: req.signal, requestId: req.res.locals.requestId });
export function createFilmGalleryController(service) {
    return {
        list: admin => async (req, res) => success(res, await service.list(req.params.id, req.galleryQuery, admin)),
        async create(req, res) {
            const image = await service.create(req.params.id, req.input, context(req));
            res.location(`/api/admin/films/${req.params.id}/images/${image.id_imagem}`);
            success(res, image, 201);
        },
        async patch(req, res) { success(res, await service.patch(req.params.id, req.params.imageId, req.input, context(req))); },
        async remove(req, res) { await service.remove(req.params.id, req.params.imageId, context(req)); res.sendStatus(204); },
        async content(req, res) {
            const bytes = await service.content(req.params.key);
            res.set({ 'Content-Type': 'image/webp', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'none'; sandbox" });
            res.send(bytes);
        },
        async reconcile(req, res) { success(res, await service.reconcile(req.params.id, context(req))); }
    };
}
