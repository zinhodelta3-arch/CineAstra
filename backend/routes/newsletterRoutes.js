import {Router} from 'express';
import {newsletterSubscribe,newsletterConfirm,newsletterAuthorization,newsletterToken,newsletterPreferenceChange,newsletterResubscribe} from '../validators/newsletterValidators.js';
export const newsletterOperations=[
    {method:'get',path:'/api/newsletter/options',operationId:'newsletter_options'},
    {method:'post',path:'/api/newsletter/subscribe',operationId:'newsletter_subscribe'},
    {method:'post',path:'/api/newsletter/confirm',operationId:'newsletter_confirm'},
    {method:'post',path:'/api/newsletter/authorization',operationId:'newsletter_authorization'},
    {method:'post',path:'/api/newsletter/preferences/view',operationId:'newsletter_preferences_view'},
    {method:'patch',path:'/api/newsletter/preferences',operationId:'newsletter_preferences_change'},
    {method:'post',path:'/api/newsletter/unsubscribe',operationId:'newsletter_unsubscribe'},
    {method:'post',path:'/api/newsletter/resubscribe',operationId:'newsletter_resubscribe'}
];
export function newsletterRoutes(controller,{limits}){const router=Router();
    router.use((req,res,next)=>{res.set('Cache-Control','no-store');next();});
    router.get('/api/newsletter/options',controller.options);
    router.post('/api/newsletter/subscribe',...limits.newsletter,newsletterSubscribe,controller.subscribe);
    router.post('/api/newsletter/confirm',...limits.newsletter,newsletterConfirm,controller.confirm);
    router.post('/api/newsletter/authorization',...limits.newsletter,newsletterAuthorization,controller.authorization);
    router.post('/api/newsletter/preferences/view',...limits.newsletter,newsletterToken,controller.preferences);
    router.patch('/api/newsletter/preferences',...limits.newsletter,newsletterPreferenceChange,controller.changePreferences);
    router.post('/api/newsletter/unsubscribe',...limits.newsletter,newsletterToken,controller.unsubscribe);
    router.post('/api/newsletter/resubscribe',...limits.newsletter,newsletterResubscribe,controller.resubscribe);
    return router;
}
