import { success } from '../utils/dto.js';
const context = req => ({ actor: req.usuario, signal: req.signal, requestId: req.res.locals.requestId });
export function createTeamController(service) {
    return {
        list: async (req, res) => success(res, await service.listTeams(req.teamQuery, context(req))),
        get: async (req, res) => success(res, await service.team(req.params.id, context(req))),
        create: async (req, res) => { const data = await service.create(req.input, context(req)); res.location(`/api/teams/${data.id_equipe}`); success(res, data, 201); },
        patch: async (req, res) => success(res, await service.patch(req.params.id, req.input, context(req))),
        archive: async (req, res) => { await service.archive(req.params.id, context(req)); res.sendStatus(204); },
        members: async (req, res) => success(res, await service.members(req.params.id, req.teamQuery, context(req))),
        changeMember: async (req, res) => success(res, await service.changeMember(req.params.id, req.params.memberId, req.input, context(req))),
        removeMember: async (req, res) => { await service.removeMember(req.params.id, req.params.memberId, context(req)); res.sendStatus(204); },
        entries: async (req, res) => success(res, await service.entries(req.params.id, req.teamQuery, context(req))),
        request: async (req, res) => { const data = await service.propose(req.params.id, req.input, 'SOLICITACAO', context(req)); success(res, data, 201); },
        invitation: async (req, res) => { const data = await service.propose(req.params.id, req.input, 'CONVITE', context(req)); success(res, data, 201); },
        decision: async (req, res) => success(res, await service.decide(req.params.id, req.params.entryId, req.input, context(req))),
        cancelEntry: async (req, res) => { await service.cancelEntry(req.params.id, req.params.entryId, context(req)); res.sendStatus(204); }
    };
}
