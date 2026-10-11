import { Router } from 'express';
import { allowRoles } from '../middlewares/authMiddleware.js';
import { validateBody } from '../validators/identityValidators.js';
import { orderBody,orderCancelBody } from '../validators/orderValidators.js';
import { paymentKey } from '../validators/paymentValidators.js';
import { ticketIdParam } from '../validators/ticketValidators.js';
export const orderOperations=[
    {method:'get',path:'/api/orders/{orderId}',operationId:'get_order_status',action:'status'},
    {method:'post',path:'/api/orders/quote',operationId:'quote_order',action:'quote'},
    {method:'post',path:'/api/orders/checkout',operationId:'checkout_order',action:'checkout'},
    {method:'post',path:'/api/orders/{orderId}/cancel',operationId:'cancel_order',action:'cancel'}
];
export function orderRoutes(controller,{auth,limits}){const router=Router();for(const r of orderOperations){
    const middleware=[(req,res,next)=>{res.set('Cache-Control','no-store');next();},auth,allowRoles('CLIENTE')];
    if(r.action==='checkout'||r.action==='cancel')middleware.push(...limits.checkout,paymentKey);
    if(r.action==='status'||r.action==='cancel')middleware.push(ticketIdParam);
    if(r.action==='cancel')middleware.push(validateBody(orderCancelBody));
    else if(r.action!=='status')middleware.push(validateBody(orderBody));
    router[r.method](r.path.replace(/\{(\w+)\}/g,':$1'),...middleware,controller[r.action]);
}return router;}
