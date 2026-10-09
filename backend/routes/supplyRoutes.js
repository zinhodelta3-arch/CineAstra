import { Router } from 'express';
import { allowRoles } from '../middlewares/authMiddleware.js';
import { validateBody } from '../validators/identityValidators.js';
import { supplyParams,supplyQuery,supplySchemas } from '../validators/supplyValidators.js';

export const supplyOperations=[
    ['get','/api/stock','get_local_stock','stock'],
    ['get','/api/stock/requests','list_stock_requests','requests'],
    ['post','/api/stock/requests','create_stock_request','createRequest'],
    ['get','/api/stock/requests/{id}','get_stock_request','request'],
    ['post','/api/stock/requests/{id}/approve','approve_stock_request','approve'],
    ['post','/api/stock/requests/{id}/refuse','refuse_stock_request','refuse'],
    ['get','/api/logistics','list_logistics','shipments'],
    ['get','/api/logistics/{id}','get_logistics','shipment'],
    ['post','/api/logistics/{id}/send','send_logistics','send'],
    ['post','/api/logistics/{id}/transit','transit_logistics','transit'],
    ['post','/api/logistics/{id}/receive','receive_logistics','receive'],
    ['post','/api/logistics/{id}/return','return_logistics_equipment','returnEquipment'],
    ['post','/api/logistics/{id}/cancel','cancel_logistics','cancel']
].map(([method,path,operationId,action])=>({method,path,operationId,action}));
export function supplyRoutes(controller,{auth}){
    const router=Router();
    for(const r of supplyOperations){
        const middle=[(req,res,next)=>{res.set('Cache-Control','no-store');next();},auth,allowRoles('ADMIN','FORNECEDOR','SUPERVISOR','COLABORADOR')];
        if(r.path.includes('{id}'))middle.push(supplyParams);
        if(r.action==='requests'||r.action==='shipments'||r.action==='stock')middle.push(supplyQuery(r.action==='requests'?supplySchemas.requestsQuery:r.action==='stock'?supplySchemas.stockQuery:supplySchemas.shipmentsQuery));
        if(r.action==='createRequest')middle.push(validateBody(supplySchemas.request));
        router[r.method](r.path.replace('{id}',':id'),...middle,controller[r.action]);
    }
    return router;
}
