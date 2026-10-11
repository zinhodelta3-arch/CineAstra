import {Router} from 'express';
import {allowRoles} from '../middlewares/authMiddleware.js';
import {validateBody} from '../validators/identityValidators.js';
import {paymentKey} from '../validators/paymentValidators.js';
import {planCreate,planPatch,subscriptionCreate,planIdParam,planPage} from '../validators/planValidators.js';

export const planOperations=[
    {method:'get',path:'/api/plans',operationId:'list_public_plans'},
    {method:'get',path:'/api/plans/{planId}',operationId:'get_public_plan'},
    {method:'get',path:'/api/admin/plans',operationId:'list_admin_plans'},
    {method:'get',path:'/api/admin/plans/{planId}',operationId:'get_admin_plan'},
    {method:'post',path:'/api/admin/plans',operationId:'create_plan'},
    {method:'patch',path:'/api/admin/plans/{planId}',operationId:'update_plan'},
    {method:'delete',path:'/api/admin/plans/{planId}',operationId:'archive_plan'},
    {method:'get',path:'/api/subscriptions/me',operationId:'list_my_subscriptions'},
    {method:'get',path:'/api/subscriptions/{subscriptionId}',operationId:'get_my_subscription'},
    {method:'post',path:'/api/subscriptions/summary',operationId:'subscription_contract_summary'},
    {method:'post',path:'/api/subscriptions',operationId:'create_subscription_contract'},
    {method:'post',path:'/api/subscriptions/{subscriptionId}/benefits/combo/redeem',operationId:'request_monthly_combo'}
];
const noStore=(req,res,next)=>{res.set('Cache-Control','no-store');next();};
export function planRoutes(controller,{auth,limits}){
    const router=Router(),admin=[noStore,auth,allowRoles('ADMIN')],client=[noStore,auth,allowRoles('CLIENTE')];
    router.get('/api/plans',noStore,planPage,controller.publicList);
    router.get('/api/plans/:planId',noStore,planIdParam,controller.publicGet);
    router.get('/api/admin/plans',...admin,planPage,controller.adminList);
    router.get('/api/admin/plans/:planId',...admin,planIdParam,controller.adminGet);
    router.post('/api/admin/plans',...admin,...limits.checkout,validateBody(planCreate),controller.create);
    router.patch('/api/admin/plans/:planId',...admin,...limits.checkout,planIdParam,validateBody(planPatch),controller.patch);
    router.delete('/api/admin/plans/:planId',...admin,...limits.checkout,planIdParam,controller.archive);
    router.get('/api/subscriptions/me',...client,planPage,controller.mine);
    router.get('/api/subscriptions/:subscriptionId',...client,planIdParam,controller.own);
    router.post('/api/subscriptions/summary',...client,validateBody(subscriptionCreate),controller.summary);
    router.post('/api/subscriptions',...client,...limits.checkout,paymentKey,validateBody(subscriptionCreate),controller.subscribe);
    router.post('/api/subscriptions/:subscriptionId/benefits/combo/redeem',...client,...limits.checkout,planIdParam,controller.redeem);
    return router;
}
