import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

// Scanner restrito de statements MySQL: mantém strings/backticks e remove comentários.
// Só usado nas fontes revisadas deste manifest, nunca SQL ou nomes recebidos por HTTP.
export function splitSql(source) {
    let text = '', quote = null;
    const result = [];
    for (let i = 0; i < source.length; i++) {
        const c = source[i], n = source[i + 1];
        if (quote) {
            text += c;
            if (c === '\\') text += source[++i] ?? '';
            else if (c === quote && n === quote) text += source[++i];
            else if (c === quote) quote = null;
            continue;
        }
        if (['\'', '"', '`'].includes(c)) { quote = c; text += c; }
        else if (c === '-' && n === '-') { while (i < source.length && source[i] !== '\n') i++; text += '\n'; }
        else if (c === '/' && n === '*') { i += 2; while (i < source.length && !(source[i] === '*' && source[i + 1] === '/')) i++; i++; text += ' '; }
        else if (c === ';') { if (text.trim()) result.push(text.trim()); text = ''; }
        else text += c;
    }
    if (quote) throw new Error('SQL com string incompleta');
    if (text.trim()) result.push(text.trim());
    return result;
}

export async function migrationPlan() {
    const sources = [
        ['20261001_02_create_tables.sql', sql => /^(CREATE TABLE|CREATE INDEX)\b/i.test(sql)],
        ['20261001_03_create_table_logs.sql', sql => /^(CREATE TABLE|CREATE INDEX)\b/i.test(sql)],
        ['20261001_04_update_alter_table_fornecedores.sql', () => true],
        ['20261006_alter_table_filmes.sql', sql => /^(ALTER TABLE|CREATE TABLE|INSERT INTO (filmes_imagens|newsletter_categorias))\b/i.test(sql)],
        ['20261006_01_infrastructure_events.sql', () => true],
        ['20261008_01_identity.sql', () => true],
        ['20261008_02_identity_guard.sql', () => true],
        ['20261008_03_catalog_genres.sql', () => true],
        ['20261008_04_team_entries.sql', () => true],
        ['20261008_05_internal_tasks.sql', () => true],
        ['20261008_06_notification_dedupe.sql', () => true],
        ['20261008_07_supplier_cnpj.sql', () => true],
        ['20261008_08_supplier_products.sql', () => true],
        ['20261008_09_combo_location.sql', () => true],
        ['20261009_10_inventory_reservations.sql', () => true],
        ['20261009_11_supply_logistics.sql', () => true],
        ['20261009_12_pricing.sql', () => true],
        ['20261009_13_payment_methods.sql', () => true],
        ['20261009_14_payments.sql', () => true]
    ];
    const plan = [];
    for (const [file, filter] of sources) {
        const text = await readFile(new URL(`../migrations/${file}`, import.meta.url), 'utf8');
        let index = 0;
        for (const sql of splitSql(text).filter(filter)) {
            if (!/^(CREATE TABLE|CREATE INDEX|ALTER TABLE|INSERT INTO)\b/i.test(sql) || sql.includes(' ?')) throw new Error('Statement não aprovado');
            plan.push({ name: `${file}:${++index}`, sql, checksum: createHash('sha256').update(sql).digest('hex') });
        }
    }
    return plan;
}
