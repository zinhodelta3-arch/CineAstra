import {idString} from '../utils/dto.js';

const one=async(c,sql,args=[])=> (await c.execute(sql,args))[0][0]??null;
const rows=async(c,sql,args=[])=> (await c.execute(sql,args))[0];
const itemProjection=`ip.id_item,ip.id_pedido,ip.id_insumo,ip.id_combo,ip.id_sessao,ip.id_sessao_retirada,ip.id_filme,ip.tipo_ingresso,ip.quantidade,
    s.data,s.horario_inicio,s.horario_fim,s.status AS sessao_status`;
const itemJoin=' FROM itens_pedido ip LEFT JOIN sessoes s ON s.id_sessao=COALESCE(ip.id_sessao,ip.id_sessao_retirada)';
const ticketProjection=`t.id_ticket,t.id_item,t.codigo,t.tipo,t.status,t.unidade,t.expira_em,t.data_geracao,t.data_utilizacao,t.saida_em,t.meia_comprovacao,
    (SELECT tp.tipo FROM ticket_passagens tp WHERE tp.id_ticket=t.id_ticket ORDER BY tp.id_passagem DESC LIMIT 1) AS ultima_passagem,
    ip.id_pedido,ip.id_sessao,ip.tipo_ingresso,p.id_usuario,p.status AS pedido_status,s.data,s.horario_inicio,s.horario_fim,
    COALESCE(ip.id_sessao,t.id_sessao_retirada) AS sessao_vinculada,COALESCE(sa.id_local,co.id_local,i.id_local) AS id_local`;
const ticketJoin=` FROM tickets t JOIN itens_pedido ip ON ip.id_item=t.id_item JOIN pedidos p ON p.id_pedido=ip.id_pedido
    LEFT JOIN sessoes s ON s.id_sessao=COALESCE(ip.id_sessao,t.id_sessao_retirada)
    LEFT JOIN salas sa ON sa.id_sala=s.id_sala LEFT JOIN combos co ON co.id_combo=ip.id_combo LEFT JOIN insumos i ON i.id_insumo=ip.id_insumo`;

export function createTicketModel(database){return {
    order:(c,id)=>one(c,'SELECT id_pedido,status FROM pedidos WHERE id_pedido=? FOR UPDATE',[id]),
    approvedPayment:(c,id)=>one(c,"SELECT id_pagamento FROM pagamentos WHERE id_pedido=? AND status='APROVADO' AND id_intencao IS NOT NULL LIMIT 1",[id]),
    orderItems:(c,id)=>rows(c,`SELECT ${itemProjection}${itemJoin} WHERE ip.id_pedido=? ORDER BY ip.id_item`,[id]),
    existingUnit:(c,itemId,type,unit)=>one(c,'SELECT id_ticket FROM tickets WHERE id_item=? AND tipo=? AND unidade=? FOR UPDATE',[itemId,type,unit]),
    async insertUnit(c,{itemId,type,unit,code,sessionId,expiresAt}){const [r]=await c.execute("INSERT INTO tickets(id_item,codigo,tipo,status,unidade,id_sessao_retirada,expira_em) VALUES(?,?,?,'GERADO',?,?,?)",[itemId,code,type,unit,sessionId,expiresAt]);return idString(r.insertId);},
    ownOrder:(c,orderId,userId)=>one(c,'SELECT id_pedido FROM pedidos WHERE id_pedido=? AND id_usuario=?',[orderId,userId]),
    ownerTickets:(c,orderId,limit,cursor)=>rows(c,`SELECT t.id_ticket,t.id_item,t.codigo,t.tipo,t.status,t.unidade,t.expira_em,t.data_utilizacao,t.saida_em,
        (SELECT tp.tipo FROM ticket_passagens tp WHERE tp.id_ticket=t.id_ticket ORDER BY tp.id_passagem DESC LIMIT 1) AS ultima_passagem
        FROM tickets t JOIN itens_pedido ip ON ip.id_item=t.id_item WHERE ip.id_pedido=? AND t.id_ticket>? ORDER BY t.id_ticket LIMIT ?`,[orderId,cursor,limit+1]),
    byCode:(c,code,lock=false)=>one(c,`SELECT ${ticketProjection}${ticketJoin} WHERE t.codigo=?${lock?' FOR UPDATE':''}`,[code]),
    sessionLocal:(c,sessionId)=>one(c,'SELECT sa.id_local FROM sessoes s JOIN salas sa ON sa.id_sala=s.id_sala WHERE s.id_sessao=?',[sessionId]),
    staffScope:(c,actorId,role,sessionId,localId)=>one(c,`SELECT e.id_equipe FROM equipes e JOIN sessoes s ON s.id_sessao=e.id_sessao JOIN salas sa ON sa.id_sala=s.id_sala
        LEFT JOIN equipe_membros m ON m.id_equipe=e.id_equipe AND m.id_usuario=? AND m.status='ATIVO'
        WHERE e.status='ATIVA' AND (? IS NULL OR e.id_sessao=?) AND sa.id_local=? AND
          ((?='SUPERVISOR' AND e.id_supervisor=?) OR (?='COLABORADOR' AND m.id_equipe_membro IS NOT NULL)) LIMIT 1`,[actorId,sessionId,sessionId,localId,role,actorId,role]),
    sessionTickets:(c,sessionId,limit,cursor)=>rows(c,`SELECT t.id_ticket,t.id_item,t.tipo,t.status,t.unidade,t.expira_em,t.data_utilizacao,t.saida_em,
        (SELECT tp.tipo FROM ticket_passagens tp WHERE tp.id_ticket=t.id_ticket ORDER BY tp.id_passagem DESC LIMIT 1) AS ultima_passagem
        FROM tickets t JOIN itens_pedido ip ON ip.id_item=t.id_item WHERE COALESCE(ip.id_sessao,t.id_sessao_retirada)=? AND t.id_ticket>? ORDER BY t.id_ticket LIMIT ?`,[sessionId,cursor,limit+1]),
    async consume(c,id,actorId,evidence){const [r]=await c.execute("UPDATE tickets SET status='UTILIZADO',data_utilizacao=UTC_TIMESTAMP(),conferido_por=?,meia_comprovacao=? WHERE id_ticket=? AND status='GERADO' AND (expira_em IS NULL OR expira_em>UTC_TIMESTAMP(3))",[actorId,evidence,id]);return r.affectedRows===1;},
    async exit(c,id,actorId){const [r]=await c.execute("UPDATE tickets SET saida_em=UTC_TIMESTAMP(3),saida_por=? WHERE id_ticket=? AND tipo='INGRESSO_SESSAO' AND status='UTILIZADO'",[actorId,id]);return r.affectedRows===1;},
    lastPassage:(c,id)=>one(c,'SELECT id_passagem,tipo,ocorrido_em FROM ticket_passagens WHERE id_ticket=? ORDER BY id_passagem DESC LIMIT 1',[id]),
    async appendPassage(c,id,type,actorId,evidence=null){const [r]=await c.execute('INSERT INTO ticket_passagens(id_ticket,tipo,ocorrido_em,id_usuario_staff,meia_comprovacao) VALUES(?,?,UTC_TIMESTAMP(3),?,?)',[id,type,actorId,evidence]);return idString(r.insertId);},
    attendanceSummary:(c,sessionId)=>one(c,`SELECT COUNT(*) AS total,
        COALESCE(SUM(x.ultima_passagem IS NOT NULL),0) AS entered,
        COALESCE(SUM(x.ultima_passagem='ENTRADA'),0) AS inside,
        COALESCE(SUM(x.ultima_passagem='SAIDA'),0) AS exited,
        COALESCE(SUM(x.status='GERADO' AND UTC_TIMESTAMP(3)>TIMESTAMP(s.data,s.horario_inicio)),0) AS late
        FROM (SELECT t.id_ticket,t.status,ip.id_sessao,
            (SELECT tp.tipo FROM ticket_passagens tp WHERE tp.id_ticket=t.id_ticket ORDER BY tp.id_passagem DESC LIMIT 1) AS ultima_passagem
            FROM tickets t JOIN itens_pedido ip ON ip.id_item=t.id_item WHERE ip.id_sessao=? AND t.tipo='INGRESSO_SESSAO') x
        JOIN sessoes s ON s.id_sessao=x.id_sessao`,[sessionId]),
    attendance:(c,sessionId,limit,cursor)=>rows(c,`SELECT tp.id_passagem,tp.id_ticket,tp.tipo,tp.ocorrido_em,tp.id_usuario_staff
        FROM ticket_passagens tp JOIN tickets t ON t.id_ticket=tp.id_ticket JOIN itens_pedido ip ON ip.id_item=t.id_item
        WHERE ip.id_sessao=? AND tp.id_passagem>? ORDER BY tp.id_passagem LIMIT ?`,[sessionId,cursor,limit+1])
};}
