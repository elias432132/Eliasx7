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

// --- ROTA 1: GERAR O PIX COM O VALOR EXATO DO JOGO ---
app.post('/gerar-pix', async (req, res) => {
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

        const customerId = clienteResponse.data.id;

        const cobranca = await asaasInstance.post('/payments', {
            customer: customerId,
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
        console.error("Erro no Asaas:", error.response ? error.response.data : error.message);
        return res.status(500).json({ erro: "Erro ao gerar o Pix no Asaas" });
    }
});

// --- ROTA 2: O ESPIÃO QUE VERIFICA SE FOI PAGO ---
app.get('/conferir-pagamento/:id', async (req, res) => {
    try {
        const idDoPagamento = req.params.id;
        const response = await asaasInstance.get(`/payments/${idDoPagamento}`);
        
        if (response.data.status === 'RECEIVED' || response.data.status === 'CONFIRMED') {
            return res.json({ pago: true });
        } else {
            return res.json({ pago: false });
        }
    } catch (error) {
        console.error("Erro ao conferir pagamento:", error.message);
        return res.status(500).json({ erro: "Erro ao consultar o Asaas" });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
