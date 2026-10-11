import {ApiError} from '../utils/ApiError.js';
import {idString} from '../utils/dto.js';
import {interval} from './sessionService.js';
import {operationalOrder} from './orderOperationalStatus.js';

const found=row=>{if(!row)throw ApiError.naoEncontrado();return row;};
const conflict=message=>new ApiError(message,409,null,'ORDER_CONFLICT');
const ageOn=(birth,on)=>{if(!birth)return -1;const b=String(birth).slice(0,10),d=String(on).slice(0,10);return Number(d.slice(0,4))-Number(b.slice(0,4))-(d.slice(5)<b.slice(5)?1:0);};
const ageLimit={L:0,'10':10,'12':12,'14':14,'16':16,'18':18};
const category=line=>line.kind==='STREAMING'?(line.mode==='COMPRA'?'PURCHASE':'RENTAL'):line.kind;
export const pricingInput=input=>({couponCode:input.couponCode,lines:input.lines.map(line=>({category:category(line),id:line.id,quantity:line.quantity,...(line.halfPreview?{halfPreview:true}:{})}))});

export function createOrderService({model,identity,pricing}){
    async function quoteOnConnection(c,input,context){
        const user=await identity.activeActor(c,context);
        if(user.tipo_usuario!=='CLIENTE')throw ApiError.acessoNegado();
        const proof=await model.age(c,user.id_usuario);
        if(!proof)throw ApiError.acessoNegado();
        const seen=new Set(),stock=new Map();
        const addStock=(id,count)=>stock.set(id,(stock.get(id)??0n)+BigInt(count));
        for(const line of input.lines){
            const key=`${line.kind}:${line.id}:${line.mode??''}:${line.seatId??''}`;
            if(seen.has(key))throw ApiError.validacao('Item duplicado');seen.add(key);
            if(line.kind==='SESSION'){
                const session=found(await model.session(c,line.id)),seat=found(await model.seat(c,line.seatId));
                if(!['AGENDADA','EM_CARTAZ'].includes(session.status)||session.sala_status!=='ATIVA'||session.local_status!=='ATIVO'||session.filme_status!=='ATIVO'||!session.disponivel_cinema||idString(session.id_sala)!==idString(seat.id_sala)||seat.status!=='ATIVA')throw conflict('Sessão ou assento indisponível');
                if(await model.occupiedSeat(c,line.id,line.seatId))throw conflict('Assento ocupado');
                if(input.localId&&idString(session.id_local)!==input.localId)throw conflict('Sessão de outro local');
                if(ageOn(user.data_nascimento,session.data)<ageLimit[session.classificacao])throw ApiError.acessoNegado();
            }else if(line.kind==='INPUT'){
                const row=found(await model.input(c,line.id));
                if(!input.localId||idString(row.id_local)!==input.localId||row.status!=='DISPONIVEL'||row.local_status!=='ATIVO'||row.fornecedor_status!=='ATIVO'||row.usuario_status!=='ATIVO'||row.vinculo_status!=='ATIVO')throw conflict('Insumo indisponível no local');
                addStock(line.id,line.quantity);
            }else if(line.kind==='COMBO'){
                const row=found(await model.combo(c,line.id));
                if(!input.localId||idString(row.id_local)!==input.localId||!row.ativo||row.local_status!=='ATIVO')throw conflict('Combo indisponível no local');
                if(line.sessionId){
                    const session=found(await model.session(c,line.sessionId));
                    if(idString(session.id_local)!==input.localId||!['AGENDADA','EM_CARTAZ'].includes(session.status)||session.sala_status!=='ATIVA'||session.local_status!=='ATIVO'||interval(session).end+1800000<=Date.now())throw conflict('Sessão de retirada indisponível');
                }
                const parts=await model.comboParts(c,line.id);
                if(!parts.length)throw conflict('Combo sem composição');
                for(const part of parts)addStock(idString(part.id_insumo),BigInt(part.quantidade)*BigInt(line.quantity));
            }else{
                const film=found(await model.film(c,line.id));
                if(film.status!=='ATIVO'||!film.disponivel_streaming)throw conflict('Filme indisponível');
                if(ageOn(user.data_nascimento,new Date().toISOString().slice(0,10))<ageLimit[film.classificacao])throw ApiError.acessoNegado();
            }
        }
        for(const [id,count] of stock){const row=found(await model.stock(c,id));if(count>2147483647n||!input.localId||idString(row.id_local)!==input.localId||row.status!=='DISPONIVEL'||row.local_status!=='ATIVO'||row.fornecedor_status!=='ATIVO'||row.usuario_status!=='ATIVO'||row.vinculo_status!=='ATIVO'||BigInt(row.quantidade)-BigInt(row.quantidade_reservada)<count)throw conflict('Estoque insuficiente no local');}
        const quote=await pricing.quoteOnConnection(c,pricingInput(input),context);
        return {...quote,fees:'0.00',guardianAuthorizationRequired:proof.faixa_etaria==='ATE_16',finalizable:quote.finalizable&&proof.faixa_etaria!=='ATE_16'};
    }
    async function status(id,context){return identity.transaction(async c=>{
        const actor=await identity.activeActor(c,context);
        if(actor.tipo_usuario!=='CLIENTE')throw ApiError.acessoNegado();
        const order=found(await model.ownStatus(c,id,actor.id_usuario));
        const financialStatus=order.status;
        const state=['PAGO','FINALIZADO'].includes(financialStatus)?operationalOrder(await model.operationalRows(c,id)):{operationalStatus:null,items:[]};
        return {orderId:idString(order.id_pedido),financialStatus,...state};
    },context);}
    return {quoteOnConnection,quote:(input,context)=>identity.transaction(c=>quoteOnConnection(c,input,context),context),status};
}
