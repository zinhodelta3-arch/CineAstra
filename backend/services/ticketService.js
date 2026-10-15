import {randomBytes} from 'node:crypto';
import {ApiError} from '../utils/ApiError.js';
import {idString} from '../utils/dto.js';
import {interval} from './sessionService.js';

const conflict=message=>new ApiError(message,409,null,'TICKET_CONFLICT');
const found=row=>{if(!row)throw ApiError.naoEncontrado();return row;};
const instant=value=>value?Date.parse(/[Z+-]\d*:?\d*$/.test(String(value).slice(10))?String(value):`${String(value).replace(' ','T')}Z`):null;
const asSql=ms=>new Date(ms).toISOString().replace('T',' ').replace('Z','').slice(0,23);
const typeOf=item=>item.id_sessao?'INGRESSO_SESSAO':item.id_combo||item.id_insumo?'RETIRADA_INSUMO':'ACESSO_STREAMING';
const effectiveStatus=row=>row.status==='GERADO'&&row.expira_em&&instant(row.expira_em)<=Date.now()?'EXPIRADO':row.status;
const reentryOpen=row=>row.expira_em?instant(row.expira_em)>Date.now():row.data&&row.horario_inicio&&row.horario_fim?interval(row).end>Date.now():false;
const dto=(row,owner=false)=>({id:idString(row.id_ticket),itemId:idString(row.id_item),type:row.tipo,unit:Number(row.unidade),status:effectiveStatus(row),presence:row.tipo==='INGRESSO_SESSAO'&&row.ultima_passagem?row.ultima_passagem==='ENTRADA'?'DENTRO':'FORA':null,expiresAt:row.expira_em?new Date(instant(row.expira_em)).toISOString():null,usedAt:row.data_utilizacao?new Date(instant(row.data_utilizacao)).toISOString():null,exitedAt:row.saida_em?new Date(instant(row.saida_em)).toISOString():null,...(owner?{code:row.codigo}:{})});

export function createTicketService({model,identity}){
    async function staff(c,context,sessionId,localId){
        const actor=await identity.activeActor(c,context),role=actor.tipo_usuario;
        if(!['ADMIN','SUPERVISOR','COLABORADOR'].includes(role))throw ApiError.acessoNegado();
        if(!localId)throw ApiError.naoEncontrado();
        if(role!=='ADMIN'&&!await model.staffScope(c,actor.id_usuario,role,sessionId??null,localId))throw ApiError.acessoNegado();
        return actor;
    }
    async function issueItems(c,orderId){
        const items=await model.orderItems(c,orderId);
        if(!items.length)return null;
        let count=0;
        const prepared=[];
        for(const item of items){
            const qty=Number(item.quantidade);
            if(!Number.isSafeInteger(qty)||qty<1||qty>100||((count+=qty)>500))return null;
            const type=typeOf(item);
            if(type==='RETIRADA_INSUMO'&&item.id_combo&&!item.id_sessao_retirada)return null;
            let expiresAt=null;
            if(item.id_sessao||item.id_sessao_retirada){
                if(!item.data||!item.horario_inicio||!item.horario_fim||item.sessao_status==='CANCELADA')return null;
                const end=interval(item).end;
                const limit=end+(item.id_combo?1800000:0);
                if(limit<=Date.now())return null;
                expiresAt=asSql(limit);
            }
            prepared.push({item,type,qty,expiresAt});
        }
        return prepared;
    }
    async function canIssue(c,orderId){return Boolean(await issueItems(c,orderId));}
    async function issue(c,{orderId}){
        if(!c?.execute)throw new TypeError('Conexão transacional obrigatória');
        orderId=idString(orderId);
        const order=found(await model.order(c,orderId));
        if(!['PAGO','FINALIZADO'].includes(order.status)||!await model.approvedPayment(c,orderId))throw conflict('Pedido sem pagamento aprovado');
        const prepared=await issueItems(c,orderId);
        if(!prepared)throw conflict('Itens ou validade incompatíveis com emissão');
        let created=0;
        for(const {item,type,qty,expiresAt} of prepared){
            for(let unit=1;unit<=qty;unit++){
                if(await model.existingUnit(c,item.id_item,type,unit))continue;
                const code=randomBytes(32).toString('base64url');
                await model.insertUnit(c,{itemId:item.id_item,type,unit,code,sessionId:item.id_combo?item.id_sessao_retirada:null,expiresAt});
                created++;
            }
        }
        return {created};
    }
    async function ownerTickets(orderId,{limit=50,cursor='0'},context){return identity.transaction(async c=>{
        const actor=await identity.activeActor(c,context);
        if(actor.tipo_usuario!=='CLIENTE')throw ApiError.acessoNegado();
        found(await model.ownOrder(c,orderId,actor.id_usuario));
        const rows=await model.ownerTickets(c,orderId,limit,cursor),page=rows.slice(0,limit);
        return {items:page.map(row=>dto(row,true)),pagination:{limit,nextCursor:rows.length>limit?idString(page.at(-1).id_ticket):null}};
    },context);}
    async function sessionTickets(sessionId,{limit=50,cursor='0'},context){return identity.transaction(async c=>{
        const location=found(await model.sessionLocal(c,sessionId));
        await staff(c,context,sessionId,location.id_local);
        const rows=await model.sessionTickets(c,sessionId,limit,cursor),page=rows.slice(0,limit);
        return {items:page.map(row=>dto(row)),pagination:{limit,nextCursor:rows.length>limit?idString(page.at(-1).id_ticket):null}};
    },context);}
    async function validate(code,context){return identity.transaction(async c=>{
        const row=found(await model.byCode(c,code));
        await staff(c,context,row.sessao_vinculada,row.id_local);
        return {...dto(row),valid:['PAGO','FINALIZADO'].includes(row.pedido_status)&&effectiveStatus(row)==='GERADO',reentryAllowed:row.tipo==='INGRESSO_SESSAO'&&['PAGO','FINALIZADO'].includes(row.pedido_status)&&row.status==='UTILIZADO'&&row.ultima_passagem==='SAIDA'&&reentryOpen(row),halfEvidenceRequired:row.tipo_ingresso==='MEIA'};
    },context);}
    async function consume(code,halfEvidenceType,context){return identity.transaction(async c=>{
        const row=found(await model.byCode(c,code,true));
        const actor=await staff(c,context,row.sessao_vinculada,row.id_local);
        if(!['PAGO','FINALIZADO'].includes(row.pedido_status)||effectiveStatus(row)!=='GERADO'||row.tipo==='ACESSO_STREAMING')throw conflict('Ticket não consumível');
        if(row.tipo_ingresso==='MEIA'&&!halfEvidenceType)throw ApiError.validacao('Comprovação de meia deve ser conferida na portaria');
        if(row.tipo_ingresso!=='MEIA'&&halfEvidenceType)throw ApiError.validacao('Comprovação não se aplica ao ticket');
        if(!await model.consume(c,row.id_ticket,actor.id_usuario,halfEvidenceType??null))throw conflict('Ticket já consumido ou expirado');
        if(row.tipo==='INGRESSO_SESSAO')await model.appendPassage(c,row.id_ticket,'ENTRADA',actor.id_usuario,halfEvidenceType??null);
        await identity.audit(c,'TICKET.CONSUMED',row.id_ticket,context);
        return {...dto({...row,status:'UTILIZADO',data_utilizacao:new Date().toISOString(),ultima_passagem:row.tipo==='INGRESSO_SESSAO'?'ENTRADA':null}),halfEvidenceChecked:row.tipo_ingresso==='MEIA'};
    },context);}
    async function exit(code,context){return identity.transaction(async c=>{
        const row=found(await model.byCode(c,code,true));
        const actor=await staff(c,context,row.sessao_vinculada,row.id_local);
        if(row.tipo!=='INGRESSO_SESSAO'||row.status!=='UTILIZADO')throw conflict('Saída incompatível');
        const last=await model.lastPassage(c,row.id_ticket);
        if(last?.tipo!=='ENTRADA')throw conflict('Saída exige presença ativa');
        if(!await model.exit(c,row.id_ticket,actor.id_usuario))throw conflict('Saída já registrada');
        await model.appendPassage(c,row.id_ticket,'SAIDA',actor.id_usuario);
        await identity.audit(c,'TICKET.EXITED',row.id_ticket,context);
        return dto({...row,saida_em:new Date().toISOString(),ultima_passagem:'SAIDA'});
    },context);}
    async function entry(code,halfEvidenceType,context){return identity.transaction(async c=>{
        const row=found(await model.byCode(c,code,true));
        const actor=await staff(c,context,row.sessao_vinculada,row.id_local);
        if(row.tipo!=='INGRESSO_SESSAO'||row.status!=='UTILIZADO'||!['PAGO','FINALIZADO'].includes(row.pedido_status)||!reentryOpen(row))throw conflict('Reentrada indisponível');
        const last=await model.lastPassage(c,row.id_ticket);
        if(last?.tipo!=='SAIDA')throw conflict('Reentrada exige saída anterior');
        if(row.tipo_ingresso==='MEIA'&&!halfEvidenceType)throw ApiError.validacao('Comprovação de meia deve ser conferida na portaria');
        if(row.tipo_ingresso!=='MEIA'&&halfEvidenceType)throw ApiError.validacao('Comprovação não se aplica ao ticket');
        await model.appendPassage(c,row.id_ticket,'ENTRADA',actor.id_usuario,halfEvidenceType??null);
        await identity.audit(c,'TICKET.REENTERED',row.id_ticket,context);
        return {...dto({...row,ultima_passagem:'ENTRADA'}),halfEvidenceChecked:row.tipo_ingresso==='MEIA'};
    },context);}
    async function attendance(sessionId,{limit=50,cursor='0'},context){return identity.transaction(async c=>{
        const location=found(await model.sessionLocal(c,sessionId));
        await staff(c,context,sessionId,location.id_local);
        const summary=await model.attendanceSummary(c,sessionId);
        const rows=await model.attendance(c,sessionId,limit,cursor),page=rows.slice(0,limit);
        return {summary:{total:Number(summary.total),entered:Number(summary.entered),inside:Number(summary.inside),exited:Number(summary.exited),late:Number(summary.late)},items:page.map(row=>({id:idString(row.id_passagem),ticketId:idString(row.id_ticket),type:row.tipo,at:new Date(instant(row.ocorrido_em)).toISOString(),staffId:row.id_usuario_staff?idString(row.id_usuario_staff):null})),pagination:{limit,nextCursor:rows.length>limit?idString(page.at(-1).id_passagem):null}};
    },context);}
    return {canIssue,issue,ownerTickets,sessionTickets,validate,consume,exit,entry,attendance};
}
