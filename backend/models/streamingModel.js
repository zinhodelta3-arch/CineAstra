import {idString} from '../utils/dto.js';

const one=async(c,sql,args=[])=> (await c.execute(sql,args))[0][0]??null;
const rows=async(c,sql,args=[])=> (await c.execute(sql,args))[0];
export function createStreamingModel(){return {
    sellableFilm:(c,id)=>one(c,'SELECT status,disponivel_streaming,url_reproducao FROM filmes WHERE id_filme=?',[id]),
    orderItems:(c,orderId)=>rows(c,`SELECT ip.id_item,ip.id_filme,ip.tipo_streaming,ip.dias_acesso_aluguel_snapshot,p.id_usuario,p.status AS pedido_status
        FROM itens_pedido ip JOIN pedidos p ON p.id_pedido=ip.id_pedido WHERE ip.id_pedido=? AND ip.id_filme IS NOT NULL ORDER BY ip.id_item`,[orderId]),
    clock:(c)=>one(c,'SELECT UTC_TIMESTAMP(3) AS agora'),
    existing:(c,itemId)=>one(c,'SELECT id_acesso,id_usuario,id_filme,status FROM acessos_streaming WHERE id_item=? FOR UPDATE',[itemId]),
    async grant(c,item,userId,at){
        const expiry=item.tipo_streaming==='ALUGUEL'?`DATE_ADD(?, INTERVAL ? DAY)`:'NULL';
        const args=[item.id_item,userId,item.id_filme,at,...(item.tipo_streaming==='ALUGUEL'?[at,item.dias_acesso_aluguel_snapshot]:[])];
        const [r]=await c.execute(`INSERT INTO acessos_streaming(id_item,id_usuario,id_filme,data_inicio,data_expiracao,status) VALUES(?,?,?, ?,${expiry},'ATIVO')`,args);
        return idString(r.insertId);
    },
    owned:(c,id,userId)=>one(c,`SELECT a.id_acesso,a.id_item,a.id_filme,a.id_usuario,a.data_inicio,a.data_expiracao,a.status,
        ip.tipo_streaming,p.status AS pedido_status,f.status AS filme_status,f.disponivel_streaming,f.classificacao,f.url_reproducao
        FROM acessos_streaming a JOIN itens_pedido ip ON ip.id_item=a.id_item JOIN pedidos p ON p.id_pedido=ip.id_pedido
        JOIN filmes f ON f.id_filme=a.id_filme WHERE a.id_acesso=? AND a.id_usuario=? AND p.id_usuario=?`,[id,userId,userId]),
    list:(c,userId,limit,cursor)=>rows(c,`SELECT a.id_acesso,a.id_item,a.id_filme,a.data_inicio,a.data_expiracao,a.status,ip.tipo_streaming,p.status AS pedido_status
        FROM acessos_streaming a JOIN itens_pedido ip ON ip.id_item=a.id_item JOIN pedidos p ON p.id_pedido=ip.id_pedido
        WHERE a.id_usuario=? AND p.id_usuario=? AND a.id_acesso>? ORDER BY a.id_acesso LIMIT ?`,[userId,userId,cursor,limit+1]),
    planFilm:(c,filmId)=>one(c,'SELECT id_filme,status,disponivel_streaming,classificacao,url_reproducao FROM filmes WHERE id_filme=?',[filmId]),
    planCandidates:(c,userId)=>rows(c,`SELECT a.id_assinatura,a.id_usuario,a.status,a.inicio,a.fim,a.tipo_divisao,a.suspenso_por_cobranca,a.contrato_snapshot,
        ap.status AS participante_status,ap.suspenso_por_cobranca AS participante_suspenso,
        (SELECT ac.status FROM assinatura_cobrancas ac WHERE ac.id_assinatura=a.id_assinatura AND ac.id_usuario=? ORDER BY ac.id_cobranca DESC LIMIT 1) AS cobranca_propria,
        (SELECT ac.status FROM assinatura_cobrancas ac WHERE ac.id_assinatura=a.id_assinatura AND ac.id_usuario=a.id_usuario ORDER BY ac.id_cobranca DESC LIMIT 1) AS cobranca_titular
        FROM assinaturas a LEFT JOIN assinatura_participantes ap ON ap.id_assinatura=a.id_assinatura AND ap.id_usuario=?
        WHERE a.id_usuario=? OR ap.id_usuario IS NOT NULL ORDER BY a.id_assinatura DESC`,[userId,userId,userId]),
    age:(c,userId)=>one(c,'SELECT faixa_etaria FROM verificacoes_idade WHERE id_usuario=? AND expiracao>UTC_TIMESTAMP(3) ORDER BY id_verificacao DESC LIMIT 1',[userId])
};}
