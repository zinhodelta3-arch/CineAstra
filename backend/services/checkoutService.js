import {createHash} from 'node:crypto';
import {ApiError} from '../utils/ApiError.js';
import {idString} from '../utils/dto.js';
import {pricingInput} from './orderService.js';

const conflict=message=>new ApiError(message,409,null,'CHECKOUT_CONFLICT');
const expired=value=>Date.parse(`${String(value).replace(' ','T')}Z`)<=Date.now();
const idSort=(a,b)=>BigInt(a)<BigInt(b)?-1:BigInt(a)>BigInt(b)?1:0;
const dto=row=>({orderId:idString(row.id_pedido),status:row.status,total:String(row.valor_total),currency:'BRL',expiresAt:new Date(`${String(row.checkout_expira_em).replace(' ','T')}Z`).toISOString(),paymentPath:`/api/payments`});

export function createCheckoutService({model,orders,identity,pricing,inventory,seats,tickets,streaming,contracts}){
    async function checkout(input,key,context){
        if(typeof key!=='string'||!/^[A-Za-z0-9._:-]{8,120}$/.test(key))throw ApiError.validacao('Chave de idempotência inválida');
        const hash=createHash('sha256').update(JSON.stringify(input)).digest('hex');
        if(input.lines.some(line=>line.kind==='COMBO'&&!line.sessionId))throw ApiError.validacao('Combo exige sessão de retirada no checkout');
        if(input.lines.reduce((n,line)=>n+line.quantity,0)>500)throw ApiError.validacao('Quantidade total excede o limite do checkout');
        return identity.transaction(async c=>{
            const actor=await identity.activeActor(c,context);
            if(actor.tipo_usuario!=='CLIENTE')throw ApiError.acessoNegado();
            const previous=await model.checkoutByKey(c,actor.id_usuario,key);
            if(previous){if(previous.checkout_hash!==hash)throw conflict('Chave reutilizada com conteúdo diferente');return dto(previous);}
            const quote=await orders.quoteOnConnection(c,input,context);
            if(!quote.finalizable)throw conflict('Cotação não finalizável; confira idade, meia e preço');
            if(quote.total==='0.00')throw conflict('Total deve ser positivo');
            const contract=contracts?await contracts.contract(c,input,quote):null;
            if(contracts&&(!input.acceptance?.accepted||input.acceptance.offerHash!==contract.offerHash))throw conflict('Aceite da oferta atual necessário');
            if(streaming)await streaming.ensureSellable(c,input.lines);
            const orderId=await model.createCheckout(c,actor.id_usuario,key,hash);
            const snapshot=await pricing.commit(c,{orderId,input:pricingInput(input),context});
            if(snapshot.total!==quote.total||snapshot.lines.length!==input.lines.length)throw conflict('Cotação mudou; tente novamente');
            const seatsToReserve=input.lines.filter(x=>x.kind==='SESSION').sort((a,b)=>idSort(a.id,b.id)||idSort(a.seatId,b.seatId));
            for(const line of seatsToReserve)await seats.reserve(c,{orderId,sessionId:line.id,seatId:line.seatId});
            const stockLines=input.lines.filter(x=>x.kind==='INPUT'||x.kind==='COMBO').map(x=>({...(x.kind==='INPUT'?{inputId:x.id}:{comboId:x.id}),quantidade:x.quantity}));
            if(stockLines.length)await inventory.reserve(c,{orderId,localId:input.localId,lines:stockLines});
            for(let i=0;i<input.lines.length;i++)await model.insertCheckoutItem(c,orderId,input.lines[i],snapshot.lines[i]);
            await model.finalizeCheckout(c,orderId,snapshot.total,snapshot.couponId);
            if(contract)await contracts.save(c,orderId,contract.offerHash,contract);
            await identity.audit(c,'ORDER.CHECKOUT_CREATED',orderId,context);
            return dto(await model.checkoutOrder(c,orderId));
        },context);
    }
    async function ready(c,orderId,order){
        if(!order?.checkout_expira_em||order.status!=='AGUARDANDO_PAGAMENTO'||expired(order.checkout_expira_em))return false;
        const [checks]=await c.execute(`SELECT
          (SELECT COUNT(*) FROM itens_pedido WHERE id_pedido=? AND id_sessao IS NOT NULL) AS seats_expected,
          (SELECT COUNT(*) FROM assento_ocupacoes WHERE id_pedido=? AND estado='RESERVADA' AND expira_em>UTC_TIMESTAMP(3)) AS seats_reserved,
          (SELECT COUNT(*) FROM itens_pedido WHERE id_pedido=? AND (id_insumo IS NOT NULL OR id_combo IS NOT NULL)) AS stock_expected,
          (SELECT COUNT(*) FROM estoque_reservas WHERE id_pedido=? AND status='ATIVA') AS stock_reserved,
          (SELECT COUNT(*) FROM estoque_reservas WHERE id_pedido=? AND status<>'ATIVA') AS stock_invalid,
          (SELECT COUNT(*) FROM cupom_utilizacoes WHERE id_pedido=? AND status='RESERVADO' AND expira_em>UTC_TIMESTAMP(3)) AS coupon_reserved,
          (SELECT COUNT(*) FROM pedidos WHERE id_pedido=? AND id_cupom IS NOT NULL) AS coupon_expected`,Array(7).fill(orderId));
        const x=checks[0];
        return Number(x.seats_expected)===Number(x.seats_reserved)&&(!Number(x.stock_expected)||Number(x.stock_reserved)>0)&&!Number(x.stock_invalid)&&Number(x.coupon_expected)===Number(x.coupon_reserved)&&(!tickets||await tickets.canIssue(c,orderId))&&(!streaming||await streaming.canGrant(c,orderId));
    }
    async function confirm(c,orderId,actorId,confirmedAt){
        if(await model.hasStock(c,orderId))await inventory.transition(c,{orderId,actorId,action:'CONSUMIR'});
        const [items]=await c.execute('SELECT id_item,id_sessao,id_assento FROM itens_pedido WHERE id_pedido=? AND id_sessao IS NOT NULL ORDER BY id_sessao,id_assento',[orderId]);
        for(const item of items)await seats.confirm(c,{orderId,sessionId:item.id_sessao,seatId:item.id_assento,itemId:item.id_item});
        await pricing.settleCoupon(c,{orderId,action:'CONFIRMAR'});
        if(tickets)await tickets.issue(c,{orderId});
        if(streaming)await streaming.grant(c,orderId,confirmedAt);
    }
    async function expireBatch(limit=25){
        const ids=await identity.transaction(c=>model.expiredIds(c,limit));
        let cancelled=0;
        for(const {id_pedido:id} of ids){
            cancelled+=await identity.transaction(async c=>{
                if(!await model.cancelExpired(c,id))return 0;
                if(await model.hasStock(c,id))await inventory.transition(c,{orderId:id,action:'LIBERAR'});
                await seats.releaseCancelled(c,{orderId:id});
                await pricing.settleCoupon(c,{orderId:id,action:'LIBERAR'});
                await identity.audit(c,'ORDER.CHECKOUT_EXPIRED',id,{});
                return 1;
            });
        }
        return {cancelled};
    }
    async function cancel(orderId,key,context){
        const conflict=()=>new ApiError('Pedido não pode ser cancelado nesta etapa',409,null,'ORDER_CANCEL_CONFLICT');
        const record=async(c,owner)=>{try{await model.recordCancelKey(c,owner,orderId,key);}catch(error){if(error.code==='ER_DUP_ENTRY')throw conflict();throw error;}};
        return identity.transaction(async c=>{
            const actor=await identity.activeActor(c,context);
            if(actor.tipo_usuario!=='CLIENTE')throw ApiError.acessoNegado();
            const order=await model.ownOrderForCancel(c,orderId,actor.id_usuario);
            if(!order)throw ApiError.naoEncontrado();
            const previous=await model.cancelKey(c,actor.id_usuario,key);
            if(previous&&idString(previous.id_pedido)!==idString(orderId))throw conflict();
            const result={orderId:idString(orderId),status:'CANCELADO'};
            if(order.status==='CANCELADO'){
                if(!previous)await record(c,actor.id_usuario);
                return result;
            }
            if(order.status!=='AGUARDANDO_PAGAMENTO'||await model.hasTicket(c,orderId))throw conflict();
            const intentions=await model.orderIntentions(c,orderId);
            if(intentions.some(row=>!['PREPARADA','CANCELADA'].includes(row.estado)))throw conflict();
            await model.cancelPreparedIntentions(c,orderId);
            if(!await model.cancelPending(c,orderId))throw conflict();
            if(await model.hasStock(c,orderId))await inventory.transition(c,{orderId,action:'LIBERAR'});
            await seats.releaseCancelled(c,{orderId});
            await pricing.settleCoupon(c,{orderId,action:'LIBERAR'});
            await record(c,actor.id_usuario);
            await identity.audit(c,'ORDER.CANCELLED_BY_OWNER',orderId,context);
            return result;
        },context);
    }
    return {checkout,ready,confirm,expireBatch,cancel};
}
