import { success } from '../utils/dto.js';
const context=req=>({actor:req.usuario,signal:req.signal,requestId:req.res.locals.requestId});
export function createPaymentController(service){return {
    create:async(req,res)=>success(res,await service.create(req.input,req.paymentKey,context(req)),202),
    get:async(req,res)=>success(res,await service.get(req.params.id,context(req))),
    reconcile:async(req,res)=>success(res,await service.reconcile(req.params.id,context(req))),
    webhook:async(req,res)=>{await service.webhook(req.params.provider,req.body,req.headers,context(req));res.status(204).end();}
};}
