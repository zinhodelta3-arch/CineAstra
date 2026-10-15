// Receita Federal: 12 posições alfanuméricas (ASCII - 48) e dois DVs módulo 11.
const weights12 = [5,4,3,2,9,8,7,6,5,4,3,2];
const weights13 = [6,5,4,3,2,9,8,7,6,5,4,3,2];
const digit = (chars, weights) => { const remainder = chars.reduce((sum, char, i) => sum + (char.charCodeAt(0) - 48) * weights[i], 0) % 11; return remainder < 2 ? 0 : 11 - remainder; };
export function normalizeCnpj(value) {
    if (typeof value !== 'string' || !/^(?:[A-Za-z0-9]{12}\d{2}|[A-Za-z0-9]{2}\.[A-Za-z0-9]{3}\.[A-Za-z0-9]{3}\/[A-Za-z0-9]{4}-\d{2})$/.test(value.trim())) return null;
    const normalized = value.trim().replace(/[.\/-]/g, '').toUpperCase();
    const base = [...normalized.slice(0, 12)];
    const first = digit(base, weights12), second = digit([...base, String(first)], weights13);
    return normalized.endsWith(`${first}${second}`) ? normalized : null;
}
