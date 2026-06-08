const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const axios = require('axios'); // Mantido e configurado para o PIX Asaas

const app = express();
app.use(express.json());
app.use(cors({ origin: '*', methods: ['GET', 'POST'], credentials: true }));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });

// --- CONFIGURAÇÕES DO ASAAS ---
// Altere para 'https://api.asaas.com/v3' quando for para produção (dinheiro real)
const ASAAS_API_URL = process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3'; 
const ASAAS_API_KEY = process.env.ASAAS_API_KEY || 'SUA_API_KEY_DO_ASAAS_AQUI';

let codigosValidos = {};
let filas = { solo: [], duo: [], squad: [] };
let lojaDinamica = { skins: [], weapons: [] };

io.on('connection', (socket) => {
    // Envia os itens novos da loja pro jogador assim que ele conecta
    socket.emit('atualizar_loja_dinamica', lojaDinamica);

    socket.on('buscar_partida', (dados) => {
        const modo = dados.modo;
        const maxPlayers = modo === 'solo' ? 2 : (modo === 'duo' ? 4 : 8);
        filas[modo].push({ id: socket.id, nick: dados.nick });

        if (filas[modo].length >= maxPlayers) {
            const jogadoresSala = filas[modo].splice(0, maxPlayers);
            const salaId = "SALA_REAL_" + Date.now();
            const timeA = jogadoresSala.slice(0, maxPlayers / 2).map(p => p.id);
            const timeB = jogadoresSala.slice(maxPlayers / 2).map(p => p.id);
            jogadoresSala.forEach(p => io.to(p.id).emit('partida_encontrada', { sala: salaId, modo, timeA, timeB }));
        } else {
            setTimeout(() => {
                const index = filas[modo].findIndex(p => p.id === socket.id);
                if (index !== -1) {
                    const p = filas[modo].splice(index, 1)[0];
                    io.to(p.id).emit('partida_encontrada', { sala: "SALA_BOTS_" + Date.now(), modo, timeA: [p.id], timeB: [] });
                }
            }, 10000);
        }
    });

    socket.on('cancelar_busca', () => { ['solo', 'duo', 'squad'].forEach(m => filas[m] = filas[m].filter(p => p.id !== socket.id)); });
    socket.on('enviar_mensagem', (msg) => { io.emit('nova_mensagem', msg); });
    socket.on('disconnect', () => { ['solo', 'duo', 'squad'].forEach(m => filas[m] = filas[m].filter(p => p.id !== socket.id)); });
});

// --- ROTAS DO PAINEL DE DONO ---
app.post('/admin/gerar-codigo', (req, res) => {
    const { diamantes } = req.body;
    const codigo = "X7-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    codigosValidos[codigo] = diamantes;
    res.json({ sucesso: true, codigo });
});

app.post('/admin/dar-vip', (req, res) => {
    const { nick } = req.body;
    io.emit('forcar_vip', { nick }); 
    res.json({ sucesso: true });
});

app.post('/admin/banir', (req, res) => {
    const { nick } = req.body;
    io.emit('jogador_banido', { nick });
    res.json({ sucesso: true });
});

app.post('/admin/add-loja', (req, res) => {
    const { tipo, id, nome, preco } = req.body;
    lojaDinamica[tipo].push({ id, name: nome, price: preco });
    io.emit('atualizar_loja_dinamica', lojaDinamica);
    res.json({ sucesso: true });
});

// --- ROTAS DO JOGO ---
app.post('/jogo/resgatar-codigo', (req, res) => {
    const { codigo } = req.body;
    if (codigosValidos[codigo]) {
        const dimas = codigosValidos[codigo];
        delete codigosValidos[codigo];
        res.json({ sucesso: true, diamantesGanhos: dimas });
    } else {
        res.json({ sucesso: false, erro: "Código inválido!" });
    }
});

// --- CONEXÃO REAL COM O PIX ASAAS ---
app.post('/gerar-pix', async (req, res) => { 
    const { valor, nome, cpfCnpj } = req.body;

    // Validação básica para não quebrar a API do Asaas
    if (!valor || !nome || !cpfCnpj) {
        return res.status(400).json({ sucesso: false, erro: "Campos valor, nome e cpfCnpj são obrigatórios." });
    }

    try {
        // 1. Criar o cliente no Asaas (Exigido para gerar cobranças)
        const clienteResponse = await axios.post(`${ASAAS_URL}/customers`, {
            name: nome,
            cpfCnpj: cpfCnpj
        }, {
            headers: { 'access_token': ASAAS_API_KEY }
        });

        const clienteId = clienteResponse.data.id;

        // 2. Criar a cobrança do tipo PIX
        const hoje = new Date();
        const dataVencimento = hoje.toISOString().split('T')[0]; // Formato YYYY-MM-DD

        const cobrancaResponse = await axios.post(`${ASAAS_URL}/payments`, {
            customer: clienteId,
            billingType: "PIX",
            value: valor,
            dueDate: dataVencimento
        }, {
            headers: { 'access_token': ASAAS_API_KEY }
        });

        const cobrancaId = cobrancaResponse.data.id;

        // 3. Buscar a chave Copia e Cola e o QR Code gerado
        const pixResponse = await axios.get(`${ASAAS_URL}/payments/${cobrancaId}/pixQrCode`, {
            headers: { 'access_token': ASAAS_API_KEY }
        });

        // Responde de volta para o jogo com os dados reais
        res.json({ 
            sucesso: true,
            copia_e_cola: pixResponse.data.payload,
            qrcode_base64: pixResponse.data.encodedImage, // Opcional se o jogo aceitar exibir imagem em Base64
            cobranca_id: cobrancaId
        }); 

    } catch (error) {
        console.error("Erro ao gerar PIX no Asaas:", error.response?.data || error.message);
        res.status(500).json({ 
            sucesso: false, 
            erro: "Erro interno ao processar o pagamento com o Asaas.",
            detalhes: error.response?.data?.errors || error.message
        });
    }
});

// Ping de conexão (Para o jogo não dar "Offline" falso)
app.get('/status', (req, res) => { res.json({ status: 'online' }); });

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log(`Servidor Free X7 Online na porta ${PORT}`)); 
