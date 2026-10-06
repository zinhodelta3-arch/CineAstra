// Somente colunas confirmadas no schema v3. Sessão/revogação serão integradas no 02.
export function createUserAccessModel(database) {
    return {
        async findById(id, { signal } = {}) {
            const [rows] = await database.execute('SELECT id_usuario, tipo_usuario, status FROM usuarios WHERE id_usuario = ? LIMIT 1', [id], { signal });
            return rows[0] ?? null;
        }
    };
}
