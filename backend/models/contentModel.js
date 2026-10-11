export function createContentModel(){return {
    async current(c,slug){const [rows]=await c.execute('SELECT id_conteudo,slug,versao,titulo,corpo,fonte,publicado_em FROM conteudos_publicados WHERE slug=? ORDER BY id_conteudo DESC LIMIT 1',[slug]);return rows[0]??null;},
    async publish(c,input,adminId){const [result]=await c.execute('INSERT INTO conteudos_publicados(slug,versao,titulo,corpo,fonte,id_publicador) VALUES(?,?,?,?,?,?)',[input.slug,input.version,input.title,JSON.stringify(input.body),input.source,adminId]);return String(result.insertId);},
    async saveContract(c,orderId,hash,snapshot){await c.execute('INSERT INTO pedido_contratos(id_pedido,oferta_hash,contrato_snapshot) VALUES(?,?,?)',[orderId,hash,JSON.stringify(snapshot)]);},
    async ownContract(c,orderId,userId){const [rows]=await c.execute('SELECT pc.oferta_hash,pc.contrato_snapshot,pc.aceito_em FROM pedido_contratos pc JOIN pedidos p ON p.id_pedido=pc.id_pedido WHERE pc.id_pedido=? AND p.id_usuario=?',[orderId,userId]);return rows[0]??null;}
};}
