import {Router} from 'express';
import {allowRoles} from '../middlewares/authMiddleware.js';
import {body,publication,assistantMessage,assistantHandoff,contentSlug} from '../validators/contentValidators.js';
import {ApiError} from '../utils/ApiError.js';
export const contentOperations=[
    {method:'get',path:'/api/content/{slug}',operationId:'get_published_content'},
    {method:'post',path:'/api/admin/content',operationId:'publish_content'},
    {method:'get',path:'/api/orders/{orderId}/receipt',operationId:'get_order_receipt'},
    {method:'post',path:'/api/assistant/messages',operationId:'ask_assistant'},
    {method:'post',path:'/api/assistant/handoff',operationId:'handoff_assistant'}
];
export function contentRoutes(controller,{auth,limits}){
    const r=Router(),noStore=(req,res,next)=>{res.set('Cache-Control','no-store');next();};
    r.get('/api/content/:slug',noStore,contentSlug,controller.get);
    r.post('/api/admin/content',noStore,auth,allowRoles('ADMIN'),...limits.checkout,body(publication,'contentInput'),controller.publish);
    r.get('/api/orders/:orderId/receipt',noStore,auth,allowRoles('CLIENTE'),(req,res,next)=>{if(!/^[1-9]\d{0,19}$/.test(req.params.orderId)||BigInt(req.params.orderId)>18446744073709551615n)throw ApiError.validacao('ID inválido');next();},controller.receipt);
    r.post('/api/assistant/messages',noStore,auth,allowRoles('CLIENTE'),...limits.assistant,body(assistantMessage,'assistantInput'),controller.assistantMessage);
    r.post('/api/assistant/handoff',noStore,auth,allowRoles('CLIENTE'),...limits.assistant,body(assistantHandoff,'assistantInput'),controller.assistantHandoff);
    return r;
}
