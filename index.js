const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const axios = require('axios'); 

const app = express();
app.use(express.json());
app.use(cors({ origin: '*', methods: ['GET', 'POST'], credentials: true }));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });

// --- CONFIGURAÇÕES DO MERCADO PAGO ---
const MERCADOPG_TOKEN = process.env.MERCADOPG_TOKEN;

let codigosValidos = {};
let filas = { solo: [], duo: [], squad: [] };
let lojaDinamica = { skins: [], weapons: [] };

// Guarda todos os jogadores online pro painel do dono ler
let jogadoresGlobais = {}; 

io.on('connection', (socket) => {
    // Envia a loja assim que o cara conecta
    socket.emit('atualizar_loja_dinamica', lojaDinamica);

    // CORREÇÃO: Faltava o servidor escutar quando o jogo pedia a loja de novo!
    socket.on('pedir_loja_atualizada', () => {
        socket.emit('atualizar_loja_dinamica', lojaDinamica);
    });

    socket.on('registrar_nick', (nick) => {
        jogadoresGlobais[socket.id] = { id: socket.id, nick: nick };
    });

    socket.on('mensagem_para_dono', (texto) => {
        let nick = jogadoresGlobais[socket.id] ? jogadoresGlobais[socket.id].nick : "Desconhecido";
        io.emit('aviso_painel_admin', { id: socket.id, nick: nick, msg: texto });
    });

    socket.on('resposta_do_dono', (dados) => {
        io.to(dados.idDestino).emit('nova_mensagem_sistema', { msg: `👑 PROMOTOR RESPONDEU: ${dados.msg}` });
    });

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
    
    socket.on('disconnect', () => { 
        ['solo', 'duo', 'squad'].forEach(m => filas[m] = filas[m].filter(p => p.id !== socket.id)); 
        delete jogadoresGlobais[socket.id]; 
    });
});

app.get('/admin/jogadores', (req, res) => {
    res.json({ sucesso: true, lista: Object.values(jogadoresGlobais) });
});

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
    const { tipo, id, name, price, priceD, comportamento, config_frames } = req.body;
    if (!lojaDinamica[tipo]) lojaDinamica[tipo] = [];
    lojaDinamica[tipo] = lojaDinamica[tipo].filter(item => item.id !== id);

    lojaDinamica[tipo].push({ id, name, price, priceD, comportamento, config_frames });
    io.emit('atualizar_loja_dinamica', lojaDinamica);
    res.json({ sucesso: true });
});

app.get('/admin/loja', (req, res) => {
    res.json({ sucesso: true, itens: lojaDinamica.skins.concat(lojaDinamica.weapons) });
});

app.post('/admin/remover-loja', (req, res) => {
    const { id } = req.body;
    lojaDinamica.skins = lojaDinamica.skins.filter(item => item.id !== id);
    lojaDinamica.weapons = lojaDinamica.weapons.filter(item => item.id !== id);
    io.emit('atualizar_loja_dinamica', lojaDinamica);
    res.json({ sucesso: true });
});

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

app.post('/gerar-pix', async (req, res) => { 
    const { valor, nome, Nick, cpfCnpj } = req.body;
    const nomeComprador = nome || Nick;
    if (!valor || !nomeComprador) return res.status(400).json({ sucesso: false, erro: "Campos valor e nome são obrigatórios." });

    try {
        const emailGenerico = "jogador@freex7.com";
        const cpfGenerico = (cpfCnpj || "01234567890").replace(/\D/g, ''); 

        const dadosPagamento = {
            transaction_amount: Number(valor),
            description: `Compra de diamantes no Free X7 - ${nomeComprador}`,
            payment_method_id: "pix",
            payer: { email: emailGenerico, first_name: nomeComprador, identification: { type: "CPF", number: cpfGenerico } }
        };

        const mpResponse = await axios.post('https://api.mercadopago.com/v1/payments', dadosPagamento, {
            headers: { 'Authorization': `Bearer ${MERCADOPG_TOKEN}`, 'X-Idempotency-Key': `pix-${Date.now()}` }
        });

        const copiaECola = mpResponse.data.point_of_interaction?.transaction_data?.qr_code;
        const qrCodeBase64 = mpResponse.data.point_of_interaction?.transaction_data?.qr_code_base64;
        const cobrancaId = mpResponse.data.id;

        if (!copiaECola) throw new Error("Mercado Pago não retornou a chave PIX.");
        res.json({ sucesso: true, copia_e_cola: copiaECola, qrcode_base64: qrCodeBase64, cobranca_id: cobrancaId }); 
    } catch (error) {
        console.error("Erro ao gerar PIX no Mercado Pago:", error.response?.data || error.message);
        res.status(500).json({ sucesso: false, erro: "Erro interno no Mercado Pago." });
    }
});

app.get('/status', (req, res) => { res.json({ status: 'online' }); });

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log(`Servidor Free X7 Online na porta ${PORT}`));
