import {idString} from '../utils/dto.js';

export function createRefundModel(database){
    const rows=async(c,sql,args=[])=> (await c.execute(sql,args))[0];
    const one=async(c,sql,args=[])=> (await rows(c,sql,args))[0]??null;
    const paymentSql='SELECT p.id_pagamento,p.id_pedido,p.id_cobranca,p.id_metodo,p.valor,p.status,p.transacao_id,COALESCE(i.id_usuario,o.id_usuario,ac.id_usuario) AS id_usuario,i.provider,i.provider_ref,o.data_pedido,a.inicio AS assinatura_inicio,a.periodicidade,a.status AS assinatura_status FROM pagamentos p LEFT JOIN pagamento_intencoes i ON i.id_intencao=p.id_intencao LEFT JOIN pedidos o ON o.id_pedido=p.id_pedido LEFT JOIN assinatura_cobrancas ac ON ac.id_cobranca=p.id_cobranca LEFT JOIN assinaturas a ON a.id_assinatura=ac.id_assinatura WHERE p.id_pagamento=?';
    const refundSql='SELECT r.id_reembolso,r.id_pagamento,r.id_usuario,r.chave_idempotencia,r.motivo,r.detalhes,r.dentro_prazo,r.termos_versao,r.valor_solicitado,r.valor_confirmado,r.status,r.provider_ref,r.compensacao_status,r.solicitado_em,r.prazo_resposta_em,r.respondido_em,p.valor AS pagamento_valor,p.status AS pagamento_status,p.transacao_id,p.id_pedido,p.id_cobranca,i.provider AS pagamento_provider,i.provider_ref AS pagamento_provider_ref FROM reembolso_solicitacoes r JOIN pagamentos p ON p.id_pagamento=r.id_pagamento LEFT JOIN pagamento_intencoes i ON i.id_intencao=p.id_intencao WHERE r.id_reembolso=?';
    return {
        async payment(id,c=database,lock=false){if(lock&&!await one(c,'SELECT id_pagamento FROM pagamentos WHERE id_pagamento=? FOR UPDATE',[id]))return null;return one(c,paymentSql,[id]);},
        async refund(id,c=database,lock=false){if(lock&&!await one(c,'SELECT id_reembolso FROM reembolso_solicitacoes WHERE id_reembolso=? FOR UPDATE',[id]))return null;return one(c,refundSql,[id]);},
        byKey:(owner,key,c)=>one(c,'SELECT id_reembolso FROM reembolso_solicitacoes WHERE id_usuario=? AND chave_idempotencia=?',[owner,key]),
        confirmed:(paymentId,c)=>one(c,"SELECT COALESCE(SUM(valor_confirmado),0) AS total FROM reembolso_solicitacoes WHERE id_pagamento=? AND status='CONFIRMADA'",[paymentId]),
        async insert(c,d){const [r]=await c.execute('INSERT INTO reembolso_solicitacoes(id_pagamento,id_usuario,chave_idempotencia,motivo,detalhes,dentro_prazo,termos_versao,valor_solicitado,status,prazo_resposta_em) VALUES(?,?,?,?,?,?,?,?,?,UTC_TIMESTAMP(3)+INTERVAL 5 DAY) ON DUPLICATE KEY UPDATE id_reembolso=LAST_INSERT_ID(id_reembolso)',[d.paymentId,d.owner,d.key,d.reason,d.details,d.within,d.termsVersion,d.amount,d.status]);return {id:idString(r.insertId),created:r.affectedRows===1};},
        sent:(c,id)=>c.execute("UPDATE reembolso_solicitacoes SET status='ENVIADA' WHERE id_reembolso=? AND status='RECEBIDA'",[id]),
        reference:(c,id,ref)=>c.execute('UPDATE reembolso_solicitacoes SET provider_ref=? WHERE id_reembolso=? AND provider_ref IS NULL',[ref,id]),
        decision:(c,id,status,amount,version,basis)=>c.execute('UPDATE reembolso_solicitacoes SET status=?,valor_solicitado=?,termos_versao=?,decisao_fundamento=?,respondido_em=UTC_TIMESTAMP(3) WHERE id_reembolso=? AND status=?',[status,amount,version,basis,id,'EM_ANALISE']),
        failed:(c,id)=>c.execute("UPDATE reembolso_solicitacoes SET status='FALHOU',respondido_em=UTC_TIMESTAMP(3) WHERE id_reembolso=? AND status='ENVIADA'",[id]),
        async confirmedRefund(c,r,amount,total){
            await c.execute("UPDATE reembolso_solicitacoes SET status='CONFIRMADA',valor_confirmado=?,respondido_em=UTC_TIMESTAMP(3),compensacao_status='PENDENTE' WHERE id_reembolso=? AND status='ENVIADA'",[amount,r.id_reembolso]);
            await c.execute('UPDATE pagamentos SET status=? WHERE id_pagamento=?',[total===r.pagamento_valor?'ESTORNADO':'PARCIALMENTE_ESTORNADO',r.id_pagamento]);
        },
        plan:(id,c,lock=false)=>one(c,`SELECT id_assinatura,id_usuario,inicio,status,renovacao_automatica FROM assinaturas WHERE id_assinatura=?${lock?' FOR UPDATE':''}`,[id]),
        latestPlanPayment:(id,owner,c)=>one(c,"SELECT p.id_pagamento FROM pagamentos p JOIN assinatura_cobrancas ac ON ac.id_cobranca=p.id_cobranca WHERE ac.id_assinatura=? AND ac.id_usuario=? AND p.status IN ('APROVADO','PARCIALMENTE_ESTORNADO') ORDER BY p.data_pagamento DESC,p.id_pagamento DESC LIMIT 1",[id,owner]),
        cancelPlan:(c,id)=>c.execute("UPDATE assinaturas SET status='CANCELADA',renovacao_automatica=FALSE,fim=UTC_DATE() WHERE id_assinatura=? AND status IN ('ATIVA','PENDENTE')",[id])
    };
}
