const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const ASAAS_API_KEY = process.env.ASAAS_API_KEY; 

const asaasInstance = axios.create({
    baseURL: 'https://www.asaas.com/api/v3', 
    headers: { 'access_token': ASAAS_API_KEY }
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
app.listen(PORT, () => {
    console.log(`🚀 Servidor Fofoqueiro rodando na porta ${PORT}`);
});
