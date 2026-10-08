import { idString } from '../utils/dto.js';
import { ApiError } from '../utils/ApiError.js';

const USER = 'id_usuario,nome,email,senha,cpf,telefone,data_nascimento,tipo_usuario,status,data_cadastro';
export const resources = Object.freeze({
    addresses: { table: 'enderecos', pk: 'id_endereco', fields: ['cep', 'logradouro', 'numero', 'complemento', 'bairro', 'cidade', 'estado', 'principal'] },
    contacts: { table: 'contatos', pk: 'id_contato', fields: ['tipo', 'valor', 'principal'] }
});
const preferences = ['tema', 'tamanho_fonte', 'alto_contraste', 'modo_acessibilidade', 'idioma', 'aparencia'];
export function createIdentityModel(database) {
    const rows = async (c, sql, values = []) => (await c.execute(sql, values))[0];
    const one = async (c, sql, values = []) => (await rows(c, sql, values))[0] ?? null;
    const insert = async (c, sql, values) => idString((await c.execute(sql, values))[0].insertId);
    function definition(kind) { if (!Object.hasOwn(resources, kind)) throw new TypeError('Recurso inválido'); return resources[kind]; }
    function assignments(input, allowed) {
        const keys = Object.keys(input);
        if (!keys.length || keys.some(k => !allowed.includes(k))) throw new TypeError('Campos inválidos');
        return [keys.map(k => `${k} = ?`).join(', '), keys.map(k => input[k])];
    }
    return {
        user: (id, c = database, lock = false) => one(c, `SELECT ${USER} FROM usuarios WHERE id_usuario = ?${lock ? ' FOR UPDATE' : ''}`, [id]),
        byEmail: email => one(database, `SELECT ${USER} FROM usuarios WHERE email_normalizado = ?`, [email]),
        createUser: (c, u) => insert(c, 'INSERT INTO usuarios (nome,email,cpf,data_nascimento,senha,tipo_usuario,status) VALUES (?,?,?,?,?,?,?)', [u.name, u.email, u.cpf, u.dateOfBirth, u.hash, u.role, u.status]),
        async updateUser(c, id, input) { const [set, values] = assignments(input, ['nome', 'email', 'telefone', 'senha', 'tipo_usuario', 'status']); await c.execute(`UPDATE usuarios SET ${set} WHERE id_usuario = ?`, [...values, id]); },
        async factors(c, id) { return rows(c, 'SELECT id_2fa,metodo,chave,ativo,ultimo_passo FROM autenticacao_2fa WHERE id_usuario = ? AND ativo = TRUE ORDER BY metodo FOR UPDATE', [id]); },
        async activateFactor(c, id, method, secret, step) { await c.execute('INSERT INTO autenticacao_2fa (id_usuario,metodo,chave,ativo,ultimo_passo) VALUES (?,?,?,TRUE,?) ON DUPLICATE KEY UPDATE chave = ?, ativo = TRUE, ultimo_passo = ?', [id, method, secret, step, secret, step]); },
        async step(c, id, step) { await c.execute('UPDATE autenticacao_2fa SET ultimo_passo = ? WHERE id_2fa = ?', [step, id]); },
        async disableFactor(c, id) { await c.execute('UPDATE autenticacao_2fa SET ativo = FALSE, chave = NULL, ultimo_passo = NULL WHERE id_usuario = ?', [id]); },
        createSession: (c, id, hash, expiry, verified) => insert(c, 'INSERT INTO sessoes_autenticacao (id_usuario,jti_hash,expiracao,two_factor_verified) VALUES (?,?,?,?)', [id, hash, expiry, verified]),
        session: (id, userId, hash, options) => database.execute('SELECT id_usuario,expiracao,revogada_em,two_factor_verified FROM sessoes_autenticacao WHERE id_sessao_auth = ? AND id_usuario = ? AND jti_hash = ?', [id, userId, hash], options).then(([r]) => r[0]),
        activeSession: (c, userId, sessionId) => one(c, 'SELECT expiracao,revogada_em,two_factor_verified FROM sessoes_autenticacao WHERE id_sessao_auth = ? AND id_usuario = ?', [sessionId, userId]),
        async adminGuard(c) { const [rows] = await c.execute('SELECT id FROM identity_admin_guard WHERE id = 1 FOR UPDATE'); if (rows.length !== 1) throw ApiError.indisponivel(); },
        adminCount: c => one(c, "SELECT COUNT(*) AS total FROM usuarios WHERE tipo_usuario = 'ADMIN' AND status = 'ATIVO'"),
        async revoke(c, id, sessionId = null) { await c.execute(`UPDATE sessoes_autenticacao SET revogada_em = UTC_TIMESTAMP(3) WHERE id_usuario = ? AND revogada_em IS NULL${sessionId ? ' AND id_sessao_auth = ?' : ''}`, sessionId ? [id, sessionId] : [id]); },
        challenge: (hash, c = database, lock = false) => one(c, `SELECT id_desafio,id_usuario,finalidade,metodo,codigo_hash,chave_pendente,expiracao,tentativas,consumido_em FROM desafios_2fa WHERE token_hash = ?${lock ? ' FOR UPDATE' : ''}`, [hash]),
        async createChallenge(c, id, d) { await c.execute('INSERT INTO desafios_2fa (id_usuario,token_hash,finalidade,metodo,chave_pendente,expiracao) VALUES (?,?,?,?,?,?)', [id, d.hash, d.purpose, d.method, d.secret ?? null, d.expiry]); },
        async challengeAttempt(c, id) { await c.execute('UPDATE desafios_2fa SET tentativas = tentativas + 1 WHERE id_desafio = ?', [id]); },
        async consumeChallenge(c, id) { await c.execute('UPDATE desafios_2fa SET consumido_em = UTC_TIMESTAMP(3), chave_pendente = NULL, codigo_hash = NULL WHERE id_desafio = ?', [id]); },
        async invalidateChallenges(c, id) { await c.execute('UPDATE desafios_2fa SET consumido_em = UTC_TIMESTAMP(3), chave_pendente = NULL, codigo_hash = NULL WHERE id_usuario = ? AND consumido_em IS NULL', [id]); },
        recovery: (hash, c = database, lock = false) => one(c, `SELECT id_recuperacao,id_usuario,expiracao,utilizado FROM recuperacao_senha WHERE token = ?${lock ? ' FOR UPDATE' : ''}`, [hash]),
        async invalidateRecovery(c, id) { await c.execute('UPDATE recuperacao_senha SET utilizado = TRUE WHERE id_usuario = ? AND utilizado = FALSE', [id]); },
        async createRecovery(c, id, hash, expiry) { await c.execute('INSERT INTO recuperacao_senha (id_usuario,token,expiracao) VALUES (?,?,?)', [id, hash, expiry]); },
        async consent(c, id, purpose, version, basis) { await c.execute('INSERT INTO consentimentos_usuario (id_usuario,finalidade,versao,base_legal) VALUES (?,?,?,?)', [id, purpose, version, basis]); },
        async age(c, id, proof) { await c.execute('INSERT INTO verificacoes_idade (id_usuario,faixa_etaria,referencia_provedor,verificado_em,expiracao) VALUES (?,?,?,?,?)', [id, proof.ageBand, proof.reference, proof.verifiedAt, proof.expiresAt]); },
        latestAge: (c, id) => one(c, 'SELECT faixa_etaria,expiracao FROM verificacoes_idade WHERE id_usuario = ? AND expiracao > UTC_TIMESTAMP(3) ORDER BY id_verificacao DESC LIMIT 1', [id]),
        async guardian(c, id, proof) { await c.execute('INSERT INTO responsaveis_usuario (id_menor,id_responsavel,referencia_prova) VALUES (?,?,?)', [id, proof.guardianId, proof.reference]); await c.execute('INSERT INTO controles_parentais (id_menor) VALUES (?)', [id]); },
        guardianLink: (c, guardianId, minorId) => one(c, "SELECT id_vinculo,id_menor,id_responsavel FROM responsaveis_usuario WHERE id_responsavel = ? AND id_menor = ? AND status = 'ATIVO' FOR UPDATE", [guardianId, minorId]),
        controls: (c, id) => one(c, 'SELECT compras_permitidas,assinaturas_permitidas,limite_minutos_diarios FROM controles_parentais WHERE id_menor = ?', [id]),
        async updateControls(c, id, input) { const [set, values] = assignments(input, ['compras_permitidas', 'assinaturas_permitidas', 'limite_minutos_diarios']); await c.execute(`UPDATE controles_parentais SET ${set} WHERE id_menor = ?`, [...values, id]); },
        authorize: (c, linkId, input) => insert(c, 'INSERT INTO autorizacoes_responsavel (id_vinculo,finalidade,referencia_operacao,expiracao) VALUES (?,?,?,?)', [linkId, input.purpose, input.operationReference, input.expiresAt]),
        getAuthorization: (c, linkId, id) => one(c, 'SELECT id_autorizacao AS id,finalidade AS purpose,referencia_operacao AS operationReference,expiracao FROM autorizacoes_responsavel WHERE id_autorizacao = ? AND id_vinculo = ? AND revogada_em IS NULL', [id, linkId]),
        authorization: (c, userId, purpose, ref) => one(c, `SELECT a.id_autorizacao FROM autorizacoes_responsavel a JOIN responsaveis_usuario r ON r.id_vinculo = a.id_vinculo JOIN usuarios u ON u.id_usuario = r.id_responsavel JOIN controles_parentais p ON p.id_menor = r.id_menor WHERE r.id_menor = ? AND r.status = 'ATIVO' AND u.status = 'ATIVO' AND a.finalidade = ? AND a.referencia_operacao = ? AND a.revogada_em IS NULL AND a.expiracao > UTC_TIMESTAMP(3) AND ((a.finalidade = 'COMPRA' AND p.compras_permitidas = TRUE) OR (a.finalidade = 'ASSINATURA' AND p.assinaturas_permitidas = TRUE)) LIMIT 1`, [userId, purpose, ref]),
        resource: (kind, id, userId, c = database) => { const d = definition(kind); return one(c, `SELECT ${d.pk},${d.fields.join(',')} FROM ${d.table} WHERE ${d.pk} = ? AND id_usuario = ?`, [id, userId]); },
        list: (kind, userId, limit, cursor, c = database) => { const d = definition(kind); return rows(c, `SELECT ${d.pk},${d.fields.join(',')} FROM ${d.table} WHERE id_usuario = ? AND ${d.pk} > ? ORDER BY ${d.pk} LIMIT ${limit + 1}`, [userId, cursor ?? '0']); },
        async clearPrincipal(c, kind, userId, type) { const d = definition(kind); await c.execute(`UPDATE ${d.table} SET principal = FALSE WHERE id_usuario = ?${kind === 'contacts' ? ' AND tipo = ?' : ''}`, kind === 'contacts' ? [userId, type] : [userId]); },
        addResource(c, kind, userId, input) { const d = definition(kind); assignments(input, d.fields); const keys = Object.keys(input); return insert(c, `INSERT INTO ${d.table} (id_usuario,${keys.join(',')}) VALUES (?,${keys.map(() => '?').join(',')})`, [userId, ...keys.map(k => input[k])]); },
        async patchResource(c, kind, id, userId, input) { const d = definition(kind); const [set, values] = assignments(input, d.fields); await c.execute(`UPDATE ${d.table} SET ${set} WHERE ${d.pk} = ? AND id_usuario = ?`, [...values, id, userId]); },
        async deleteResource(c, kind, id, userId) { const d = definition(kind); await c.execute(`DELETE FROM ${d.table} WHERE ${d.pk} = ? AND id_usuario = ?`, [id, userId]); },
        preferences: (id, c = database) => one(c, `SELECT ${preferences.join(',')} FROM preferencias_usuario WHERE id_usuario = ?`, [id]),
        async updatePreferences(c, id, input) { await c.execute('INSERT INTO preferencias_usuario (id_usuario) VALUES (?) ON DUPLICATE KEY UPDATE id_usuario = ?', [id, id]); const [set, values] = assignments(input, preferences); await c.execute(`UPDATE preferencias_usuario SET ${set} WHERE id_usuario = ?`, [...values, id]); },
        async privacyRequest(c, id) { await c.execute("INSERT INTO solicitacoes_privacidade (id_usuario,tipo) VALUES (?,'EXCLUSAO') ON DUPLICATE KEY UPDATE id_usuario = ?", [id, id]); return one(c, "SELECT id_solicitacao,status FROM solicitacoes_privacidade WHERE id_usuario = ? AND slot_aberto = 1", [id]); },
        privacyStatus: (c, id) => one(c, 'SELECT id_solicitacao,id_usuario,tipo,status,motivo_decisao,criada_em,encerrada_em FROM solicitacoes_privacidade WHERE id_solicitacao = ?', [id]),
        exportSection(c, id, section, limit, cursor) {
            if (section === 'guardians') return rows(c, 'SELECT id_vinculo AS id,id_menor,id_responsavel,status,criado_em,revogado_em FROM responsaveis_usuario WHERE (id_menor = ? OR id_responsavel = ?) AND id_vinculo > ? ORDER BY id_vinculo LIMIT ' + (limit + 1), [id, id, cursor ?? '0']);
            if (section === 'authorizations') return rows(c, 'SELECT a.id_autorizacao AS id,a.id_vinculo,a.finalidade,a.referencia_operacao,a.autorizada_em,a.expiracao,a.revogada_em FROM autorizacoes_responsavel a JOIN responsaveis_usuario r ON r.id_vinculo = a.id_vinculo WHERE (r.id_menor = ? OR r.id_responsavel = ?) AND a.id_autorizacao > ? ORDER BY a.id_autorizacao LIMIT ' + (limit + 1), [id, id, cursor ?? '0']);
            const sections = {
                consents: ['consentimentos_usuario', 'id_consentimento', 'finalidade,versao,base_legal,aceito_em,revogado_em'],
                age: ['verificacoes_idade', 'id_verificacao', 'faixa_etaria,verificado_em,expiracao'],
                privacy: ['solicitacoes_privacidade', 'id_solicitacao', 'tipo,status,criada_em,encerrada_em'],
                sessions: ['sessoes_autenticacao', 'id_sessao_auth', 'expiracao,revogada_em,two_factor_verified,criada_em'],
                factors: ['autenticacao_2fa', 'id_2fa', 'metodo,ativo'],
                recoveries: ['recuperacao_senha', 'id_recuperacao', 'expiracao,utilizado']
            };
            if (!Object.hasOwn(sections, section)) throw new TypeError('Seção inválida');
            const [table, pk, fields] = sections[section];
            return rows(c, `SELECT ${pk} AS id,${fields} FROM ${table} WHERE id_usuario = ? AND ${pk} > ? ORDER BY ${pk} LIMIT ${limit + 1}`, [id, cursor ?? '0']);
        }
    };
}
