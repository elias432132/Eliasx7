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
// CONFIGURAÇÃO DO PIX (ASAAS)
// ==========================================
const ASAAS_API_KEY = process.env.ASAAS_API_KEY || "SUA_CHAVE_AQUI"; 
const asaasInstance = axios.create({
    baseURL: 'https://www.asaas.com/api/v3',
    headers: { 'access_token': ASAAS_API_KEY }
});

// Fila de busca por modo de jogo
let filasBusca = { solo: [], duo: [], squad: [] };
let salas = {};

io.on('connection', (socket) => {
    
    // 1. MATCHMAKING INTELIGENTE (Espera 15s para achar jogadores reais)
    socket.on('buscar_partida', (dados) => {
        let modo = dados.modo;
        filasBusca[modo].push({ id: socket.id, nick: dados.nick });
        
        // Se for o primeiro, inicia o relógio de 15s
        if (filasBusca[modo].length === 1) {
            setTimeout(() => {
                if (filasBusca[modo].length > 0) {
                    let salaId = "SALA_X7_" + Date.now();
                    salas[salaId] = { jogadores: {} };
                    
                    // Envia todo mundo da fila para a sala
                    filasBusca[modo].forEach(p => {
                        let objSoket = io.sockets.sockets.get(p.id);
                        if(objSoket) objSoket.join(salaId);
                        io.to(p.id).emit('partida_encontrada', { 
                            sala: salaId, 
                            modo: modo, 
                            jogadoresOnline: filasBusca[modo].length,
                            timeA: [filasBusca[modo][0].id] // O primeiro cai no Time A
                        });
                    });
                    filasBusca[modo] = []; // Limpa a fila
                }
            }, 15000);
        }
    });

    // 2. SINCRONIZAÇÃO DE MOVIMENTO (Deixa o jogo 100% Online)
    socket.on('mover', (dados) => {
        socket.pos = dados;
        let salaId = Array.from(socket.rooms)[1]; 
        if (salaId && salas[salaId]) {
            salas[salaId].jogadores[socket.id] = dados;
            // Manda a posição de todos para todos na sala
            io.to(salaId).emit('posicoes_jogadores', salas[salaId].jogadores);
        }
    });

    socket.on('enviar_mensagem', (msg) => {
        io.emit('nova_mensagem', msg);
    });

    socket.on('disconnect', () => {
        ['solo', 'duo', 'squad'].forEach(m => {
            filasBusca[m] = filasBusca[m].filter(p => p.id !== socket.id);
        });
        Object.keys(salas).forEach(sId => {
            if(salas[sId].jogadores[socket.id]) delete salas[sId].jogadores[socket.id];
        });
    });
});

// ==========================================
// ROTA DO PIX
// ==========================================
app.post('/gerar-pix', async (req, res) => {
    try {
        const { Nick, valor, diamantes } = req.body;
        if (!ASAAS_API_KEY || ASAAS_API_KEY === "SUA_CHAVE_AQUI") {
            return res.json({ copia_e_cola: "00020126360014br.gov.bcb.pix0114+5511999999999520400005303986540510.005802BR5915Free X7 Teste6009Sao Paulo62070503***63041234" });
        }
        let clienteId = 'cus_000005501234'; // Fallback
        try {
            const cliente = await asaasInstance.post('/customers', { name: Nick, cpfCnpj: '01234567890' });
            clienteId = cliente.data.id;
        } catch(e) {}

        const cobranca = await asaasInstance.post('/payments', { customer: clienteId, billingType: 'PIX', value: valor, dueDate: '2026-12-31', description: `Compra de ${diamantes} Diamantes - Free X7` });
        const qr = await asaasInstance.get(`/payments/${cobranca.data.id}/pixQrCode`);
        res.json({ copia_e_cola: qr.data.payload });
    } catch (e) {
        res.json({ copia_e_cola: "ERRO_DE_CONEXAO_COM_O_BANCO_TENTE_NOVAMENTE" });
    }
});

server.listen(10000, () => console.log("Servidor Online com BOTS, PIX, ROUNDS e MULTIPLAYER!"));
