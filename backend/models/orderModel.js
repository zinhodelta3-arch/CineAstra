import {idString} from '../utils/dto.js';
import {ApiError} from '../utils/ApiError.js';
const one=async(c,sql,args=[])=> (await c.execute(sql,args))[0][0]??null;
export function createOrderModel(){return {
    ownStatus:(c,id,userId)=>one(c,'SELECT id_pedido,status,valor_total FROM pedidos WHERE id_pedido=? AND id_usuario=?',[id,userId]),
    operationalRows:async(c,id)=>(await c.execute(`SELECT ip.id_item,ip.id_insumo,ip.id_combo,ip.id_sessao,s.data,s.horario_inicio,s.horario_fim,
        t.id_ticket,t.status AS ticket_status,
        (SELECT tp.tipo FROM ticket_passagens tp WHERE tp.id_ticket=t.id_ticket ORDER BY tp.id_passagem DESC LIMIT 1) AS ultima_passagem
        FROM itens_pedido ip LEFT JOIN tickets t ON t.id_item=ip.id_item
        LEFT JOIN sessoes s ON s.id_sessao=COALESCE(ip.id_sessao,ip.id_sessao_retirada)
        WHERE ip.id_pedido=? ORDER BY ip.id_item,t.id_ticket`,[id]))[0],
    checkoutByKey:(c,userId,key)=>one(c,'SELECT id_pedido,checkout_hash,status,valor_total,checkout_expira_em FROM pedidos WHERE id_usuario=? AND checkout_key=? FOR UPDATE',[userId,key]),
    checkoutOrder:(c,id)=>one(c,'SELECT id_pedido,status,checkout_expira_em,valor_total FROM pedidos WHERE id_pedido=? FOR UPDATE',[id]),
    ownOrderForCancel:(c,id,owner)=>one(c,'SELECT id_pedido,status FROM pedidos WHERE id_pedido=? AND id_usuario=? FOR UPDATE',[id,owner]),
    cancelKey:(c,owner,key)=>one(c,'SELECT id_pedido FROM pedido_cancelamentos WHERE id_usuario=? AND chave_idempotencia=? FOR UPDATE',[owner,key]),
    async recordCancelKey(c,owner,id,key){await c.execute('INSERT INTO pedido_cancelamentos(id_usuario,id_pedido,chave_idempotencia) VALUES(?,?,?)',[owner,id,key]);},
    async orderIntentions(c,id){return (await c.execute('SELECT id_intencao,estado FROM pagamento_intencoes WHERE id_pedido=? ORDER BY id_intencao FOR UPDATE',[id]))[0];},
    async cancelPreparedIntentions(c,id){await c.execute("UPDATE pagamento_intencoes SET estado='CANCELADA' WHERE id_pedido=? AND estado='PREPARADA'",[id]);},
    hasTicket:(c,id)=>one(c,'SELECT t.id_ticket FROM tickets t JOIN itens_pedido ip ON ip.id_item=t.id_item WHERE ip.id_pedido=? LIMIT 1',[id]),
    async cancelPending(c,id){const [r]=await c.execute("UPDATE pedidos SET status='CANCELADO' WHERE id_pedido=? AND status='AGUARDANDO_PAGAMENTO'",[id]);return r.affectedRows===1;},
    async createCheckout(c,userId,key,hash){const [r]=await c.execute("INSERT INTO pedidos(id_usuario,status,checkout_key,checkout_hash,checkout_expira_em) VALUES(?,'EM_ANDAMENTO',?,?,DATE_ADD(UTC_TIMESTAMP(3),INTERVAL 15 MINUTE))",[userId,key,hash]);return idString(r.insertId);},
    async insertCheckoutItem(c,orderId,line,price){const ids={INPUT:[line.id,null,null,null,null],COMBO:[null,line.id,null,null,null],SESSION:[null,null,line.id,line.seatId,null],STREAMING:[null,null,null,null,line.id]}[line.kind];let rentalDays=null;
        if(line.kind==='STREAMING'&&line.mode==='ALUGUEL'){
            const film=await one(c,'SELECT dias_acesso_aluguel,status,disponivel_streaming FROM filmes WHERE id_filme=? FOR UPDATE',[line.id]);
            if(!film||film.status!=='ATIVO'||!film.disponivel_streaming||!Number.isInteger(film.dias_acesso_aluguel)||film.dias_acesso_aluguel<1||film.dias_acesso_aluguel>36500)throw new ApiError('Prazo de aluguel indisponível',409,null,'ORDER_CONFLICT');
            rentalDays=film.dias_acesso_aluguel;
        }
        const [r]=await c.execute('INSERT INTO itens_pedido(id_pedido,id_insumo,id_combo,id_sessao,id_assento,id_filme,id_sessao_retirada,tipo_streaming,tipo_ingresso,quantidade,valor_unitario,subtotal,dias_acesso_aluguel_snapshot) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)',[orderId,...ids,line.kind==='COMBO'?line.sessionId:null,line.kind==='STREAMING'?line.mode:null,'INTEIRA',line.quantity,price.unitPrice,price.subtotal,rentalDays]);return idString(r.insertId);},
    finalizeCheckout:(c,id,total,couponId)=>c.execute("UPDATE pedidos SET status='AGUARDANDO_PAGAMENTO',valor_total=?,id_cupom=? WHERE id_pedido=? AND status='EM_ANDAMENTO'",[total,couponId,id]),
    expiredIds:async(c,limit)=>(await c.execute("SELECT id_pedido FROM pedidos WHERE status='AGUARDANDO_PAGAMENTO' AND checkout_expira_em<=UTC_TIMESTAMP(3) ORDER BY checkout_expira_em,id_pedido LIMIT ?",[limit]))[0],
    cancelExpired:async(c,id)=>{const [r]=await c.execute("UPDATE pedidos SET status='CANCELADO' WHERE id_pedido=? AND status='AGUARDANDO_PAGAMENTO' AND checkout_expira_em<=UTC_TIMESTAMP(3)",[id]);return r.affectedRows===1;},
    hasStock:async(c,id)=>Boolean(await one(c,'SELECT id_reserva FROM estoque_reservas WHERE id_pedido=? LIMIT 1',[id])),
    session:(c,id)=>one(c,`SELECT s.id_sala,s.status,s.data,s.horario_inicio,s.horario_fim,f.classificacao,f.status AS filme_status,f.disponivel_cinema,sa.status AS sala_status,l.status AS local_status,l.id_local
        FROM sessoes s JOIN filmes f ON f.id_filme=s.id_filme JOIN salas sa ON sa.id_sala=s.id_sala JOIN locais l ON l.id_local=sa.id_local WHERE s.id_sessao=?`,[id]),
    seat:(c,id)=>one(c,'SELECT id_sala,status FROM assentos WHERE id_assento=?',[id]),
    occupiedSeat:(c,sessionId,seatId)=>one(c,"SELECT id_ocupacao FROM assento_ocupacoes WHERE id_sessao=? AND id_assento=? AND (estado='CONFIRMADA' OR expira_em>UTC_TIMESTAMP(3)) LIMIT 1",[sessionId,seatId]),
    input:(c,id)=>one(c,`SELECT i.id_local,i.status,l.status AS local_status,f.status AS fornecedor_status,u.status AS usuario_status,fl.status AS vinculo_status
        FROM insumos i JOIN locais l ON l.id_local=i.id_local JOIN fornecedores f ON f.id_fornecedor=i.id_fornecedor JOIN usuarios u ON u.id_usuario=f.id_usuario
        JOIN fornecedor_locais fl ON fl.id_fornecedor=f.id_fornecedor AND fl.id_local=i.id_local WHERE i.id_insumo=?`,[id]),
    combo:(c,id)=>one(c,'SELECT co.id_local,co.ativo,l.status AS local_status FROM combos co JOIN locais l ON l.id_local=co.id_local WHERE co.id_combo=?',[id]),
    comboParts:async(c,id)=>(await c.execute('SELECT id_insumo,quantidade FROM combo_itens WHERE id_combo=? ORDER BY id_insumo',[id]))[0],
    stock:(c,id)=>one(c,`SELECT i.quantidade,i.quantidade_reservada,i.status,i.id_local,l.status AS local_status,f.status AS fornecedor_status,u.status AS usuario_status,fl.status AS vinculo_status
        FROM insumos i JOIN locais l ON l.id_local=i.id_local JOIN fornecedores f ON f.id_fornecedor=i.id_fornecedor JOIN usuarios u ON u.id_usuario=f.id_usuario
        JOIN fornecedor_locais fl ON fl.id_fornecedor=f.id_fornecedor AND fl.id_local=i.id_local WHERE i.id_insumo=?`,[id]),
    film:(c,id)=>one(c,'SELECT status,disponivel_streaming,classificacao FROM filmes WHERE id_filme=?',[id]),
    age:(c,userId)=>one(c,'SELECT faixa_etaria FROM verificacoes_idade WHERE id_usuario=? AND expiracao>UTC_TIMESTAMP(3) ORDER BY id_verificacao DESC LIMIT 1',[userId])
};}
