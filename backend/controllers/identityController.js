import { success } from '../utils/dto.js';

const context = req => ({ actor: req.usuario, signal: req.signal, requestId: req.res.locals.requestId });
export function createIdentityController(identity, profile) {
    const json = fn => async (req, res) => success(res, await fn(req, context(req)));
    const empty = fn => async (req, res) => { await fn(req, context(req)); res.sendStatus(204); };
    return {
        register: async (req, res) => { const u = await identity.register(req.input, context(req)); res.location('/api/users/me'); success(res, u, 201); },
        login: json((r, c) => identity.login(r.input, c)),
        enroll: json((r, c) => identity.enroll(r.input, c)),
        verify: json((r, c) => identity.verify(r.input, c)),
        logout: empty((r, c) => identity.logout(c)),
        forgot: json((r, c) => identity.forgot(r.input, c)),
        reset: empty((r, c) => identity.reset(r.input, c)),
        disableFactor: empty((r, c) => identity.disableFactor(r.input, c)),
        me: json((r, c) => profile.me(c)),
        renewAge: json((r, c) => identity.renewAge(r.input, c)),
        patch: json((r, c) => profile.patch(r.input, c)),
        export: json((r, c) => profile.export(r.input, r.query, c)),
        deleteAccount: async (req, res) => { const data = await profile.deleteAccount(req.input, context(req)); res.location(`/api/admin/privacy-requests/${data.id}`); success(res, data, 202); },
        preferences: json((r, c) => profile.preferences(r.method === 'GET' ? null : r.input, c)),
        adminCreate: async (req, res) => { const data = await profile.adminCreate(req.input, context(req)); res.location(`/api/admin/users/${data.id}`); success(res, data, 201); },
        adminAccess: json((r, c) => profile.adminAccess(r.params.id, r.input, c)),
        adminGet: json((r, c) => profile.adminGet(r.params.id, c)),
        authorization: json((r, c) => profile.authorization(r.params.id, r.params.authorizationId, c)),
        privacyStatus: json((r, c) => profile.privacyStatus(r.params.id, c)),
        parental: json((r, c) => profile.parental(r.params.id, r.method === 'GET' ? null : r.input, false, c)),
        authorizeMinor: async (req, res) => { const data = await profile.parental(req.params.id, req.input, true, context(req)); res.location(`/api/users/me/children/${req.params.id}/authorizations/${data.id}`); success(res, data, 201); },
        list: kind => json((r, c) => profile.list(kind, r.query, c)),
        resource: kind => json((r, c) => profile.resource(kind, r.params.id, c)),
        add: kind => async (req, res) => { const data = await profile.mutate(kind, null, req.input, false, context(req)); const id = data[kind === 'addresses' ? 'id_endereco' : 'id_contato']; res.location(`/api/users/me/${kind}/${id}`); success(res, data, 201); },
        update: kind => json((r, c) => profile.mutate(kind, r.params.id, r.input, false, c)),
        remove: kind => empty((r, c) => profile.mutate(kind, r.params.id, null, true, c))
    };
}
