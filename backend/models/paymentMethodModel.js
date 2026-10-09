import { idString } from '../utils/dto.js';

export function createPaymentMethodModel(database) {
    const rows = async (c, sql, values=[]) => (await c.execute(sql, values))[0];
    const one = async (c, sql, values=[]) => (await rows(c, sql, values))[0] ?? null;
    const fields = 'id_metodo,id_usuario,tipo,identificacao,principal,provider,provider_token,ativo';
    return {
        list: (owner,c=database) => rows(c,`SELECT ${fields} FROM metodos_pagamento WHERE id_usuario=? AND ativo=TRUE ORDER BY principal DESC,id_metodo DESC`,[owner]),
        method: (id,c=database,lock=false) => one(c,`SELECT ${fields} FROM metodos_pagamento WHERE id_metodo=?${lock?' FOR UPDATE':''}`,[id]),
        ownerMethods: (owner,c) => rows(c,`SELECT id_metodo FROM metodos_pagamento WHERE id_usuario=? AND ativo=TRUE ORDER BY id_metodo FOR UPDATE`,[owner]),
        async insert(c,owner,type,identification,provider,token,principal) {
            const [r]=await c.execute('INSERT INTO metodos_pagamento(id_usuario,tipo,identificacao,principal,provider,provider_token,ativo) VALUES(?,?,?,?,?,?,TRUE)',[owner,type,identification,principal,provider,token]);
            return idString(r.insertId);
        },
        clearPrincipal: (c,owner) => c.execute('UPDATE metodos_pagamento SET principal=FALSE WHERE id_usuario=? AND ativo=TRUE',[owner]),
        setPrincipal: (c,id,principal) => c.execute('UPDATE metodos_pagamento SET principal=? WHERE id_metodo=?',[principal,id]),
        archive: (c,id) => c.execute('UPDATE metodos_pagamento SET ativo=FALSE,principal=FALSE WHERE id_metodo=?',[id]),
        order: (id,c) => one(c,'SELECT id_pedido,id_usuario,valor_total,status FROM pedidos WHERE id_pedido=? FOR UPDATE',[id]),
        charge: (id,c) => one(c,'SELECT id_cobranca,id_usuario,valor_devido,valor_multa_aplicada,status FROM assinatura_cobrancas WHERE id_cobranca=? FOR UPDATE',[id]),
        intention: (owner,key,c) => one(c,'SELECT id_intencao,id_usuario,chave_idempotencia,id_pedido,id_cobranca,id_metodo,valor,estado FROM pagamento_intencoes WHERE id_usuario=? AND chave_idempotencia=? FOR UPDATE',[owner,key]),
        async insertIntention(c,d) {
            const [r]=await c.execute('INSERT INTO pagamento_intencoes(id_usuario,chave_idempotencia,id_pedido,id_cobranca,id_metodo,valor) VALUES(?,?,?,?,?,?) ON DUPLICATE KEY UPDATE id_intencao=LAST_INSERT_ID(id_intencao)',[d.owner,d.key,d.orderId,d.chargeId,d.methodId,d.amount]);
            return {id:idString(r.insertId),created:r.affectedRows===1};
        }
    };
}
