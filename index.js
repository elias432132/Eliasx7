const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const axios = require('axios'); // Mantido para o seu PIX Asaas

const app = express();
app.use(express.json());
app.use(cors({ origin: '*', methods: ['GET', 'POST'], credentials: true }));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });

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

// O Seu PIX intacto (Ele responde aqui para o jogo)
app.post('/gerar-pix', async (req, res) => { 
    res.json({ copia_e_cola: "00020126360014br.gov.bcb.pix0114+5511999999999520400005303986540510.005802BR5915Free X7 Teste6009Sao Paulo62070503***63041234" }); 
});

// Ping de conexão (Para o jogo não dar "Offline" falso)
app.get('/status', (req, res) => { res.json({ status: 'online' }); });

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log(`Servidor Free X7 Online na porta ${PORT}`));
