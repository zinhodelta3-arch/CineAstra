import {success} from '../utils/dto.js';
const context=req=>({actor:req.usuario,signal:req.signal,requestId:req.res.locals.requestId});
export function createPlanController(service){return {
    publicList:async(req,res)=>success(res,await service.plans(req.planPage,context(req))),
    publicGet:async(req,res)=>success(res,await service.get(req.params.planId,context(req))),
    adminList:async(req,res)=>success(res,await service.plans(req.planPage,context(req),true)),
    adminGet:async(req,res)=>success(res,await service.get(req.params.planId,context(req),true)),
    create:async(req,res)=>success(res,await service.create(req.input,context(req)),201),
    patch:async(req,res)=>success(res,await service.patch(req.params.planId,req.input,context(req))),
    archive:async(req,res)=>{await service.archive(req.params.planId,context(req));res.status(204).end();},
    mine:async(req,res)=>success(res,await service.mySubscriptions(req.planPage,context(req))),
    own:async(req,res)=>success(res,await service.ownSubscription(req.params.subscriptionId,context(req))),
    summary:async(req,res)=>success(res,await service.summary(req.input,context(req))),
    subscribe:async(req,res)=>success(res,await service.subscribe(req.input,req.paymentKey,context(req)),201),
    redeem:async(req,res)=>success(res,await service.redeem(req.params.subscriptionId,context(req)),201)
};}
