import { Router } from 'express';
import { allowRoles } from '../middlewares/authMiddleware.js';
import { validateBody } from '../validators/identityValidators.js';
import { taskParams, taskQuery, taskSchemas } from '../validators/taskValidators.js';

export const taskOperations = [
    ['get','/api/teams/{id}/chamados','list_team_tasks','list'],
    ['post','/api/teams/{id}/chamados','create_team_task','create'],
    ['get','/api/teams/{id}/chamados/{taskId}','get_team_task','get'],
    ['patch','/api/teams/{id}/chamados/{taskId}','edit_team_task','edit'],
    ['delete','/api/teams/{id}/chamados/{taskId}','cancel_team_task','cancel'],
    ['post','/api/teams/{id}/chamados/{taskId}/assign','assign_team_task','assign'],
    ['post','/api/teams/{id}/chamados/{taskId}/accept','accept_team_task','accept'],
    ['post','/api/teams/{id}/chamados/{taskId}/resolve','resolve_team_task','resolve'],
    ['post','/api/teams/{id}/chamados/{taskId}/close','close_team_task','close'],
    ['get','/api/teams/{id}/chamados/{taskId}/history','team_task_history','history']
].map(([method,path,operationId,action]) => ({ method,path,operationId,action }));
export function taskRoutes(controller, { auth }) {
    const router = Router();
    for (const r of taskOperations) {
        const middleware = [(req, res, next) => { res.set('Cache-Control', 'no-store'); next(); }, auth, allowRoles('ADMIN','SUPERVISOR','COLABORADOR'), taskParams];
        if (['list','history'].includes(r.action)) middleware.push(taskQuery(taskSchemas[r.action]));
        if (['create','edit','assign'].includes(r.action)) middleware.push(validateBody(taskSchemas[r.action]));
        router[r.method](r.path.replace(/\{(\w+)\}/g, ':$1'), ...middleware, controller[r.action]);
    }
    return router;
}
