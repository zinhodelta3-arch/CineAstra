import { Router } from 'express';
import { allowRoles } from '../middlewares/authMiddleware.js';
import { validateBody } from '../validators/identityValidators.js';
import { pricingParams,pricingCostBody,pricingSchemas } from '../validators/pricingValidators.js';
import { ApiError } from '../utils/ApiError.js';

export const pricingOperations=[
    ['post','/api/pricing/quote','quote_price','quote',false],
    ['post','/api/admin/pricing/quote','admin_quote_price','adminQuote',true],
    ['get','/api/admin/pricing/parameters','list_pricing_parameters','parameters',true],
    ['put','/api/admin/pricing/parameters/{category}','set_pricing_parameters','setParameter',true],
    ['get','/api/admin/pricing/costs/{kind}/{id}','get_pricing_costs','costs',true],
    ['put','/api/admin/pricing/costs/{kind}/{id}','set_pricing_costs','setCosts',true],
    ['post','/api/admin/pricing/publish/{category}/{id}','publish_pricing_price','publish',true],
    ['get','/api/admin/pricing/promotions','list_pricing_promotions','promotions',true],
    ['post','/api/admin/pricing/promotions','create_pricing_promotion','createPromotion',true],
    ['patch','/api/admin/pricing/promotions/{id}','patch_pricing_promotion','patchPromotion',true],
    ['delete','/api/admin/pricing/promotions/{id}','archive_pricing_promotion','archivePromotion',true],
    ['get','/api/admin/pricing/plans/{planId}/benefits','list_plan_benefits','planBenefits',true],
    ['put','/api/admin/pricing/plans/{planId}/benefits/{category}','set_plan_benefit','setPlanBenefit',true],
    ['get','/api/admin/pricing/coupons','list_pricing_coupons','coupons',true],
    ['post','/api/admin/pricing/coupons','create_pricing_coupon','createCoupon',true],
    ['patch','/api/admin/pricing/coupons/{id}','patch_pricing_coupon','patchCoupon',true],
    ['delete','/api/admin/pricing/coupons/{id}','archive_pricing_coupon','archiveCoupon',true]
].map(([method,path,operationId,action,admin])=>({method,path,operationId,action,admin}));
export function pricingRoutes(controller,{auth}){
    const router=Router();
    for(const r of pricingOperations){
        const middleware=[(req,res,next)=>{res.set('Cache-Control','no-store');next();},auth];
        if(r.admin)middleware.push(allowRoles('ADMIN'));
        if(r.path.includes('{'))middleware.push(pricingParams);
        if(r.action==='setPlanBenefit')middleware.push((req,res,next)=>{if(req.params.category==='PLAN')throw ApiError.validacao('Categoria inválida');next();});
        if(r.action==='setCosts')middleware.push(pricingCostBody);
        else if(['quote','adminQuote','setParameter','createPromotion','patchPromotion','setPlanBenefit','createCoupon','patchCoupon'].includes(r.action)){
            const schemaName={quote:'quote',adminQuote:'quote',setParameter:'parameter',createPromotion:'promotion',patchPromotion:'promotionPatch',setPlanBenefit:'benefit',createCoupon:'coupon',patchCoupon:'couponPatch'}[r.action];
            middleware.push(validateBody(pricingSchemas[schemaName]));
        }
        router[r.method](r.path.replace(/\{(\w+)\}/g,':$1'),...middleware,controller[r.action]);
    }
    return router;
}
