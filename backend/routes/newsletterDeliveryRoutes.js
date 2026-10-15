import {Router} from 'express';
import {ApiError} from '../utils/ApiError.js';

export const newsletterDeliveryOperations=[{method:'post',path:'/api/newsletter/webhooks/{provider}',operationId:'newsletter_delivery_bounce'}];
export function newsletterDeliveryWebhookRoutes(controller){
    const router=Router();
    router.post('/:provider',(req,res,next)=>{
        res.set('Cache-Control','no-store');
        if(!/^[a-z0-9_-]{2,40}$/.test(req.params.provider))throw ApiError.validacao('Provider inválido');
        next();
    },controller.bounce);
    return router;
}
