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

// 🔥 CONTADOR GLOBAL DE IDs AUTOMÁTICOS
let proximoIdDisponivel = 1;

// Banco de dados em memória para os jogadores
let jogadoresServidor = {
    "0000000001": { nick: "EliasX7", id: "0000000001", email: "eliasadmin@gmail.com", isVIP: true, statusBan: "✅ Limpo" }
};

// 🔒 SENHA MESTRE DO PAINEL
const SENHA_DONO = "elias432132"; 

// --- ROTA PARA SERVIR O PAINEL HTML ---
app.get('/painel', (req, res) => {
    res.sendFile(path.join(__dirname, 'painel.html'));
});

// ==========================================
// 🔥 CENTRAL DE COMANDOS DO PAINEL 🔥
// ==========================================

// 1. Rota de Busca de Jogadores (ID ou Nick)
app.post('/admin/buscar-jogador', (req, res) => {
    const { senha, busca } = req.body;
    
    if (senha !== SENHA_DONO) {
        return res.status(403).json({ sucesso: false, erro: "Senha mestra inválida!" });
    }

    let jugador = jogadoresServidor[busca];
    
    if (!jugador) {
        jugador = Object.values(jogadoresServidor).find(j => j.nick && j.nick.toLowerCase() === busca.toLowerCase());
    }

    if (jugador) {
        res.json({ sucesso: true, jogador: jugador });
    } else {
        res.status(404).json({ sucesso: false, erro: "Jogador não encontrado no servidor! Peça para ele fazer login no jogo primeiro." });
    }
});

// 2. Rota para Executar as Punições ou dar VIP via Painel
app.post('/admin/comando', (req, res) => {
    const { senha, comando, idJogador } = req.body;
    
    if (senha !== SENHA_DONO) {
        return res.status(403).json({ sucesso: false, erro: "Senha mestra inválida!" });
    }

    console.log(`[ADMIN] Comando: ${command} para o ID: ${idJogador}`);
    
    if (!jogadoresServidor[idJogador]) {
        jogadoresServidor[idJogador] = { nick: "Jogador", id: idJogador, email: "vinculado@gmail.com", isVIP: false, statusBan: "✅ Limpo" };
    }

    if (comando === 'VIP') {
        jogadoresServidor[idJogador].isVIP = true;
        io.emit('promover_vip', jogadoresServidor[idJogador].email);
    }
    if (comando === 'BAN_PERM') jogadoresServidor[idJogador].statusBan = "⛔ BANIDO PARA SEMPRE";
    if (comando === 'MUTE') jogadoresServidor[idJogador].statusBan = "Submetido a Silêncio (24h)";
    if (comando === 'LIMPAR') {
        jogadoresServidor[idJogador].isVIP = false;
        jogadoresServidor[idJogador].statusBan = "✅ Limpo";
    }

    res.json({ sucesso: true, mensagem: `Operação [${comando}] aplicada com sucesso!` });
});

// ==========================================
// 🔥 GERADOR DE ID ÚNICO PARA NOVAS CONTAS 🔥
// ==========================================
app.post('/jogo/gerar-id-unico', (req, res) => {
    proximoIdDisponivel++;
    let idFormatado = String(proximoIdDisponivel).padStart(10, '0');
    res.json({ sucesso: true, idGerado: idFormatado });
});

// ==========================================
// 🔥 SINCRONIZAÇÃO DO JOGO COM O RENDER 🔥
// ==========================================
app.post('/jogo/sincronizar', (req, res) => {
    const { id, nick, email } = req.body;
    
    if (id && nick) {
        if (!jogadoresServidor[id]) {
            jogadoresServidor[id] = { nick: nick, id: id, email: email || "", isVIP: false, statusBan: "✅ Limpo" };
        } else {
            jogadoresServidor[id].nick = nick; 
            if(email) jogadoresServidor[id].email = email;
        }
        
        console.log(`[SYNC] Jogador Conectado: ${nick} (ID: ${id}) - VIP: ${jogadoresServidor[id].isVIP}`);
        
        res.json({ 
            sucesso: true, 
            isVIP: jogadoresServidor[id].isVIP,
            statusBan: jogadoresServidor[id].statusBan
        });
    } else {
        res.status(400).json({ erro: "Dados incompletos" });
    }
});

// ==========================================
// 🔥 SISTEMA MULTIPLAYER E CHAT (SOCKET.IO) 🔥
// ==========================================
io.on('connection', (socket) => {
    console.log(`📡 Aparelho conectado na rede: ${socket.id}`);
    socket.emit('historico_chat', historicoChat);
    
    socket.on('sincronizar_dados', (dadosUser) => {
        if (dadosUser && dadosUser.id) {
            if (jogadoresServidor[dadosUser.id]) {
                jogadoresServidor[dadosUser.id].socketId = socket.id;
            }
        }
    });

    socket.on('enviar_mensagem', (dados) => {
        let jogadorEncontrado = Object.values(jogadoresServidor).find(j => j.nick.toLowerCase() === dados.nick.toLowerCase());
        
        if (jogadorEncontrado && jogadorEncontrado.statusBan !== "✅ Limpo") {
            return; 
        }

        let jogadorEVip = jogadorEncontrado ? jogadorEncontrado.isVIP : false;

        const mensagem = {
            nick: dados.nick,
            texto: dados.texto,
            isVIP: jogadorEVip,
            hora: new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute:'2-digit' })
        };
        
        historicoChat.push(mensagem);
        if(historicoChat.length > 30) historicoChat.shift(); 
        
        io.emit('nova_mensagem', mensagem);
    });

    socket.on('buscar_partida', (dados) => {
        console.log(`🔍 Fila PvP: ${dados.nick} está procurando partida no modo ${dados.modo}`);
        
        filaMatchmaking = filaMatchmaking.filter(p => p.id !== socket.id);
        filaMatchmaking.push({
            id: socket.id,
            nick: dados.nick,
            isVIP: dados.isVIP,
            patente: dados.patente,
            servidor: dados.servidor,
            modo: dados.modo
        });

        let candidatos = filaMatchmaking.filter(p => p.servidor === dados.servidor && p.modo === dados.modo);

        if (candidatos.length >= 2) {
            let p1 = candidatos[0];
            let p2 = candidatos[1];

            filaMatchmaking = filaMatchmaking.filter(p => p.id !== p1.id && p.id !== p2.id);

            let nomeSala = `SALA_PVP_${p1.id.slice(0, 4)}_${p2.id.slice(0, 4)}`;
            salasPvP[nomeSala] = { jogadores: {}, tempo: 300 };

            io.sockets.sockets.get(p1.id)?.join(nomeSala);
            io.sockets.sockets.get(p2.id)?.join(nomeSala);

            io.to(nomeSala).emit('partida_encontrada', { sala: nomeSala });
            console.log(`🎮 Partida montada com sucesso na sala: ${nomeSala}`);
        }
    });

    socket.on('cancelar_busca', () => {
        filaMatchmaking = filaMatchmaking.filter(p => p.id !== socket.id);
    });

    socket.on('movimento_pvp', (dados) => {
        const sala = dados.sala;
        if (salasPvP[sala]) {
            salasPvP[sala].jogadores[socket.id] = {
                x: dados.x,
                y: dados.y,
                facing: dados.facing,
                hp: dados.hp,
                nick: dados.nick,
                isVIP: dados.isVIP,
                frameIndex: dados.frameIndex,
                skinId: dados.skinId
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

// --- GERADOR DE CÓDIGOS REAIS DO PAINEL ---
app.post('/painel/gerar-codigo', (req, res) => {
    const { senha, tetoDiamantes } = req.body;

    if (senha !== SENHA_DONO) {
        return res.status(403).json({ erro: "Senha do painel incorreta!" });
    }

    if (!tetoDiamantes || tetoDiamantes < 25) {
        return res.status(400).json({ erro: "O valor teto precisa ser de pelo menos 25 diamantes." });
    }

    const novoCodigo = "X7-" + Math.floor(100000 + Math.random() * 900000);
    
    codigosDisponiveis[novoCodigo] = {
        teto: parseInt(tetoDiamantes),
        usado: false
    };

    console.log(`👑 Admin gerou o código ${novoCodigo} (Teto: ${tetoDiamantes} dimas)`);
    return res.json({ sucesso: true, codigoGerado: novoCodigo });
});

// --- RESGATE DE CÓDIGOS PELO JOGO ---
app.post('/jogo/resgatar-codigo', (req, res) => {
    const { codigo } = req.body;
    const codigoFormatado = codigo.trim().toUpperCase();

    if (!codigosDisponiveis[codigoFormatado]) {
        return res.status(404).json({ erro: "Código inválido ou inexistente!" });
    }
    if (codigosDisponiveis[codigoFormatado].usado) {
        return res.status(400).json({ erro: "Este código já foi resgatado!" });
    }

    const teto = codigosDisponiveis[codigoFormatado].teto;
    let min = 25;

    if (teto >= 1000) min = 100;
    else if (teto >= 500) min = 50;

    const dimasGanhos = Math.floor(Math.random() * (teto - min + 1)) + min;

    codigosDisponiveis[codigoFormatado].usado = true;
    delete codigosDisponiveis[codigoFormatado]; 

    console.log(`🎁 Código ${codigoFormatado} resgatado! Sorteado: ${dimasGanhos} diamantes.`);
    return res.json({ sucesso: true, diamantesGanhos: dimasGanhos });
});

// --- SISTEMA PIX AUTOMÁTICO (ASAAS) ---
app.post('/gerar-pix', async (req, res) => {
    console.log(`\n💸 Pedido de PIX de ${req.body.diamantes} dimas para ${req.body.Nick}`);
    const { Nick, valor, diamantes } = req.body;

    if (!valor || valor <= 0) {
        return res.status(400).json({ erro: "Valor inválido." });
    }

    try {
        const clienteResponse = await asaasInstance.post('/customers', {
            name: `Jogador: ${Nick}`,
            cpfCnpj: '01234567890',
            notificationDisabled: true
        });

        const cobranca = await asaasInstance.post('/payments', {
            customer: clienteResponse.data.id,
            billingType: 'PIX',
            value: valor,
            dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
            description: `Compra de ${diamantes} Diamantes - Free X7`
        });

        const paymentId = cobranca.data.id;
        const qrCodeResponse = await asaasInstance.get(`/payments/${paymentId}/pixQrCode`);

        return res.json({
            copia_e_cola: qrCodeResponse.data.payload,
            paymentId: paymentId 
        });

    } catch (error) {
        return res.status(500).json({ erro: "Erro Asaas API." });
    }
});

app.get('/conferir-pagamento/:id', async (req, res) => {
    const idDoPagamento = req.params.id;
    try {
        const response = await asaasInstance.get(`/payments/${idDoPagamento}`);
        const statusPagamento = response.data.status;
        
        if (statusPagamento === 'RECEIVED' || statusPagamento === 'CONFIRMED') {
            return res.json({ pago: true });
        } else {
            return res.json({ pago: false });
        }
    } catch (error) {
        return res.status(500).json({ erro: "Erro ao consultar Asaas." });
    }
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
    console.log(`🚀 Motor do Free X7 ligado e operando na porta ${PORT}!`);
});
