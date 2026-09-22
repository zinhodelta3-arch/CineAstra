import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Importar ROTAS

// Importar middlewares
import { logMiddleware } from './middlewares/logMiddleware';
import { errorMiddleware } from './middlewares/errorMiddleware';

//Careggar .env
dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//configurações server
const PORT = process.env.PORT || 3000;

//middlewares globais

app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin'}
}))

// Configuração CORS global
app.use(cors({
    origin: '*', // Permitir todas as origens. Ajuste conforme necessário. Ex.: 'http://meufrontend.com'
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Métodos permitidos
    allowedHeaders: ['Content-Type', 'Authorization'], // Cabeçalhos permitidos
    preflightContinue: false, // Não passar para o próximo middleware
    optionsSuccessStatus: 200 // Responder com 200 para requisições OPTIONS
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//servir arquivos estáticos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

//middleare de log
app.use(logMiddleware);

//Rotas api use
//exemplo:
app.use('/api/auth', authRotas);

//rota raiz
app.get('/', (req, res) => {
    res.json({
        sucesso: true,
        mensagem: 'API de gestão para loja de roupas',
        versao: '0.0.1',
        rotas: {
            autenticacao: '/api/auth',
            produtos: '/api/produtos',
            categorias: '/api/categorias',
            subcategorias: '/api/subcategorias',
            cores: '/api/cores',
            tamanhos: '/api/tamanhos',
            modelos: '/api/modelos'
        },
        documentacao: {
            login: 'POST /api/auth/login',
            registrar: 'POST /api/auth/registrar'
        }
    })
})

//rota não encontrada
app.use('*', (req, res) => {
    res.status(404).json({
        sucesso: false,
        erro: 'página não encontrada',
        mensagem: `a rota ${req.method} ${req.originalUrl} não foi encontrada`
    })
})

//middleware de erro
app.use(errorMiddleware);

//iniciar servidor
app.listen(PORT, () => {
    console.log(`acesse http://localhost:${PORT}`);
    console.log('API de gestão para loja de roupas')
    console.log(`ambiente: ${process.env.NODE_ENV || 'development'}`)
})

export default app;