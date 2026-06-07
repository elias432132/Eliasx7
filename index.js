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

// Fila de jogadores reais
let filas = { solo: [], duo: [], squad: [] };

io.on('connection', (socket) => {
    
    socket.on('buscar_partida', (dados) => {
        let modo = dados.modo; // 'solo', 'duo' ou 'squad'
        let maxPlayers = modo === 'solo' ? 2 : (modo === 'duo' ? 4 : 8);
        
        // Adiciona o jogador à fila
        filas[modo].push({ id: socket.id, nick: dados.nick });

        // SE A SALA ENCHER COM JOGADORES REAIS (Seus amigos)
        if (filas[modo].length >= maxPlayers) {
            let jogadoresSala = filas[modo].splice(0, maxPlayers);
            let salaId = "SALA_REAL_" + Date.now();
            
            // Divide as equipas (Ex: no X1, 1 vai para a Equipa A e outro para a Equipa B)
            let timeA = jogadoresSala.slice(0, maxPlayers/2).map(p => p.id);
            let timeB = jogadoresSala.slice(maxPlayers/2).map(p => p.id);

            // Manda todos para a arena
            jogadoresSala.forEach(p => {
                io.to(p.id).emit('partida_encontrada', { sala: salaId, modo: modo, timeA: timeA, timeB: timeB });
            });
        } else {
            // SE O AMIGO NÃO ENTRAR, ESPERA 10 SEGUNDOS E PÕE BOTS
            setTimeout(() => {
                let index = filas[modo].findIndex(p => p.id === socket.id);
                if (index !== -1) {
                    // O jogador ainda está à espera. Vamos criar a sala com Bots!
                    let p = filas[modo].splice(index, 1)[0];
                    io.to(p.id).emit('partida_encontrada', { 
                        sala: "SALA_BOTS_" + Date.now(), 
                        modo: modo, 
                        timeA: [p.id], 
                        timeB: [] 
                    });
                }
            }, 10000); // 10000 milissegundos = 10 segundos de espera
        }
    });

    // Se o jogador cancelar a busca, sai da fila
    socket.on('cancelar_busca', () => {
        ['solo', 'duo', 'squad'].forEach(modo => {
            filas[modo] = filas[modo].filter(p => p.id !== socket.id);
        });
    });

    socket.on('enviar_mensagem', (msg) => {
        io.emit('nova_mensagem', msg);
    });
});

app.post('/gerar-pix', async (req, res) => {
    try {
        const { Nick, valor, diamantes } = req.body;
        
        if (!ASAAS_API_KEY || ASAAS_API_KEY === "SUA_CHAVE_AQUI") {
            return res.json({ copia_e_cola: "00020126360014br.gov.bcb.pix0114+5511999999999520400005303986540510.005802BR5915Free X7 Teste6009Sao Paulo62070503***63041234" });
        }

        const cliente = await asaasInstance.post('/customers', { name: Nick, cpfCnpj: '00000000000' });
        const cobranca = await asaasInstance.post('/payments', { customer: cliente.data.id, billingType: 'PIX', value: valor, dueDate: '2026-12-31', description: `Compra de ${diamantes} Diamantes - Free X7` });
        const qr = await asaasInstance.get(`/payments/${cobranca.data.id}/pixQrCode`);
        
        res.json({ copia_e_cola: qr.data.payload });
    } catch (e) {
        res.json({ copia_e_cola: "ERRO_DE_CONEXAO_COM_O_BANCO_TENTE_NOVAMENTE" });
    }
});

server.listen(10000, () => console.log("Servidor Online (Matchmaking + Bots + Pix)!"));
