// Projeção mínima do usuário atual; sessão/revogação são resolvidas pelo provider de identidade.
export function createUserAccessModel(database) {
    return {
        async findById(id, { signal } = {}) {
            const [rows] = await database.execute('SELECT id_usuario, tipo_usuario, status FROM usuarios WHERE id_usuario = ? LIMIT 1', [id], { signal });
            return rows[0] ?? null;
        }
    };
}
