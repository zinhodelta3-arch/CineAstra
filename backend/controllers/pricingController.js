import { success } from '../utils/dto.js';
const context=req=>({actor:req.usuario,signal:req.signal,requestId:req.res.locals.requestId});
export function createPricingController(service){return {
    quote:async(req,res)=>success(res,await service.quote(req.input,context(req))),
    adminQuote:async(req,res)=>success(res,await service.adminQuote(req.input,context(req))),
    parameters:async(req,res)=>success(res,await service.parameters(context(req))),
    setParameter:async(req,res)=>success(res,await service.setParameter(req.params.category,req.input,context(req))),
    costs:async(req,res)=>success(res,await service.costs(req.params.kind,req.params.id,context(req))),
    setCosts:async(req,res)=>success(res,await service.setCosts(req.params.kind,req.params.id,req.input,context(req))),
    publish:async(req,res)=>success(res,await service.publish(req.params.category,req.params.id,context(req))),
    promotions:async(req,res)=>success(res,await service.promotions(context(req))),
    createPromotion:async(req,res)=>success(res,await service.createPromotion(req.input,context(req)),201),
    patchPromotion:async(req,res)=>success(res,await service.patchPromotion(req.params.id,req.input,context(req))),
    archivePromotion:async(req,res)=>{await service.archivePromotion(req.params.id,context(req));res.status(204).end();},
    planBenefits:async(req,res)=>success(res,await service.planBenefits(req.params.planId,context(req))),
    setPlanBenefit:async(req,res)=>success(res,await service.setPlanBenefit(req.params.planId,req.params.category,req.input.discountBps,context(req))),
    coupons:async(req,res)=>success(res,await service.coupons(context(req))),
    createCoupon:async(req,res)=>success(res,await service.createCoupon(req.input,context(req)),201),
    patchCoupon:async(req,res)=>success(res,await service.patchCoupon(req.params.id,req.input,context(req))),
    archiveCoupon:async(req,res)=>{await service.archiveCoupon(req.params.id,context(req));res.status(204).end();}
};}
