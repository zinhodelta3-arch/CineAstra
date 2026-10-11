import test from 'node:test';
import assert from 'node:assert/strict';
import {loadEnvironment} from '../../config/env.js';
import {createDatabase} from '../../config/database.js';
import {createNewsletterCampaignModel} from '../../models/newsletterCampaignModel.js';

loadEnvironment();
const enabled=process.env.RUN_MYSQL_TESTS==='true';
test('MySQL isolado: fila PROMOCOES seleciona só elegíveis, UNIQUE preserva ENVIADO', {skip:!enabled&&'RUN_MYSQL_TESTS/TEST_DB_* ausentes; requer banco _test isolado'},async()=>{
    const env=process.env;
    assert.notEqual(env.NODE_ENV,'production');
    assert.equal(env.TEST_DB_CONFIRMED_NON_PRODUCTION,'true');
    assert.match(env.TEST_DB_NAME??'',/^[a-zA-Z0-9_]+_test$/);
    assert.notEqual(env.TEST_DB_NAME,env.DB_NAME);
    for(const key of ['TEST_DB_HOST','TEST_DB_USER','TEST_DB_PASSWORD'])assert.ok(env[key],`${key} obrigatório`);
    const database=createDatabase({host:env.TEST_DB_HOST,port:Number(env.TEST_DB_PORT??3306),user:env.TEST_DB_USER,password:env.TEST_DB_PASSWORD,database:env.TEST_DB_NAME,timeout:5000,connectionLimit:1,queueLimit:5});
    try{await database.withConnection(async c=>{
        await c.execute('CREATE TEMPORARY TABLE newsletter_categorias (id_categoria INT PRIMARY KEY,ativo BOOLEAN) ENGINE=InnoDB');
        await c.execute('CREATE TEMPORARY TABLE newsletter_campanhas (id_campanha INT PRIMARY KEY,id_categoria INT,status VARCHAR(20)) ENGINE=InnoDB');
        await c.execute('CREATE TEMPORARY TABLE newsletter_inscritos (id_inscrito INT PRIMARY KEY,status VARCHAR(20),confirmado_em DATETIME NULL) ENGINE=InnoDB');
        await c.execute('CREATE TEMPORARY TABLE newsletter_preferencias (id_inscrito INT,id_categoria INT,aceita BOOLEAN,PRIMARY KEY(id_inscrito,id_categoria)) ENGINE=InnoDB');
        await c.execute('CREATE TEMPORARY TABLE newsletter_envios (id_envio BIGINT AUTO_INCREMENT PRIMARY KEY,id_campanha INT,id_inscrito INT,status VARCHAR(20) DEFAULT \'PENDENTE\',UNIQUE KEY (id_campanha,id_inscrito)) ENGINE=InnoDB');
        await c.execute('INSERT INTO newsletter_categorias VALUES (1,TRUE),(2,TRUE)');
        await c.execute("INSERT INTO newsletter_campanhas VALUES (7,1,'AGENDADA'),(8,2,'RASCUNHO')");
        await c.execute("INSERT INTO newsletter_inscritos VALUES (1,'ATIVO','2026-10-11 10:00:00'),(2,'ATIVO','2026-10-11 10:00:00'),(3,'PENDENTE',NULL),(4,'ATIVO',NULL),(5,'ATIVO','2026-10-11 10:00:00')");
        await c.execute('INSERT INTO newsletter_preferencias VALUES (1,1,TRUE),(2,2,TRUE),(3,1,TRUE),(4,1,TRUE),(5,1,FALSE)');
        const model=createNewsletterCampaignModel();
        await model.queue(c,'7');
        let [rows]=await c.execute('SELECT id_inscrito,status FROM newsletter_envios ORDER BY id_inscrito');
        assert.deepEqual(rows,[{id_inscrito:1,status:'PENDENTE'}]);
        await c.execute("UPDATE newsletter_envios SET status='ENVIADO' WHERE id_inscrito=1");
        await model.queue(c,'7');
        [rows]=await c.execute('SELECT id_inscrito,status FROM newsletter_envios');
        assert.deepEqual(rows,[{id_inscrito:1,status:'ENVIADO'}]);
        await model.queue(c,'8');
        const [[count]]=await c.execute('SELECT COUNT(*) AS total FROM newsletter_envios');
        assert.equal(Number(count.total),1);
    });}finally{await database.close();}
});
