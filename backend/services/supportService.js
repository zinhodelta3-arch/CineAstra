import {ApiError} from '../utils/ApiError.js';
import {idString} from '../utils/dto.js';
import {instant} from './identityService.js';

const conflict=message=>new ApiError(message,409,null,'SUPPORT_CONFLICT');
const dto=row=>({id:idString(row.id_suporte),clientId:idString(row.id_cliente),attendantId:row.id_atendente?idString(row.id_atendente):null,subject:row.assunto,status:row.status,openedAt:row.data_abertura,responseDueAt:row.prazo_resposta_em,firstResponseAt:row.primeira_resposta_em??null,lastInteractionAt:row.ultima_interacao_em??null,closedAt:row.data_fechamento??null,responseOverdue:['ABERTO','EM_ATENDIMENTO'].includes(row.status)&&!row.primeira_resposta_em&&Boolean(row.prazo_resposta_em)&&instant(row.prazo_resposta_em)<Date.now()});
const messageDto=row=>({id:idString(row.id_mensagem),authorId:row.id_autor?idString(row.id_autor):null,role:row.papel,message:row.mensagem,createdAt:row.registrada_em??null,origin:row.origem});
const page=(rows,limit,mapper,idKey)=>{const items=rows.slice(0,limit);return {items:items.map(mapper),pagination:{limit,nextCursor:rows.length>limit?idString(items.at(-1)[idKey]):null}};};

export function createSupportService({model,identity,notifications}){
    const tx=(context,fn)=>identity.transaction(fn,context);
    async function actor(c,context){const value=await identity.activeActor(c,context);if(!['CLIENTE','ADMIN'].includes(value.tipo_usuario))throw ApiError.acessoNegado();return value;}
    async function access(c,id,context,lock=false){const a=await actor(c,context),row=await model.support(c,id,lock);if(!row||a.tipo_usuario==='CLIENTE'&&idString(row.id_cliente)!==idString(a.id_usuario))throw ApiError.naoEncontrado();return {a,row};}
    async function assigned(c,id,context){const {a,row}=await access(c,id,context,true);if(a.tipo_usuario!=='ADMIN')throw ApiError.acessoNegado();if(!row.id_atendente||idString(row.id_atendente)!==idString(a.id_usuario))throw ApiError.acessoNegado();return {a,row};}
    async function expireIfNeeded(c,id,context={}){const live=await model.live(c,id);if(!live)return null;if(instant(live.iniciado_em)+600000>Date.now())return live;await model.expireLive(c,id);await model.openQueue(c,id);await identity.audit(c,'SUPPORT.LIVE_EXPIRED',id,context);return null;}
    return {
        create:(input,context)=>tx(context,async c=>{const a=await actor(c,context);if(a.tipo_usuario!=='CLIENTE')throw ApiError.acessoNegado();const id=await model.create(c,a.id_usuario,input);await model.append(c,id,a.id_usuario,'CLIENTE',input.message);await identity.audit(c,'SUPPORT.OPENED',id,context);return dto(await model.support(c,id));}),
        ownList:(query,context)=>tx(context,async c=>{const a=await actor(c,context);if(a.tipo_usuario!=='CLIENTE')throw ApiError.acessoNegado();return page(await model.ownerList(c,a.id_usuario,query.limit,query.cursor),query.limit,dto,'id_suporte');}),
        adminQueue:(query,context)=>tx(context,async c=>{const a=await actor(c,context);if(a.tipo_usuario!=='ADMIN')throw ApiError.acessoNegado();return page(await model.queue(c,query.limit,query.cursor),query.limit,dto,'id_suporte');}),
        get:(id,context)=>tx(context,async c=>dto((await access(c,id,context)).row)),
        messages:(id,query,context)=>tx(context,async c=>{await access(c,id,context);return page(await model.messages(c,id,query.limit,query.cursor),query.limit,messageDto,'id_mensagem');}),
        async message(id,input,context){const result=await tx(context,async c=>{
            const {a,row}=await access(c,id,context,true);
            if(row.status==='FECHADO')throw conflict('Solicitação fechada');
            if(a.tipo_usuario==='ADMIN'&&(!row.id_atendente||idString(row.id_atendente)!==idString(a.id_usuario)))throw ApiError.acessoNegado();
            if(a.tipo_usuario==='ADMIN'&&row.status==='RESOLVIDO')throw conflict('Solicitação já resolvida');
            if(input.mode==='LIVE'&&!await expireIfNeeded(c,id,context))return {expired:true};
            const author=idString(a.id_usuario),role=a.tipo_usuario;
            const messageId=await model.append(c,id,author,role,input.message);
            if(role==='CLIENTE')await model.clientInteraction(c,id,row.status==='RESOLVIDO');
            else{
                await model.latestResponse(c,id,input.message);
                await notifications.emit(c,{recipientId:idString(row.id_cliente),title:'Resposta do suporte',message:'Sua solicitação recebeu uma resposta.',type:'SUPPORT_REPLY',dedupeKey:`support-message-${messageId}`});
            }
            await identity.audit(c,'SUPPORT.MESSAGE',id,context);
            return {messageId,status:role==='CLIENTE'&&row.status==='RESOLVIDO'?'ABERTO':row.status};
        });if(result.expired)throw conflict('Atendimento ao vivo de 10 minutos encerrado; solicitação permanece na fila');return result;},
        assign:(id,adminId,context)=>tx(context,async c=>{const {a,row}=await access(c,id,context,true);if(a.tipo_usuario!=='ADMIN')throw ApiError.acessoNegado();if(['RESOLVIDO','FECHADO'].includes(row.status))throw conflict('Solicitação encerrada');if(await expireIfNeeded(c,id,context))throw conflict('Atendimento ao vivo em andamento');if(!await model.adminUser(c,adminId))throw ApiError.validacao('Atendente ADMIN inválido');if(row.id_atendente){if(idString(row.id_atendente)!==idString(adminId))throw conflict('Solicitação já atribuída');return dto(row);}await model.assign(c,id,adminId);await identity.audit(c,'SUPPORT.ASSIGNED',id,context);return dto(await model.support(c,id));}),
        startLive:(id,context)=>tx(context,async c=>{const {a,row}=await assigned(c,id,context);if(['RESOLVIDO','FECHADO'].includes(row.status))throw conflict('Solicitação encerrada');if(await expireIfNeeded(c,id,context))throw conflict('Atendimento ao vivo em andamento');const sessionId=await model.startLive(c,id,a.id_usuario);await identity.audit(c,'SUPPORT.LIVE_STARTED',id,context);return {sessionId,status:'EM_ATENDIMENTO',expiresInSeconds:600};}),
        endLive:(id,context)=>tx(context,async c=>{await assigned(c,id,context);const live=await model.live(c,id);if(!live)throw conflict('Nenhum atendimento ao vivo');await model.endLive(c,id);await model.openQueue(c,id);await identity.audit(c,'SUPPORT.LIVE_ENDED',id,context);return {status:'ABERTO',queued:true};}),
        resolve:(id,context)=>tx(context,async c=>{const {row}=await assigned(c,id,context);if(['RESOLVIDO','FECHADO'].includes(row.status))throw conflict('Solicitação encerrada');const lastAdmin=await model.lastAdminMessage(c,id),lastClient=await model.lastClientMessage(c,id);if(!lastAdmin||lastClient&&BigInt(lastAdmin.id_mensagem)<BigInt(lastClient.id_mensagem))throw conflict('Resposta ADMIN necessária');if(await model.live(c,id))await model.endLive(c,id);await model.resolve(c,id);await identity.audit(c,'SUPPORT.RESOLVED',id,context);return dto(await model.support(c,id));}),
        close:(id,context)=>tx(context,async c=>{const {a,row}=await access(c,id,context,true);if(a.tipo_usuario!=='CLIENTE')throw ApiError.acessoNegado();if(row.status!=='RESOLVIDO')throw conflict('Solicitação deve estar resolvida');await model.close(c,id);await identity.audit(c,'SUPPORT.CLOSED',id,context);return dto(await model.support(c,id));}),
        async expireBatch(limit=100){const ids=await tx({},c=>model.expiredIds(c,limit));let count=0;for(const item of ids){await tx({},async c=>{const row=await model.support(c,item.id_suporte,true);if(!row||row.status!=='EM_ATENDIMENTO')return;const active=await model.live(c,item.id_suporte);if(active&&instant(active.iniciado_em)+600000<=Date.now()){await model.expireLive(c,item.id_suporte);await model.openQueue(c,item.id_suporte);await identity.audit(c,'SUPPORT.LIVE_EXPIRED',item.id_suporte,{});count++;}});}return {expired:count};}
    };
}
