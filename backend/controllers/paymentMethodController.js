import { success } from '../utils/dto.js';
const context=req=>({actor:req.usuario,signal:req.signal,requestId:req.res.locals.requestId});
export function createPaymentMethodController(service){return {
    list:async(req,res)=>success(res,await service.list(context(req))),
    get:async(req,res)=>success(res,await service.get(req.params.id,context(req))),
    create:async(req,res)=>success(res,await service.create(req.input,context(req)),201),
    patch:async(req,res)=>success(res,await service.patch(req.params.id,req.input,context(req))),
    remove:async(req,res)=>{await service.remove(req.params.id,context(req));res.status(204).end();}
};}
