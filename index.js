const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const axios = require('axios');
const cors = require('cors');
const app = express();
const server = http.createServer(app);

const io = new Server(server, { cors: { origin: '*' } });
app.use(express.json());
app.use(cors());

// ==========================================
// CONFIGURAÇÃO DO PIX REAL (ASAAS)
// ==========================================
// ATENÇÃO: Você precisa ir no painel do Render > Environment Variables e criar a variável ASAAS_API_KEY
const ASAAS_API_KEY = process.env.ASAAS_API_KEY; 
const asaasInstance = axios.create({
    baseURL: 'https://www.asaas.com/api/v3',
    headers: { 'access_token': ASAAS_API_KEY }
});

let filasBusca = { solo: [], duo: [], squad: [] };

io.on('connection', (socket) => {
    // 1. SISTEMA DE MATCHMAKING (MODOS DE JOGO)
    socket.on('buscar_partida', (dados) => {
        let modo = dados.modo;
        filasBusca[modo].push({ id: socket.id, nick: dados.nick });
        
        // Inicia o cronômetro de 10 segundos
        if (filasBusca[modo].length === 1) {
            setTimeout(() => {
                if (filasBusca[modo].length > 0) {
                    let salaId = 'SALA_X7_' + Date.now();
                    
                    // Libera a partida para quem estiver na fila (Inicia a Arena e os Bots)
                    filasBusca[modo].forEach((p) => {
                        io.to(p.id).emit('partida_encontrada', { 
                            sala: salaId, 
                            modo: modo, 
                            timeA: [filasBusca[modo][0].id] 
                        });
                    });
                    filasBusca[modo] = []; // Limpa a fila
                }
            }, 10000); // 10 segundos buscando oponente!
        }
    });

    // 2. SINCRONIZAÇÃO DE MOVIMENTO MULTIPLAYER
    socket.on('mover', (dados) => {
        socket.posicao = dados;
        let posicoes = {};
        io.sockets.sockets.forEach(s => { if(s.posicao) posicoes[s.id] = s.posicao; });
        io.emit('posicoes_jogadores', posicoes);
    });

    socket.on('enviar_mensagem', (msg) => io.emit('nova_mensagem', msg));

    socket.on('disconnect', () => {
        ['solo', 'duo', 'squad'].forEach(m => filasBusca[m] = filasBusca[m].filter(p => p.id !== socket.id));
    });
});

// ==========================================
// GERAÇÃO DE PIX REAL
// ==========================================
app.post('/gerar-pix', async (req, res) => {
    try {
        const { Nick, valor, diamantes } = req.body;
        
        // Se a chave não estiver no Render, ele avisa
        if (!ASAAS_API_KEY) {
            return res.status(400).json({ erro: "A Chave da API do Asaas não foi configurada no Servidor." });
        }

        // Gera o cliente
        const cliente = await asaasInstance.post('/customers', { name: Nick, cpfCnpj: '01234567890' });
        
        // Gera a cobrança
        const cobranca = await asaasInstance.post('/payments', { 
            customer: cliente.data.id, 
            billingType: 'PIX', 
            value: valor, 
            dueDate: '2026-12-31', 
            description: `Compra de ${diamantes} Diamantes - Free X7` 
        });
        
        // Pega o código Copia e Cola
        const qr = await asaasInstance.get(`/payments/${cobranca.data.id}/pixQrCode`);
        
        res.json({ copia_e_cola: qr.data.payload });
    } catch (e) {
        console.error("Erro Asaas:", e.response ? e.response.data : e.message);
        res.status(500).json({ erro: "Falha na API do Banco." });
    }
});

server.listen(10000, () => console.log("Servidor Online com Matchmaking, Modos e Pix Real!"));
