const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors({ origin: '*', methods: ['GET', 'POST'], credentials: true }));

const server = http.createServer(app);

const io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
});

// Banco de dados em memória (limpa quando o servidor reinicia)
let codigosValidos = {};
let filas = { solo: [], duo: [], squad: [] };

io.on('connection', (socket) => {
    console.log(`Jogador conectado: ${socket.id}`);

    // Sistema de Matchmaking
    socket.on('buscar_partida', (dados) => {
        const modo = dados.modo;
        const maxPlayers = modo === 'solo' ? 2 : (modo === 'duo' ? 4 : 8);
        filas[modo].push({ id: socket.id, nick: dados.nick });

        if (filas[modo].length >= maxPlayers) {
            const jogadoresSala = filas[modo].splice(0, maxPlayers);
            const salaId = "SALA_REAL_" + Date.now();
            const timeA = jogadoresSala.slice(0, maxPlayers / 2).map(p => p.id);
            const timeB = jogadoresSala.slice(maxPlayers / 2).map(p => p.id);
            
            jogadoresSala.forEach(p => {
                io.to(p.id).emit('partida_encontrada', { sala: salaId, modo: modo, timeA: timeA, timeB: timeB });
            });
        } else {
            // Se ninguém entrar em 10s, cria a sala com Bots
            setTimeout(() => {
                const index = filas[modo].findIndex(p => p.id === socket.id);
                if (index !== -1) {
                    const p = filas[modo].splice(index, 1)[0];
                    io.to(p.id).emit('partida_encontrada', { sala: "SALA_BOTS_" + Date.now(), modo: modo, timeA: [p.id], timeB: [] });
                }
            }, 10000);
        }
    });

    socket.on('cancelar_busca', () => {
        ['solo', 'duo', 'squad'].forEach(modo => {
            filas[modo] = filas[modo].filter(p => p.id !== socket.id);
        });
    });

    socket.on('enviar_mensagem', (msg) => {
        io.emit('nova_mensagem', msg);
    });

    socket.on('disconnect', () => {
        ['solo', 'duo', 'squad'].forEach(modo => {
            filas[modo] = filas[modo].filter(p => p.id !== socket.id);
        });
    });
});

// --- API DO PAINEL ADMIN ---

// Gerar Código de Diamante
app.post('/admin/gerar-codigo', (req, res) => {
    const { diamantes } = req.body;
    const codigo = "X7-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    codigosValidos[codigo] = diamantes;
    res.json({ sucesso: true, codigo: codigo });
});

// Ativar VIP pelo Nick (O servidor avisa o jogo)
app.post('/admin/dar-vip', (req, res) => {
    const { nick } = req.body;
    io.emit('forcar_vip', { nick: nick }); 
    res.json({ sucesso: true });
});

// Resgate do jogador
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

// Rota do PIX (Mantida por segurança)
app.post('/gerar-pix', async (req, res) => {
    res.json({ copia_e_cola: "00020126360014br.gov.bcb.pix0114+5511999999999520400005303986540510.005802BR5915Free X7 Teste6009Sao Paulo62070503***63041234" });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
    console.log(`Servidor Free X7 Online na porta ${PORT}`);
});
