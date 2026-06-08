const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const app = express();
const server = http.createServer(app);

const io = new Server(server, { cors: { origin: '*' } });
app.use(express.json());
app.use(cors());

let codigosValidos = {}; 
let filas = { solo: [], duo: [], squad: [] };

io.on('connection', (socket) => {
    socket.on('buscar_partida', (dados) => {
        let modo = dados.modo; let maxPlayers = modo === 'solo' ? 2 : (modo === 'duo' ? 4 : 8);
        filas[modo].push({ id: socket.id, nick: dados.nick });

        if (filas[modo].length >= maxPlayers) {
            let jogadoresSala = filas[modo].splice(0, maxPlayers);
            let salaId = "SALA_REAL_" + Date.now();
            let timeA = jogadoresSala.slice(0, maxPlayers/2).map(p => p.id);
            let timeB = jogadoresSala.slice(maxPlayers/2).map(p => p.id);
            jogadoresSala.forEach(p => { io.to(p.id).emit('partida_encontrada', { sala: salaId, modo: modo, timeA: timeA, timeB: timeB }); });
        } else {
            setTimeout(() => {
                let index = filas[modo].findIndex(p => p.id === socket.id);
                if (index !== -1) {
                    let p = filas[modo].splice(index, 1)[0];
                    io.to(p.id).emit('partida_encontrada', { sala: "SALA_BOTS_" + Date.now(), modo: modo, timeA: [p.id], timeB: [] });
                }
            }, 10000); // 10 segundos espera players, se não achar bota IA
        }
    });

    socket.on('cancelar_busca', () => { ['solo', 'duo', 'squad'].forEach(modo => { filas[modo] = filas[modo].filter(p => p.id !== socket.id); }); });
    socket.on('enviar_mensagem', (msg) => { io.emit('nova_mensagem', msg); });
});

// ==========================================
// ROTAS DO PAINEL ADMIN (SISTEMA OPERACIONAL)
// ==========================================

// Rota do botão verde: Fabrica Código
app.post('/admin/gerar-codigo', (req, res) => {
    let { diamantes } = req.body;
    let codigo = "X7-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    codigosValidos[codigo] = diamantes;
    res.json({ sucesso: true, codigo: codigo });
});

// Rota do botão amarelo: Injeta VIP no jogador
app.post('/admin/dar-vip', (req, res) => {
    let { nick } = req.body;
    io.emit('forcar_vip', { nick: nick }); // Grita pro jogo inteiro quem virou VIP
    res.json({ sucesso: true });
});

// Rota do Jogo: Onde o player resgata o código
app.post('/jogo/resgatar-codigo', (req, res) => {
    let { codigo } = req.body;
    if (codigosValidos[codigo]) {
        let dimas = codigosValidos[codigo];
        delete codigosValidos[codigo]; 
        res.json({ sucesso: true, diamantesGanhos: dimas });
    } else {
        res.json({ sucesso: false, erro: "Código inválido ou já resgatado!" });
    }
});

app.post('/gerar-pix', async (req, res) => { res.json({ copia_e_cola: "00020126360014br.gov.bcb.pix0114+5511999999999520400005303986540510.005802BR5915Free X7 Teste6009Sao Paulo62070503***63041234" }); });

server.listen(10000, () => console.log("Servidor Free X7 Online e Conectado!"));
