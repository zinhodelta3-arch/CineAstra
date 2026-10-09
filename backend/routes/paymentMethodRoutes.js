import { Router } from 'express';
import { allowRoles } from '../middlewares/authMiddleware.js';
import { validateBody } from '../validators/identityValidators.js';
import { paymentMethodId,paymentMethodSchemas } from '../validators/paymentMethodValidators.js';

export const paymentMethodOperations=[
    {method:'get',path:'/api/users/me/payment-methods',operationId:'list_payment_methods',action:'list'},
    {method:'post',path:'/api/users/me/payment-methods',operationId:'create_payment_method',action:'create'},
    {method:'get',path:'/api/users/me/payment-methods/{id}',operationId:'get_payment_method',action:'get'},
    {method:'patch',path:'/api/users/me/payment-methods/{id}',operationId:'set_primary_payment_method',action:'patch'},
    {method:'delete',path:'/api/users/me/payment-methods/{id}',operationId:'archive_payment_method',action:'remove'}
];
export function paymentMethodRoutes(controller,{auth,limits}){
    const router=Router();
    for(const r of paymentMethodOperations){
        const middleware=[(req,res,next)=>{res.set('Cache-Control','no-store');next();},auth,allowRoles('CLIENTE')];
        if(r.path.includes('{id}'))middleware.push(paymentMethodId);
        if(r.action==='create')middleware.push(...limits.checkout,validateBody(paymentMethodSchemas.create));
        if(r.action==='patch')middleware.push(validateBody(paymentMethodSchemas.patch));
        router[r.method](r.path.replace('{id}',':id'),...middleware,controller[r.action]);
    }
    return router;
}
