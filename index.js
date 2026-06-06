const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: { origin: '*' }
});

app.use(express.json());
app.use(cors());
app.use(express.static(__dirname));

const ASAAS_API_KEY = process.env.ASAAS_API_KEY; 

const asaasInstance = axios.create({
    baseURL: 'https://www.asaas.com/api/v3', 
    headers: { 'access_token': ASAAS_API_KEY }
});

// --- BANCO DE DADOS EM MEMÓRIA E CONTADORES ---
const historicoChat = []; 
const codigosDisponiveis = {}; 
let filaMatchmaking = []; 
let salasPvP = {};        

let proximoIdDisponivel = 1;

let jogadoresServidor = {
    "0000000001": { nick: "EliasX7", id: "0000000001", email: "eliasadmin@gmail.com", isVIP: true, statusBan: "✅ Limpo" }
};

const SENHA_DONO = "080907"; 

app.get('/painel', (req, res) => {
    res.sendFile(path.join(__dirname, 'painel.html'));
});

// ==========================================
// 🔥 CENTRAL DE COMANDOS DO PAINEL (CORRIGIDA) 🔥
// ==========================================
app.post('/admin/buscar-jogador', (req, res) => {
    const { senha, busca } = req.body;
    
    if (senha !== SENHA_DONO) {
        return res.status(403).json({ sucesso: false, erro: "Senha mestra inválida!" });
    }

    // Procura por ID ou por NICK (ignorando letras maiúsculas/minúsculas)
    let jogadorEncontrado = jogadoresServidor[busca];
    if (!jogadorEncontrado) {
        jogadorEncontrado = Object.values(jogadoresServidor).find(j => j.nick && j.nick.toLowerCase() === busca.toLowerCase());
    }

    if (jogadorEncontrado) {
        res.json({ sucesso: true, jogador: jogadorEncontrado });
    } else {
        res.status(404).json({ sucesso: false, erro: "Jogador não encontrado! Peça para ele entrar na tela de servidores do jogo primeiro." });
    }
});

app.post('/admin/comando', (req, res) => {
    const { senha, comando, idJogador } = req.body;
    
    if (senha !== SENHA_DONO) {
        return res.status(403).json({ sucesso: false, erro: "Senha mestra inválida!" });
    }

    if (!jogadoresServidor[idJogador]) {
        return res.status(404).json({ sucesso: false, erro: "ID não encontrado na memória do servidor." });
    }

    if (comando === 'VIP') {
        jogadoresServidor[idJogador].isVIP = true;
        // Manda o aviso direto pro celular do jogador pra tela dele brilhar
        io.emit('promover_vip', jogadoresServidor[idJogador].email);
    }
    if (comando === 'BAN_PERM') jogadoresServidor[idJogador].statusBan = "⛔ BANIDO PARA SEMPRE";
    if (comando === 'MUTE') jogadoresServidor[idJogador].statusBan = "Submetido a Silêncio (24h)";
    if (comando === 'LIMPAR') {
        jogadoresServidor[idJogador].isVIP = false;
        jogadoresServidor[idJogador].statusBan = "✅ Limpo";
    }

    console.log(`[PAINEL] ${comando} aplicado no jogador: ${jogadoresServidor[idJogador].nick}`);
    res.json({ sucesso: true, mensagem: `Operação [${comando}] aplicada com sucesso no jogador ${jogadoresServidor[idJogador].nick}!` });
});

app.post('/jogo/gerar-id-unico', (req, res) => {
    proximoIdDisponivel++;
    let idFormatado = String(proximoIdDisponivel).padStart(10, '0');
    res.json({ sucesso: true, idGerado: idFormatado });
});

app.post('/jogo/sincronizar', (req, res) => {
    const { id, nick, email } = req.body;
    
    if (id && nick) {
        if (!jogadoresServidor[id]) {
            jogadoresServidor[id] = { nick: nick, id: id, email: email || "", isVIP: false, statusBan: "✅ Limpo" };
        } else {
            jogadoresServidor[id].nick = nick; 
            if(email) jogadoresServidor[id].email = email;
        }
        res.json({ sucesso: true });
    } else {
        res.status(400).json({ erro: "Dados incompletos" });
    }
});

// ==========================================
// 🔥 MATCHMAKING E SALAS (CORRIGIDO PARA 2x2 E 4x4) 🔥
// ==========================================
io.on('connection', (socket) => {
    socket.emit('historico_chat', historicoChat);
    
    socket.on('sincronizar_dados', (dadosUser) => {
        if (dadosUser && dadosUser.id && jogadoresServidor[dadosUser.id]) {
            jogadoresServidor[dadosUser.id].socketId = socket.id;
        }
    });

    socket.on('enviar_mensagem', (dados) => {
        let jogadorEncontrado = Object.values(jogadoresServidor).find(j => j.nick.toLowerCase() === dados.nick.toLowerCase());
        if (jogadorEncontrado && jogadorEncontrado.statusBan !== "✅ Limpo") return; 

        let jogadorEVip = jogadorEncontrado ? jogadorEncontrado.isVIP : false;
        const mensagem = { nick: dados.nick, texto: dados.texto, isVIP: jogadorEVip, hora: new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute:'2-digit' }) };
        
        console.log(`💬 [CHAT] ${mensagem.hora} - ${mensagem.nick}: ${mensagem.texto}`);
        historicoChat.push(mensagem);
        if(historicoChat.length > 30) historicoChat.shift(); 
        io.emit('nova_mensagem', mensagem);
    });

    socket.on('buscar_partida', (dados) => {
        console.log(`🔍 Fila: ${dados.nick} buscando modo ${dados.modo.toUpperCase()}`);
        
        filaMatchmaking = filaMatchmaking.filter(p => p.id !== socket.id);
        filaMatchmaking.push({
            id: socket.id, nick: dados.nick, isVIP: dados.isVIP, servidor: dados.servidor, modo: dados.modo
        });

        let candidatos = filaMatchmaking.filter(p => p.servidor === dados.servidor && p.modo === dados.modo);

        // 🔥 REGRA INTELIGENTE DE EQUIPES
        let qtdNecessaria = 2; // Solo (1x1)
        if (dados.modo === 'duo') qtdNecessaria = 4; // Duo (2x2)
        if (dados.modo === 'squad') qtdNecessaria = 8; // Squad (4x4)

        if (candidatos.length >= qtdNecessaria) {
            let jogadoresSelecionados = candidatos.slice(0, qtdNecessaria);
            
            // Remove os selecionados da fila global
            filaMatchmaking = filaMatchmaking.filter(p => !jogadoresSelecionados.map(j => j.id).includes(p.id));

            let idDaSala = `SALA_${dados.modo.toUpperCase()}_${Date.now()}`;
            salasPvP[idDaSala] = { jogadores: {}, modo: dados.modo };

            // Coloca os jogadores na mesma sala virtual
            jogadoresSelecionados.forEach((jogadorDaVez, index) => {
                io.sockets.sockets.get(jogadorDaVez.id)?.join(idDaSala);
                // Define as equipes (A e B)
                let equipeDele = (index % 2 === 0) ? 'A' : 'B';
                console.log(`🎮 ${jogadorDaVez.nick} entrou na sala ${idDaSala} - EQUIPE ${equipeDele}`);
            });

            io.to(idDaSala).emit('partida_encontrada', { sala: idDaSala });
            console.log(`🚀 Partida iniciada! MODO: ${dados.modo.toUpperCase()} | Sala: ${idDaSala}`);
        }
    });

    socket.on('cancelar_busca', () => {
        filaMatchmaking = filaMatchmaking.filter(p => p.id !== socket.id);
    });

    socket.on('movimento_pvp', (dados) => {
        const sala = dados.sala;
        if (salasPvP[sala]) {
            salasPvP[sala].jogadores[socket.id] = {
                x: dados.x, y: dados.y, facing: dados.facing, hp: dados.hp, nick: dados.nick, isVIP: dados.isVIP, frameIndex: dados.frameIndex, skinId: dados.skinId
            };
            io.to(sala).emit('posicoes_jogadores', salasPvP[sala].jogadores);
        }
    });

    socket.on('disconnect', () => {
        filaMatchmaking = filaMatchmaking.filter(p => p.id !== socket.id);
        Object.keys(salasPvP).forEach(sala => {
            if (salasPvP[sala].jogadores[socket.id]) {
                delete salasPvP[sala].jogadores[socket.id];
                io.to(sala).emit('posicoes_jogadores', salasPvP[sala].jogadores);
            }
        });
    });
});

app.post('/painel/gerar-codigo', (req, res) => {
    const { senha, tetoDiamantes } = req.body;
    if (senha !== SENHA_DONO) return res.status(403).json({ erro: "Senha do painel incorreta!" });
    if (!tetoDiamantes || tetoDiamantes < 25) return res.status(400).json({ erro: "Mínimo de 25 diamantes." });

    const novoCodigo = "X7-" + Math.floor(100000 + Math.random() * 900000);
    codigosDisponiveis[novoCodigo] = { teto: parseInt(tetoDiamantes), usado: false };
    res.json({ sucesso: true, codigoGerado: novoCodigo });
});

app.post('/jogo/resgatar-codigo', (req, res) => {
    const { codigo } = req.body;
    const codigoFormatado = codigo.trim().toUpperCase();

    if (!codigosDisponiveis[codigoFormatado]) return res.status(404).json({ erro: "Código inválido!" });
    if (codigosDisponiveis[codigoFormatado].usado) return res.status(400).json({ erro: "Código já resgatado!" });

    const teto = codigosDisponiveis[codigoFormatado].teto;
    let min = 25;
    if (teto >= 1000) min = 100; else if (teto >= 500) min = 50;

    const dimasGanhos = Math.floor(Math.random() * (teto - min + 1)) + min;
    codigosDisponiveis[codigoFormatado].usado = true;
    delete codigosDisponiveis[codigoFormatado]; 

    res.json({ sucesso: true, diamantesGanhos: dimasGanhos });
});

app.post('/gerar-pix', async (req, res) => {
    const { Nick, valor, diamantes } = req.body;
    if (!valor || valor <= 0) return res.status(400).json({ erro: "Valor inválido." });

    try {
        const clienteResponse = await asaasInstance.post('/customers', { name: `Jogador: ${Nick}`, cpfCnpj: '01234567890', notificationDisabled: true });
        const cobranca = await asaasInstance.post('/payments', { customer: clienteResponse.data.id, billingType: 'PIX', value: valor, dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], description: `Free X7 - ${diamantes} Dimas` });
        const qrCodeResponse = await asaasInstance.get(`/payments/${cobranca.data.id}/pixQrCode`);
        res.json({ copia_e_cola: qrCodeResponse.data.payload, paymentId: cobranca.data.id });
    } catch (error) { res.status(500).json({ erro: "Erro Asaas API." }); }
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
    console.log(`🚀 Motor do Free X7 ligado na porta ${PORT}!`);
});
