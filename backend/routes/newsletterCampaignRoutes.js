import {Router} from 'express';
import {allowRoles} from '../middlewares/authMiddleware.js';
import {categoryCreate,categoryUpdate,campaignCreate,campaignUpdate,campaignSchedule,newsletterCampaignId,newsletterCampaignPage} from '../validators/newsletterCampaignValidators.js';
export const newsletterCampaignOperations=[
    {method:'get',path:'/api/admin/newsletter/categories',operationId:'admin_list_newsletter_categories'},
    {method:'post',path:'/api/admin/newsletter/categories',operationId:'admin_create_newsletter_category'},
    {method:'patch',path:'/api/admin/newsletter/categories/{categoryId}',operationId:'admin_update_newsletter_category'},
    {method:'delete',path:'/api/admin/newsletter/categories/{categoryId}',operationId:'admin_archive_newsletter_category'},
    {method:'get',path:'/api/admin/newsletter/campaigns',operationId:'admin_list_newsletter_campaigns'},
    {method:'get',path:'/api/admin/newsletter/campaigns/{campaignId}',operationId:'admin_get_newsletter_campaign'},
    {method:'post',path:'/api/admin/newsletter/campaigns',operationId:'admin_create_newsletter_campaign'},
    {method:'patch',path:'/api/admin/newsletter/campaigns/{campaignId}',operationId:'admin_update_newsletter_campaign'},
    {method:'post',path:'/api/admin/newsletter/campaigns/{campaignId}/schedule',operationId:'admin_schedule_newsletter_campaign'},
    {method:'post',path:'/api/admin/newsletter/campaigns/{campaignId}/cancel',operationId:'admin_cancel_newsletter_campaign'}
];
export function newsletterCampaignRoutes(controller,{auth,limits}){const router=Router(),admin=[auth,allowRoles('ADMIN')],write=[...admin,...limits.newsletter];
    router.use((req,res,next)=>{res.set('Cache-Control','no-store');next();});
    router.get('/api/admin/newsletter/categories',...admin,controller.categories);
    router.post('/api/admin/newsletter/categories',...write,categoryCreate,controller.createCategory);
    router.patch('/api/admin/newsletter/categories/:categoryId',...write,newsletterCampaignId,categoryUpdate,controller.patchCategory);
    router.delete('/api/admin/newsletter/categories/:categoryId',...write,newsletterCampaignId,controller.archiveCategory);
    router.get('/api/admin/newsletter/campaigns',...admin,newsletterCampaignPage,controller.campaigns);
    router.get('/api/admin/newsletter/campaigns/:campaignId',...admin,newsletterCampaignId,controller.campaign);
    router.post('/api/admin/newsletter/campaigns',...write,campaignCreate,controller.createCampaign);
    router.patch('/api/admin/newsletter/campaigns/:campaignId',...write,newsletterCampaignId,campaignUpdate,controller.patchCampaign);
    router.post('/api/admin/newsletter/campaigns/:campaignId/schedule',...write,newsletterCampaignId,campaignSchedule,controller.schedule);
    router.post('/api/admin/newsletter/campaigns/:campaignId/cancel',...write,newsletterCampaignId,controller.cancel);
    return router;
}
