const express = require('express');
const http = require('http'); // Adicionado para o Chat
const { Server } = require('socket.io'); // Adicionado para o Chat
const axios = require('axios');
const cors = require('cors');

const app = express();
const server = http.createServer(app); // Necessário para o Chat funcionar junto com as rotas

// Configura o servidor de Chat Global (WebSockets)
const io = new Server(server, {
    cors: { origin: '*' } // Permite que seu jogo conecte de qualquer lugar
});

app.use(express.json());
app.use(cors());

const ASAAS_API_KEY = process.env.ASAAS_API_KEY; 

const asaasInstance = axios.create({
    baseURL: 'https://www.asaas.com/api/v3', 
    headers: { 'access_token': ASAAS_API_KEY }
});

// --- SISTEMA DE CHAT GLOBAL AO VIVO ---
const historicoChat = []; // Memória fofoqueira: guarda as últimas mensagens

io.on('connection', (socket) => {
    // 1. Quando o jogador entra, mandamos o histórico de mensagens
    socket.emit('historico_chat', historicoChat);

    // 2. Quando o jogador envia uma mensagem nova
    socket.on('enviar_mensagem', (dados) => {
        const mensagem = {
            nick: dados.nick,
            texto: dados.texto,
            // Pega a hora atual do Brasil para mostrar no chat
            hora: new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute:'2-digit' })
        };
        
        historicoChat.push(mensagem);
        // Apaga a mensagem mais velha se passar de 30 mensagens (para não pesar o servidor)
        if(historicoChat.length > 30) historicoChat.shift(); 
        
        // 3. Fofoca a mensagem nova para TODOS os jogadores conectados na mesma hora!
        io.emit('nova_mensagem', mensagem);
    });
});

// --- ROTA 1: GERAR O PIX ---
app.post('/gerar-pix', async (req, res) => {
    console.log(`\n💸 Jogo pediu para gerar um PIX de ${req.body.diamantes} diamantes para ${req.body.Nick}!`);
    const { Nick, valor, diamantes } = req.body;

    if (!valor || valor <= 0) {
        console.log("❌ Erro: Jogo mandou valor zerado ou negativo.");
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

        console.log(`✅ PIX gerado com sucesso! ID do Pagamento: ${paymentId}`);
        return res.json({
            copia_e_cola: qrCodeResponse.data.payload,
            paymentId: paymentId 
        });

    } catch (error) {
        console.error("❌ Erro ao gerar Pix no Asaas:", error.response ? error.response.data : error.message);
        return res.status(500).json({ erro: "Erro ao gerar o Pix no Asaas" });
    }
});

// --- ROTA 2: O ESPIÃO QUE VERIFICA SE FOI PAGO ---
app.get('/conferir-pagamento/:id', async (req, res) => {
    const idDoPagamento = req.params.id;
    console.log(`🔍 Jogo perguntando se o PIX ${idDoPagamento} foi pago...`);
    
    try {
        const response = await asaasInstance.get(`/payments/${idDoPagamento}`);
        const statusPagamento = response.data.status;
        
        console.log(`📊 Status lá no Asaas: ${statusPagamento}`);
        
        if (statusPagamento === 'RECEIVED' || statusPagamento === 'CONFIRMED') {
            console.log("💎 PAGAMENTO CONFIRMADO! Avisando o jogo para liberar os Dimas!");
            return res.json({ pago: true });
        } else {
            return res.json({ pago: false });
        }
    } catch (error) {
        console.error("❌ Erro ao consultar o Asaas:", error.message);
        return res.status(500).json({ erro: "Erro ao consultar o Asaas" });
    }
});

const PORT = process.env.PORT || 10000;
// ATENÇÃO: Mudou de app.listen para server.listen para o chat funcionar!
server.listen(PORT, () => {
    console.log(`🚀 Servidor Fofoqueiro e Chat Global rodando na porta ${PORT}`);
});
