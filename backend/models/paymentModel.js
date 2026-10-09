import { idString } from '../utils/dto.js';

export function createPaymentModel(database){
    const rows=async(c,sql,args=[])=> (await c.execute(sql,args))[0];
    const one=async(c,sql,args=[])=> (await rows(c,sql,args))[0]??null;
    const projection='i.id_intencao,i.id_usuario,i.chave_idempotencia,i.id_pedido,i.id_cobranca,i.id_metodo,i.valor,i.estado,i.provider,i.provider_ref,i.moeda,i.ultimo_evento_em,m.provider AS metodo_provider,m.provider_token,m.ativo AS metodo_ativo,p.id_pagamento,p.status AS pagamento_status,p.transacao_id';
    const joins=' FROM pagamento_intencoes i JOIN metodos_pagamento m ON m.id_metodo=i.id_metodo LEFT JOIN pagamentos p ON p.id_intencao=i.id_intencao';
    return {
        intent:(id,c=database,lock=false)=>one(c,`SELECT ${projection}${joins} WHERE i.id_intencao=?${lock?' FOR UPDATE':''}`,[id]),
        byPayment:(id,c=database)=>one(c,`SELECT ${projection}${joins} WHERE p.id_pagamento=?`,[id]),
        async claim(c,intent,provider){
            await c.execute("UPDATE pagamento_intencoes SET estado='ENVIADA',provider=?,enviado_em=UTC_TIMESTAMP(3) WHERE id_intencao=? AND estado='PREPARADA'",[provider,intent.id_intencao]);
            const [r]=await c.execute("INSERT INTO pagamentos(id_pedido,id_cobranca,id_metodo,valor,status,id_intencao) VALUES(?,?,?,?, 'PENDENTE',?)",[intent.id_pedido,intent.id_cobranca,intent.id_metodo,intent.valor,intent.id_intencao]);
            return idString(r.insertId);
        },
        setReference:(c,id,ref)=>c.execute('UPDATE pagamento_intencoes SET provider_ref=? WHERE id_intencao=? AND provider_ref IS NULL AND estado=?',[ref,id,'ENVIADA']),
        event:(c,provider,eventId)=>one(c,'SELECT id_gateway_evento,id_intencao FROM pagamento_gateway_eventos WHERE provider=? AND evento_id=? FOR UPDATE',[provider,eventId]),
        async insertEvent(c,e,type){
            const [r]=await c.execute('INSERT INTO pagamento_gateway_eventos(provider,evento_id,id_intencao,tipo,status,valor,moeda,ocorrido_em) VALUES(?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE id_gateway_evento=LAST_INSERT_ID(id_gateway_evento)',[e.provider,e.eventId,e.intentionId,type,e.status,e.amount,e.currency,e.occurredSql]);
            return {id:idString(r.insertId),created:r.affectedRows===1};
        },
        async settle(c,intent,status,eventAt,reference){
            await c.execute('UPDATE pagamentos SET status=?,data_pagamento=CASE WHEN ?=? THEN UTC_TIMESTAMP() ELSE data_pagamento END,transacao_id=COALESCE(transacao_id,?) WHERE id_intencao=?',[status,status,'APROVADO',reference,intent.id_intencao]);
            await c.execute("UPDATE pagamento_intencoes SET estado='CONCILIADA',ultimo_evento_em=?,provider_ref=COALESCE(provider_ref,?) WHERE id_intencao=?",[eventAt,reference,intent.id_intencao]);
            if(status==='APROVADO'){
                if(intent.id_pedido)await c.execute("UPDATE pedidos SET status='PAGO' WHERE id_pedido=? AND status='AGUARDANDO_PAGAMENTO'",[intent.id_pedido]);
                else await c.execute("UPDATE assinatura_cobrancas SET status='PAGO',data_pagamento=UTC_TIMESTAMP() WHERE id_cobranca=? AND status IN ('PENDENTE','ATRASADO')",[intent.id_cobranca]);
            }
        },
        markObserved:(c,id,eventAt)=>c.execute('UPDATE pagamento_intencoes SET ultimo_evento_em=? WHERE id_intencao=?',[eventAt,id])
    };
}
