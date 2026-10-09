import { success } from '../utils/dto.js';
const context = req => ({ actor: req.usuario, signal: req.signal, requestId: req.res.locals.requestId });
export function createVenueController(service) {
    return {
        list: (kind, admin) => async (req, res) => success(res, await service.list(kind, req.params, req.venueQuery, admin)),
        get: (kind, admin) => async (req, res) => success(res, await service.get(kind, req.params, admin)),
        save: kind => async (req, res) => {
            const created = !req.params[{ local: 'localId', room: 'roomId', seat: 'seatId' }[kind]];
            const data = await service.save(kind, req.params, req.input, context(req));
            if (created) res.location(`${req.path}/${data[{ local: 'id_local', room: 'id_sala', seat: 'id_assento' }[kind]]}`);
            success(res, data, created ? 201 : 200);
        },
        archive: kind => async (req, res) => { await service.archive(kind, req.params, context(req)); res.sendStatus(204); }
    };
}
