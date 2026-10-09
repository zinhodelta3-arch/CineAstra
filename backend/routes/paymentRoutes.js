import { Router } from 'express';
import { allowRoles } from '../middlewares/authMiddleware.js';
import { validateBody } from '../validators/identityValidators.js';
import { paymentBody,paymentId,paymentKey,webhookName } from '../validators/paymentValidators.js';

export const paymentOperations=[
    {method:'post',path:'/api/payments',operationId:'create_payment_intention'},
    {method:'get',path:'/api/payments/{id}',operationId:'get_payment'},
    {method:'post',path:'/api/payments/{id}/reconcile',operationId:'reconcile_payment'},
    {method:'post',path:'/api/payments/webhooks/{provider}',operationId:'payment_webhook'}
];
const noStore=(req,res,next)=>{res.set('Cache-Control','no-store');next();};
export function paymentRoutes(controller,{auth,limits}){
    const router=Router(),secured=[noStore,auth,allowRoles('CLIENTE')];
    router.post('/api/payments',...secured,...limits.checkout,paymentKey,validateBody(paymentBody),controller.create);
    router.get('/api/payments/:id',...secured,paymentId,controller.get);
    router.post('/api/payments/:id/reconcile',...secured,...limits.checkout,paymentId,controller.reconcile);
    return router;
}
export function paymentWebhookRoutes(controller){
    const router=Router();
    router.post('/:provider',noStore,webhookName,controller.webhook);
    return router;
}
