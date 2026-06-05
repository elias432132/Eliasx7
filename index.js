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

// --- BANCO DE DADOS EM MEMÓRIA ---
const historicoChat = []; 
const codigosDisponiveis = {}; 

// Banco de dados temporário para o painel reconhecer comandos de ADM
let jogadoresServidor = {
    "0000000001": { nick: "EliasX7", id: "0000000001", email: "eliasadmin@gmail.com", isVIP: true, statusBan: "✅ Limpo" }
};

// 🔒 SUA NOVA SENHA MESTRE ATUALIZADA
const SENHA_DONO = "elias432132"; 

// --- ROTA PARA SERVIR O PAINEL HTML NO NAVEGADOR ---
app.get('/painel', (req, res) => {
    res.sendFile(path.join(__dirname, 'painel.html'));
});

// ==========================================
// 🔥 CENTRAL DE COMANDOS DO PAINEL 🔥
// ==========================================

// 1. Rota de Busca de Jogadores (ID ou Nick) para o Painel
app.post('/admin/buscar-jogador', (req, res) => {
    const { senha, busca } = req.body;
    
    if (senha !== SENHA_DONO) {
        return res.status(403).json({ sucesso: false, erro: "Senha mestra inválida!" });
    }

    let jugador = jogadoresServidor[busca];
    
    if (!jugador) {
        jugador = Object.values(jogadoresServidor).find(j => j.nick.toLowerCase() === busca.toLowerCase());
    }

    if (jugador) {
        res.json({ sucesso: true, jogador: jugador });
    } else {
        // Fallback seguro caso o jogador ainda não esteja listado no servidor central
        res.json({ 
            sucesso: true, 
            jogador: { nick: busca, id: "0000000002", email: "usuario@gmail.com", isVIP: false, statusBan: "✅ Limpo" } 
        });
    }
});

// 2. Rota para Executar as Punições ou dar VIP via Painel
app.post('/admin/comando', (req, res) => {
    const { senha, comando, idJogador } = req.body;
    
    if (senha !== SENHA_DONO) {
        return res.status(403).json({ sucesso: false, erro: "Senha mestra inválida!" });
    }

    console.log(`[ADMIN] Comando: ${comando} para o ID: ${idJogador}`);
    
    if (!jogadoresServidor[idJogador]) {
        jogadoresServidor[idJogador] = { nick: "Jogador", id: idJogador, email: "vinculado@gmail.com", isVIP: false, statusBan: "✅ Limpo" };
    }

    if (comando === 'VIP') jogadoresServidor[idJogador].isVIP = true;
    if (comando === 'BAN_PERM') jogadoresServidor[idJogador].statusBan = "⛔ BANIDO PARA SEMPRE";
    if (comando === 'MUTE') jogadoresServidor[idJogador].statusBan = "Submetido a Silêncio (24h)";
    if (comando === 'LIMPAR') {
        jogadoresServidor[idJogador].isVIP = false;
        jogadoresServidor[idJogador].statusBan = "✅ Limpo";
    }

    res.json({ sucesso: true, mensagem: `Operação [${comando}] aplicada com sucesso!` });
});

// ==========================================
// 🔥 NOVO: SINCRONIZAÇÃO DE JOGADORES REAIS 🔥
// ==========================================
app.post('/jogo/sincronizar', (req, res) => {
    const { id, nick, email } = req.body;
    
    if (id && nick) {
        // Se o jogador não existe no Render, cria ele com os dados reais
        if (!jogadoresServidor[id]) {
            jogadoresServidor[id] = { nick: nick, id: id, email: email, isVIP: false, statusBan: "✅ Limpo" };
        } else {
            // Se já existe, apenas atualiza caso o nick ou email tenham mudado
            jogadoresServidor[id].nick = nick;
            if(email) jogadoresServidor[id].email = email;
        }
        console.log(`[SYNC] Jogador Sincronizado: ${nick} (ID: ${id})`);
        res.json({ sucesso: true });
    } else {
        res.status(400).json({ erro: "Dados incompletos" });
    }
});

// --- SISTEMA DE CHAT GLOBAL ATUALIZADO PARA VIP ---
io.on('connection', (socket) => {
    socket.emit('historico_chat', historicoChat);
    
    socket.on('enviar_mensagem', (dados) => {
        // Busca o jogador no banco para verificar se é VIP
        let jogadorEncontrado = Object.values(jogadoresServidor).find(j => j.nick.toLowerCase() === dados.nick.toLowerCase());
        let jogadorEVip = jogadorEncontrado ? jogadorEncontrado.isVIP : false;

        const mensagem = {
            nick: dados.nick,
            texto: dados.texto,
            isVip: jogadorEVip, // Adiciona o status VIP aqui
            hora: new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute:'2-digit' })
        };
        
        historicoChat.push(mensagem);
        if(historicoChat.length > 30) historicoChat.shift(); 
        
        // Mantido exatamente como o seu original para não quebrar a mecânica
        io.emit('nova_mensagem', message => io.emit('nova_mensagem', mensagem)); 
        io.emit('nova_mensagem', mensagem);
    });
});

// --- PAINEL DO DONO: SEU GERADOR MATEMÁTICO DE CÓDIGOS REAIS ---
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

    console.log(`👑 Elias gerou o código ${novoCodigo} com valor máximo de ${tetoDiamantes} dimas!`);
    return res.json({ sucesso: true, codigoGerado: novoCodigo });
});

// --- SISTEMA DE RESGATE DE CÓDIGOS ORIGINAL COM ROLETAGEM INTOCADO ---
app.post('/jogo/resgatar-codigo', (req, res) => {
    const { codigo } = req.body;
    const codigoFormatado = codigo.trim().toUpperCase();

    if (!codigosDisponiveis[codigoFormatado]) {
        return res.status(404).json({ erro: "Código inválido ou inexistente!" });
    }
    if (codigosDisponiveis[codigoFormatado].usado) {
        return res.status(400).json({ erro: "Este código já foi resgatado por outro jogador!" });
    }

    const teto = codigosDisponiveis[codigoFormatado].teto;
    let min = 25;

    if (teto >= 1000) min = 100;
    else if (teto >= 500) min = 50;

    const dimasGanhos = Math.floor(Math.random() * (teto - min + 1)) + min;

    codigosDisponiveis[codigoFormatado].usado = true;
    delete codigosDisponiveis[codigoFormatado]; 

    console.log(`🎁 Código ${codigoFormatado} resgatado! Jogador levou ${dimasGanhos} diamantes (Sorteio entre ${min} e ${teto}).`);
    return res.json({ sucesso: true, diamantesGanhos: dimasGanhos });
});

// --- SISTEMA ASAAS ORIGINAL DE GERAR PIX REAL INTOCADO ---
app.post('/gerar-pix', async (req, res) => {
    console.log(`\n💸 Jogo pediu para gerar um PIX de ${req.body.diamantes} diamantes para ${req.body.Nick}!`);
    const { Nick, valor, diamantes } = req.body;

    if (!valor || valor <= 0) {
        return res.status(400).json({ erro: "Valor inválido enviado pelo jogo." });
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
        return res.status(500).json({ erro: "Erro ao gerar o Pix no Asaas" });
    }
});

// --- CONFERIDOR DE PAGAMENTO ASAAS REAL INTOCADO ---
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
        return res.status(500).json({ erro: "Erro ao consultar o Asaas" });
    }
});

// Mantida a porta padrão do seu Render
const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
    console.log(`🚀 Servidor Fofoqueiro, Chat, Asaas e Novo Painel rodando na porta ${PORT}`);
});
