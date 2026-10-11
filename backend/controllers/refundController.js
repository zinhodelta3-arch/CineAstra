import {success} from '../utils/dto.js';
const context=req=>({actor:req.usuario,signal:req.signal,requestId:req.res.locals.requestId});
const respond=(service,req,res,result,status=200,refund=result)=>{
    if(refund?.status==='RECEBIDA')res.once('finish',()=>setImmediate(()=>service.dispatch(refund.id,{actor:req.usuario,requestId:res.locals.requestId}).catch(()=>{})));
    return success(res,result,status);
};
export function createRefundController(service){return {
    request:async(req,res)=>respond(service,req,res,await service.request(req.params.id,req.input,req.paymentKey,context(req)),202),
    get:async(req,res)=>success(res,await service.get(req.params.id,context(req))),
    reconcile:async(req,res)=>success(res,await service.reconcile(req.params.id,context(req))),
    decide:async(req,res)=>respond(service,req,res,await service.decide(req.params.id,req.input,context(req))),
    cancelPlan:async(req,res)=>{const result=await service.cancelPlan(req.params.id,context(req));return respond(service,req,res,result,200,result.refund);}
};}
