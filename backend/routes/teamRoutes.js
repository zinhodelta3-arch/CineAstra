import { Router } from 'express';
import { allowRoles } from '../middlewares/authMiddleware.js';
import { validateBody } from '../validators/identityValidators.js';
import { teamSchemas, teamParams, teamQuery } from '../validators/teamValidators.js';

export const teamOperations = [
    ['get','/api/teams','list_teams','list'],
    ['get','/api/teams/{id}','get_team','get'],
    ['post','/api/teams','create_team','create'],
    ['patch','/api/teams/{id}','update_team','patch'],
    ['delete','/api/teams/{id}','cancel_team','archive'],
    ['get','/api/teams/{id}/members','list_team_members','members'],
    ['patch','/api/teams/{id}/members/{memberId}','update_team_member','changeMember'],
    ['delete','/api/teams/{id}/members/{memberId}','remove_team_member','removeMember'],
    ['get','/api/teams/{id}/entries','list_team_entries','entries'],
    ['post','/api/teams/{id}/entries/requests','request_team_entry','request'],
    ['post','/api/teams/{id}/entries/invitations','invite_team_member','invitation'],
    ['post','/api/teams/{id}/entries/{entryId}/decision','decide_team_entry','decision'],
    ['delete','/api/teams/{id}/entries/{entryId}','cancel_team_entry','cancelEntry']
].map(([method,path,operationId,action]) => ({ method,path,operationId,action }));
export function teamRoutes(controller, { auth }) {
    const router = Router(), access = [auth, allowRoles('ADMIN','SUPERVISOR','COLABORADOR')];
    for (const r of teamOperations) {
        const middleware = [(req, res, next) => { res.set('Cache-Control', 'no-store'); next(); }, ...access, teamParams];
        if (['list','members','entries'].includes(r.action)) middleware.push(teamQuery(teamSchemas[r.action === 'list' ? 'teamsQuery' : r.action === 'members' ? 'membersQuery' : 'entriesQuery']));
        const body = { create: 'create', patch: 'patch', changeMember: 'memberPatch', request: 'request', invitation: 'invitation', decision: 'decision' }[r.action];
        if (body) middleware.push(validateBody(teamSchemas[body]));
        router[r.method](r.path.replace(/\{(\w+)\}/g, ':$1'), ...middleware, controller[r.action]);
    }
    return router;
}
