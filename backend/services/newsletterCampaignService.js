import sanitizeHtml from 'sanitize-html';
import {ApiError} from '../utils/ApiError.js';
import {idString} from '../utils/dto.js';

const conflict=message=>new ApiError(message,409,null,'NEWSLETTER_CONFLICT');
const categoryDto=x=>({id:idString(x.id_categoria),code:x.codigo,name:x.nome,description:x.descricao??null,active:Boolean(x.ativo)});
const campaignDto=x=>({id:idString(x.id_campanha),categoryId:idString(x.id_categoria),name:x.nome,subject:x.assunto,html:x.conteudo_html,text:x.conteudo_texto,status:x.status,scheduledAt:x.agendada_para??null,startedAt:x.iniciada_em??null,completedAt:x.concluida_em??null});
const cleanHtml=value=>{
    const clean=sanitizeHtml(value,{allowedTags:['p','br','strong','em','ul','ol','li','a','h1','h2','h3'],allowedAttributes:{a:['href']},allowedSchemes:['https','mailto'],allowedSchemesAppliedToAttributes:['href'],disallowedTagsMode:'discard'}).trim();
    if(!sanitizeHtml(clean,{allowedTags:[],allowedAttributes:{}}).trim())throw ApiError.validacao('Conteúdo HTML vazio');
    return clean;
};
export function createNewsletterCampaignService({model,identity}){
    async function admin(c,context){const actor=await identity.activeActor(c,context);if(actor.tipo_usuario!=='ADMIN')throw ApiError.acessoNegado();return actor;}
    const tx=(context,fn)=>identity.transaction(fn,context);
    const content=input=>({...input,html:cleanHtml(input.html),text:input.text.trim()});
    async function activeCategory(c,id){const row=await model.category(c,id,true);if(!row||!row.ativo)throw conflict('Categoria indisponível');return row;}
    return {
        listCategories:context=>tx(context,async c=>{await admin(c,context);return {items:(await model.categories(c)).map(categoryDto)};}),
        async createCategory(input,context){try{return await tx(context,async c=>{await admin(c,context);const id=await model.createCategory(c,input);await identity.audit(c,'NEWSLETTER.CATEGORY_CREATED',id,context);return categoryDto(await model.category(c,id));});}catch(error){if(error.code==='ER_DUP_ENTRY')throw conflict('Código de categoria já existe');throw error;}},
        patchCategory:(id,input,context)=>tx(context,async c=>{await admin(c,context);await activeCategory(c,id);await model.patchCategory(c,id,input);await identity.audit(c,'NEWSLETTER.CATEGORY_UPDATED',id,context);return categoryDto(await model.category(c,id));}),
        archiveCategory:(id,context)=>tx(context,async c=>{await admin(c,context);await activeCategory(c,id);await model.archiveCategory(c,id);await model.cancelCategoryCampaigns(c,id);await model.cancelCategoryQueue(c,id);await identity.audit(c,'NEWSLETTER.CATEGORY_ARCHIVED',id,context);return {archived:true};}),
        listCampaigns:({limit=50,cursor='0'},context)=>tx(context,async c=>{await admin(c,context);const rows=await model.campaigns(c,limit,cursor),page=rows.slice(0,limit);return {items:page.map(campaignDto),pagination:{limit,nextCursor:rows.length>limit?idString(page.at(-1).id_campanha):null}};}),
        getCampaign:(id,context)=>tx(context,async c=>{await admin(c,context);const row=await model.campaign(c,id);if(!row)throw ApiError.naoEncontrado();return campaignDto(row);}),
        createCampaign:(input,context)=>tx(context,async c=>{await admin(c,context);await activeCategory(c,input.categoryId);const id=await model.createCampaign(c,content(input));await identity.audit(c,'NEWSLETTER.CAMPAIGN_CREATED',id,context);return campaignDto(await model.campaign(c,id));}),
        patchCampaign:(id,input,context)=>tx(context,async c=>{await admin(c,context);await activeCategory(c,input.categoryId);const row=await model.campaign(c,id,true);if(!row)throw ApiError.naoEncontrado();if(row.status!=='RASCUNHO')throw conflict('Somente rascunho pode ser editado');await model.patchCampaign(c,id,content(input));await identity.audit(c,'NEWSLETTER.CAMPAIGN_UPDATED',id,context);return campaignDto(await model.campaign(c,id));}),
        schedule:(id,at,context)=>tx(context,async c=>{await admin(c,context);const draft=await model.campaign(c,id);if(!draft)throw ApiError.naoEncontrado();await activeCategory(c,draft.id_categoria);const row=await model.campaign(c,id,true);if(row.status!=='RASCUNHO'||idString(row.id_categoria)!==idString(draft.id_categoria))throw conflict('Campanha alterada');if(!Number.isFinite(Date.parse(at.replace(' ','T')+'Z'))||Date.parse(at.replace(' ','T')+'Z')<=Date.now())throw ApiError.validacao('Agendamento deve ser futuro');await model.schedule(c,id,at);await model.queue(c,id);await identity.audit(c,'NEWSLETTER.CAMPAIGN_SCHEDULED',id,context);return campaignDto(await model.campaign(c,id));}),
        cancel:(id,context)=>tx(context,async c=>{await admin(c,context);const row=await model.campaign(c,id,true);if(!row)throw ApiError.naoEncontrado();if(!['RASCUNHO','AGENDADA','ENVIANDO'].includes(row.status))throw conflict('Campanha não pode ser cancelada');await model.cancelCampaign(c,id);await model.cancelQueue(c,id);await identity.audit(c,'NEWSLETTER.CAMPAIGN_CANCELLED',id,context);return {cancelled:true};})
    };
}
