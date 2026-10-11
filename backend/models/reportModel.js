const rows=async(c,sql,args)=>(await c.execute(sql,args))[0];
const one=async(c,sql,args)=>(await rows(c,sql,args))[0]??null;
const scope={ALL:'',ORDERS:' AND p.id_pedido IS NOT NULL',SUBSCRIPTIONS:' AND p.id_cobranca IS NOT NULL'};
const where=(scopeName)=>{if(!Object.hasOwn(scope,scopeName))throw new TypeError('Escopo inválido');return scope[scopeName];};
export function createReportModel(){return {
    payments:(c,q,start,end)=>one(c,`SELECT COUNT(*) AS captures,COUNT(DISTINCT p.id_pedido) AS orders,COUNT(DISTINCT p.id_cobranca) AS charges,COALESCE(SUM(p.valor),0) AS gross FROM pagamentos p WHERE p.data_pagamento>=? AND p.data_pagamento<? AND p.status IN ('APROVADO','PARCIALMENTE_ESTORNADO','ESTORNADO')${where(q.scope)}`,[start,end]),
    refunds:(c,q,start,end)=>one(c,`SELECT COUNT(*) AS refunds,COALESCE(SUM(r.valor_confirmado),0) AS refunded FROM reembolso_solicitacoes r JOIN pagamentos p ON p.id_pagamento=r.id_pagamento WHERE r.respondido_em>=? AND r.respondido_em<? AND r.status='CONFIRMADA' AND r.valor_confirmado IS NOT NULL${where(q.scope)}`,[start,end]),
    costs:(c,start,end)=>one(c,`SELECT COUNT(DISTINCT pp.id_pedido) AS snapshot_orders,
      COALESCE(SUM(CASE WHEN j.cost IS NOT NULL AND j.quantity>0 THEN j.cost*j.quantity ELSE 0 END),0) AS known_cost,
      COALESCE(SUM(CASE WHEN j.cost IS NULL OR j.quantity IS NULL OR j.quantity<=0 THEN 1 ELSE 0 END),0) AS missing_cost_lines,
      COALESCE(SUM(CASE WHEN LOWER(j.below_margin) IN ('true','1') THEN 1 ELSE 0 END),0) AS margin_alert_lines,
      COALESCE(SUM(CASE WHEN LOWER(j.projected_below_margin) IN ('true','1') THEN 1 ELSE 0 END),0) AS projected_margin_alert_lines
      FROM (SELECT DISTINCT p.id_pedido FROM pagamentos p WHERE p.id_pedido IS NOT NULL AND p.data_pagamento>=? AND p.data_pagamento<? AND p.status IN ('APROVADO','PARCIALMENTE_ESTORNADO','ESTORNADO')) paid
      JOIN pedido_precificacao pp ON pp.id_pedido=paid.id_pedido LEFT JOIN JSON_TABLE(pp.snapshot,'$.lines[*]' COLUMNS(
        cost DECIMAL(10,2) PATH '$.cost' NULL ON EMPTY,
        quantity INT PATH '$.quantity' NULL ON EMPTY,
        below_margin VARCHAR(5) PATH '$.belowMargin' NULL ON EMPTY,
        projected_below_margin VARCHAR(5) PATH '$.projectedBelowMargin' NULL ON EMPTY
      )) j ON TRUE`,[start,end]),
    audit:(c,q,start,end)=>rows(c,`SELECT id_auditoria,id_usuario,aggregate_id,event_type,occurred_at,request_id FROM auditoria_eventos WHERE occurred_at>=? AND occurred_at<?${q.cursor?' AND id_auditoria<?':''}${q.actorId?' AND id_usuario=?':''}${q.eventType?' AND event_type=?':''} ORDER BY id_auditoria DESC LIMIT ?`,[start,end,...(q.cursor?[q.cursor]:[]),...(q.actorId?[q.actorId]:[]),...(q.eventType?[q.eventType]:[]),q.limit+1]),
    http:(c,q,start,end)=>rows(c,`SELECT id_log,id_usuario,rota,metodo,status_code,tempo_resposta_ms,data_hora FROM logs WHERE data_hora>=? AND data_hora<?${q.cursor?' AND id_log<?':''}${q.actorId?' AND id_usuario=?':''}${q.status?' AND status_code=?':''} ORDER BY id_log DESC LIMIT ?`,[start,end,...(q.cursor?[q.cursor]:[]),...(q.actorId?[q.actorId]:[]),...(q.status?[q.status]:[]),q.limit+1])
};}
