const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const axios = require('axios');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: { origin: '*' }
});

app.use(express.json());
app.use(cors());

const ASAAS_API_KEY = process.env.ASAAS_API_KEY; 

const asaasInstance = axios.create({
    baseURL: 'https://www.asaas.com/api/v3', 
    headers: { 'access_token': ASAAS_API_KEY }
});

// --- BANCO DE DADOS EM MEMÓRIA ---
const historicoChat = []; 
const codigosDisponiveis = {}; // Guarda os códigos de diamantes criados por você

// SUA SENHA MESTRE PARA ENTRAR NO PAINEL E GERAR CÓDIGOS (Pode mudar se quiser)
const SENHA_DONO = "elias123"; 

// --- SISTEMA DE CHAT GLOBAL ---
io.on('connection', (socket) => {
    socket.emit('historico_chat', historicoChat);
    socket.on('enviar_mensagem', (dados) => {
        const mensagem = {
            nick: dados.nick,
            texto: dados.texto,
            hora: new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute:'2-digit' })
        };
        historicoChat.push(mensagem);
        if(historicoChat.length > 30) historicoChat.shift(); 
        io.emit('nova_mensagem', mensagem);
    });
});

// --- PAINEL DO DONO: ROTAS DO CÓDIGO PREMIADO ---

// 1. Rota para o Elias gerar os códigos
app.post('/painel/gerar-codigo', (req, res) => {
    const { senha, tetoDiamantes } = req.body;

    if (senha !== SENHA_DONO) {
        return res.status(403).json({ erro: "Senha do painel incorreta!" });
    }

    if (!tetoDiamantes || tetoDiamantes < 25) {
        return res.status(400).json({ erro: "O valor teto precisa ser de pelo menos 25 diamantes." });
    }

    // Gera um código aleatório tipo X7-123456
    const novoCodigo = "X7-" + Math.floor(100000 + Math.random() * 900000);
    
    // Salva no banco de dados do servidor
    codigosDisponiveis[novoCodigo] = {
        teto: parseInt(tetoDiamantes),
        usado: false
    };

    console.log(`👑 Elias gerou o código ${novoCodigo} com valor máximo de ${tetoDiamantes} dimas!`);
    return res.json({ sucesso: true, codigoGerado: novoCodigo });
});

// 2. Rota para o Jogador resgatar o código dentro do jogo
app.post('/jogo/resgatar-codigo', (req, res) => {
    const { codigo } = req.body;
    const codigoFormatado = codigo.trim().toUpperCase();

    // Verifica se o código existe ou se já foi usado
    if (!codigosDisponiveis[codigoFormatado]) {
        return res.status(404).json({ erro: "Código inválido ou inexistente!" });
    }
    if (codigosDisponiveis[codigoFormatado].usado) {
        return res.status(400).json({ erro: "Este código já foi resgatado por outro jogador!" });
    }

    const teto = codigosDisponiveis[codigoFormatado].teto;
    let min = 25;

    // Regra matemática: Se o teto for 1000, o mínimo vira 100. Se for 100, o mínimo é 25.
    if (teto >= 1000) min = 100;
    else if (teto >= 500) min = 50;

    // Sorteio do valor exato que o jogador vai ganhar (Variado entre o mínimo e o teto)
    const dimasGanhos = Math.floor(Math.random() * (teto - min + 1)) + min;

    // Queima o código para ninguém mais usar
    codigosDisponiveis[codigoFormatado].usado = true;
    delete codigosDisponiveis[codigoFormatado]; // Remove para economizar memória

    console.log(`🎁 Código ${codigoFormatado} resgatado! Jogador levou ${dimasGanhos} diamantes (Sorteio entre ${min} e ${teto}).`);
    return res.json({ sucesso: true, diamantesGanhos: dimasGanhos });
});


// --- ROTA 1: GERAR O PIX (ASAAS) ---
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

// --- ROTA 2: VERIFICA SE FOI PAGO ---
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

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
    console.log(`🚀 Servidor Fofoqueiro, Chat e Painel de Códigos rodando na porta ${PORT}`);
});
