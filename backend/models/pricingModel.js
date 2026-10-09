import { idString } from '../utils/dto.js';

const resources={
    inputs:{table:'insumos',key:'id_insumo',fields:['custo_receita','custo_parceria']},
    sessions:{table:'sessoes',key:'id_sessao',fields:['custo_local_dia','custo_exibicao']},
    films:{table:'filmes',key:'id_filme',fields:['custo_streaming_dia']},
    combos:{table:'combos',key:'id_combo',fields:['custo_operacional']},
    plans:{table:'planos',key:'id_plano',fields:['custo_beneficios_mensal','custo_beneficios_anual','combo_gratis_mes']}
};
export function createPricingModel(database){
    const rows=async(c,sql,args=[])=> (await c.execute(sql,args))[0];
    const one=async(c,sql,args=[])=> (await rows(c,sql,args))[0]??null;
    return {
        resource(kind,id,c=database,lock=false){const s=resources[kind];if(!s)throw new TypeError('Tipo inválido');return one(c,`SELECT ${s.key},${s.fields.join(',')} FROM ${s.table} WHERE ${s.key}=?${lock?' FOR UPDATE':''}`,[id]);},
        updateResource(c,kind,id,data){const s=resources[kind];if(!s||Object.keys(data).some(k=>!s.fields.includes(k))||!Object.keys(data).length)throw new TypeError('Campos inválidos');return c.execute(`UPDATE ${s.table} SET ${Object.keys(data).map(k=>`${k}=?`).join(',')} WHERE ${s.key}=?`,[...Object.values(data),id]);},
        parameter:(category,c=database,lock=false)=>one(c,`SELECT categoria,markup_bps,margem_alerta_bps,teto_desconto_bps,ocupacao_referencia,meia_projecao_bps,combo_passo_bps,atualizado_em FROM precificacao_parametros WHERE categoria=?${lock?' FOR UPDATE':''}`,[category]),
        parameters:(c=database)=>rows(c,'SELECT categoria,markup_bps,margem_alerta_bps,teto_desconto_bps,ocupacao_referencia,meia_projecao_bps,combo_passo_bps,atualizado_em FROM precificacao_parametros ORDER BY categoria'),
        updateParameter(c,category,d){const fields=['markup_bps','margem_alerta_bps','teto_desconto_bps','ocupacao_referencia','meia_projecao_bps','combo_passo_bps'];if(Object.keys(d).some(k=>!fields.includes(k))||!Object.keys(d).length)throw new TypeError('Campos inválidos');return c.execute(`UPDATE precificacao_parametros SET ${Object.keys(d).map(k=>`${k}=?`).join(',')} WHERE categoria=?`,[...Object.values(d),category]);},
        product(kind,id,c=database,lock=false){
            const queries={
                INPUT:'SELECT id_insumo AS id,preco AS published,custo_receita,custo_parceria,status,id_local FROM insumos WHERE id_insumo=?',
                SESSION:'SELECT s.id_sessao AS id,s.preco_inteira AS published,s.custo_local_dia,s.custo_exibicao,s.data,s.horario_inicio,s.horario_fim,s.status,a.capacidade FROM sessoes s JOIN salas a ON a.id_sala=s.id_sala WHERE s.id_sessao=?',
                RENTAL:'SELECT id_filme AS id,preco_aluguel AS published,custo_streaming_dia,dias_acesso_aluguel,status,disponivel_streaming FROM filmes WHERE id_filme=?',
                COMBO:'SELECT id_combo AS id,preco AS published,custo_operacional,ativo,id_local FROM combos WHERE id_combo=?',
                PLAN:'SELECT id_plano AS id,valor_mensal,valor_anual,custo_beneficios_mensal,custo_beneficios_anual,combo_gratis_mes,ativo FROM planos WHERE id_plano=?'
            };
            if(!queries[kind])throw new TypeError('Categoria inválida');return one(c,`${queries[kind]}${lock?' FOR UPDATE':''}`,[id]);
        },
        comboParts:(id,c=database)=>rows(c,'SELECT ci.id_insumo,ci.quantidade,i.custo_receita,i.custo_parceria,i.status FROM combo_itens ci JOIN insumos i ON i.id_insumo=ci.id_insumo WHERE ci.id_combo=? ORDER BY ci.id_insumo',[id]),
        referenced:(kind,id,c=database)=>{if(!['SESSION','COMBO'].includes(kind))return null;return one(c,`SELECT id_item FROM itens_pedido WHERE ${kind==='SESSION'?'id_sessao':'id_combo'}=? LIMIT 1`,[id]);},
        publishPrice(c,category,id,price,annual=null){
            const map={INPUT:['insumos','id_insumo','preco'],SESSION:['sessoes','id_sessao','preco_inteira'],RENTAL:['filmes','id_filme','preco_aluguel'],COMBO:['combos','id_combo','preco']};
            if(category==='PLAN')return c.execute('UPDATE planos SET valor_mensal=?,valor_anual=? WHERE id_plano=?',[price,annual,id]);
            const s=map[category];if(!s)throw new TypeError('Categoria inválida');
            return c.execute(`UPDATE ${s[0]} SET ${s[2]}=? WHERE ${s[1]}=?`,[price,id]);
        },
        activePromotions:(category,c=database)=>rows(c,"SELECT id_promocao,desconto_bps,publico_geral FROM promocoes_precificacao WHERE categoria=? AND ativo=TRUE AND inicio<=UTC_TIMESTAMP() AND fim>UTC_TIMESTAMP() ORDER BY id_promocao",[category]),
        promotion:(id,c=database,lock=false)=>one(c,`SELECT id_promocao,nome,categoria,desconto_bps,publico_geral,inicio,fim,ativo FROM promocoes_precificacao WHERE id_promocao=?${lock?' FOR UPDATE':''}`,[id]),
        promotions:(c=database)=>rows(c,'SELECT id_promocao,nome,categoria,desconto_bps,publico_geral,inicio,fim,ativo FROM promocoes_precificacao ORDER BY id_promocao DESC LIMIT 100'),
        async createPromotion(c,d){const [r]=await c.execute('INSERT INTO promocoes_precificacao(nome,categoria,desconto_bps,publico_geral,inicio,fim,ativo) VALUES(?,?,?,?,?,?,?)',[d.nome,d.categoria,d.desconto_bps,d.publico_geral,d.inicio,d.fim,d.ativo]);return idString(r.insertId);},
        updatePromotion(c,id,d){const allowed=['nome','desconto_bps','publico_geral','inicio','fim','ativo'];if(Object.keys(d).some(k=>!allowed.includes(k))||!Object.keys(d).length)throw new TypeError('Campos inválidos');return c.execute(`UPDATE promocoes_precificacao SET ${Object.keys(d).map(k=>`${k}=?`).join(',')} WHERE id_promocao=?`,[...Object.values(d),id]);},
        planBenefit:(planId,category,c=database)=>one(c,'SELECT id_plano,categoria,desconto_bps FROM plano_beneficios WHERE id_plano=? AND categoria=?',[planId,category]),
        planBenefits:(planId,c=database)=>rows(c,'SELECT id_plano,categoria,desconto_bps FROM plano_beneficios WHERE id_plano=? ORDER BY categoria',[planId]),
        setPlanBenefit:(c,planId,category,bps)=>c.execute('INSERT INTO plano_beneficios(id_plano,categoria,desconto_bps) VALUES(?,?,?) ON DUPLICATE KEY UPDATE desconto_bps=VALUES(desconto_bps)',[planId,category,bps]),
        activePlan:(userId,c=database)=>one(c,"SELECT a.id_plano,p.desconto FROM assinaturas a JOIN planos p ON p.id_plano=a.id_plano LEFT JOIN convites_plano v ON v.id_assinatura=a.id_assinatura AND v.id_usuario_convidado=? AND v.status='ACEITO' WHERE (a.id_usuario=? OR v.id_convite IS NOT NULL) AND a.status='ATIVA' AND p.ativo=TRUE AND a.inicio<=UTC_DATE() AND (a.fim IS NULL OR a.fim>=UTC_DATE()) AND EXISTS(SELECT 1 FROM assinatura_cobrancas ac WHERE ac.id_assinatura=a.id_assinatura AND ac.competencia=DATE_FORMAT(UTC_DATE(),'%Y-%m-01') AND ac.status IN ('PAGO','ISENTO')) ORDER BY a.id_assinatura DESC LIMIT 1",[userId,userId]),
        coupon:(code,c=database,lock=false)=>one(c,`SELECT id_cupom,codigo,desconto,validade,limite_uso,ativo FROM cupons WHERE codigo=?${lock?' FOR UPDATE':''}`,[code]),
        couponById:(id,c=database,lock=false)=>one(c,`SELECT id_cupom,codigo,desconto,validade,limite_uso,ativo FROM cupons WHERE id_cupom=?${lock?' FOR UPDATE':''}`,[id]),
        couponUses:(id,c=database)=>one(c,"SELECT COUNT(*) AS total FROM cupom_utilizacoes WHERE id_cupom=? AND (status='CONFIRMADO' OR (status='RESERVADO' AND expira_em>UTC_TIMESTAMP()))",[id]),
        coupons:(c=database)=>rows(c,'SELECT id_cupom,codigo,desconto,validade,limite_uso,ativo FROM cupons ORDER BY id_cupom DESC LIMIT 100'),
        async createCoupon(c,d){const [r]=await c.execute('INSERT INTO cupons(codigo,desconto,validade,limite_uso,ativo) VALUES(?,?,?,?,?)',[d.codigo,d.desconto,d.validade,d.limite_uso,d.ativo]);return idString(r.insertId);},
        updateCoupon(c,id,d){const allowed=['codigo','desconto','validade','limite_uso','ativo'];if(Object.keys(d).some(k=>!allowed.includes(k))||!Object.keys(d).length)throw new TypeError('Campos inválidos');return c.execute(`UPDATE cupons SET ${Object.keys(d).map(k=>`${k}=?`).join(',')} WHERE id_cupom=?`,[...Object.values(d),id]);},
        async recordCoupon(c,orderId,couponId,bps){await c.execute("INSERT INTO cupom_utilizacoes(id_pedido,id_cupom,desconto_bps,status,expira_em) VALUES(?,?,?,'RESERVADO',DATE_ADD(UTC_TIMESTAMP(),INTERVAL 15 MINUTE))",[orderId,couponId,bps]);},
        couponUsage:(orderId,c=database,lock=false)=>one(c,`SELECT id_pedido,id_cupom,status,expira_em FROM cupom_utilizacoes WHERE id_pedido=?${lock?' FOR UPDATE':''}`,[orderId]),
        setCouponUsage:(c,orderId,status)=>{if(!['CONFIRMADO','LIBERADO'].includes(status))throw new TypeError('Estado inválido');return c.execute('UPDATE cupom_utilizacoes SET status=?,expira_em=NULL WHERE id_pedido=?',[status,orderId]);},
        order:(id,c=database,lock=false)=>one(c,`SELECT id_pedido,id_usuario,status FROM pedidos WHERE id_pedido=?${lock?' FOR UPDATE':''}`,[id]),
        snapshot:(id,c=database)=>one(c,'SELECT id_pedido,snapshot,total FROM pedido_precificacao WHERE id_pedido=?',[id]),
        async insertSnapshot(c,orderId,quote){await c.execute('INSERT INTO pedido_precificacao(id_pedido,snapshot,total) VALUES(?,?,?)',[orderId,JSON.stringify(quote),quote.total]);}
    };
}
