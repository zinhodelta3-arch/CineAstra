import {success} from '../utils/dto.js';
const context=req=>({actor:req.usuario,signal:req.signal,requestId:req.res.locals.requestId});
export function createNewsletterCampaignController(service){return {
    categories:async(req,res)=>success(res,await service.listCategories(context(req))),
    createCategory:async(req,res)=>success(res,await service.createCategory(req.campaignInput,context(req)),201),
    patchCategory:async(req,res)=>success(res,await service.patchCategory(req.params.categoryId,req.campaignInput,context(req))),
    archiveCategory:async(req,res)=>success(res,await service.archiveCategory(req.params.categoryId,context(req))),
    campaigns:async(req,res)=>success(res,await service.listCampaigns(req.campaignPage,context(req))),
    campaign:async(req,res)=>success(res,await service.getCampaign(req.params.campaignId,context(req))),
    createCampaign:async(req,res)=>success(res,await service.createCampaign(req.campaignInput,context(req)),201),
    patchCampaign:async(req,res)=>success(res,await service.patchCampaign(req.params.campaignId,req.campaignInput,context(req))),
    schedule:async(req,res)=>success(res,await service.schedule(req.params.campaignId,req.campaignInput.at.replace('T',' ').replace('Z',''),context(req))),
    cancel:async(req,res)=>success(res,await service.cancel(req.params.campaignId,context(req)))
};}
