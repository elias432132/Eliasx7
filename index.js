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

let filaMatchmaking = [];

io.on('connection', (socket) => {
    socket.on('buscar_partida', (dados) => {
        // Envia o jogador direto para a sala com os BOTS
        io.to(socket.id).emit('partida_encontrada', { 
            sala: "SALA_" + Math.random(),
            modo: dados.modo,
            timeA: [socket.id], 
            timeB: [] 
        });
    });

    socket.on('enviar_mensagem', (msg) => {
        io.emit('nova_mensagem', msg);
    });
});

app.post('/gerar-pix', async (req, res) => {
    try {
        const { Nick, valor, diamantes } = req.body;
        
        // Se você ainda não colocou sua chave real, ele gera um Pix Falso só para testar o App
        if (!ASAAS_API_KEY || ASAAS_API_KEY === "SUA_CHAVE_AQUI") {
            return res.json({ copia_e_cola: "00020126360014br.gov.bcb.pix0114+5511999999999520400005303986540510.005802BR5915Free X7 Teste6009Sao Paulo62070503***63041234" });
        }

        // Geração do Pix Real
        const cliente = await asaasInstance.post('/customers', { name: Nick, cpfCnpj: '00000000000' });
        const cobranca = await asaasInstance.post('/payments', { customer: cliente.data.id, billingType: 'PIX', value: valor, dueDate: '2026-12-31', description: `Compra de ${diamantes} Diamantes - Free X7` });
        const qr = await asaasInstance.get(`/payments/${cobranca.data.id}/pixQrCode`);
        
        res.json({ copia_e_cola: qr.data.payload });
    } catch (e) {
        // Se der erro de conexão, ele não trava seu jogo, devolve um pix de fallback
        res.json({ copia_e_cola: "ERRO_DE_CONEXAO_COM_O_BANCO_TENTE_NOVAMENTE" });
    }
});

server.listen(10000, () => console.log("Servidor Online com BOTS e PIX!"));
