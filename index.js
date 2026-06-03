const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Puxa o token direto da variável ASAAS_TOKEN que você configurou no Render
const ASAAS_API_KEY = process.env.ASAAS_TOKEN; 

const asaasInstance = axios.create({
    baseURL: 'https://www.asaas.com/api/v3', 
    headers: { 'access_token': ASAAS_API_KEY }
});

app.post('/gerar-pix', async (req, res) => {
    const { pacote, Nick } = req.body;

    // Define o valor com base no pacote selecionado
    let valor = 5.00;
    if (pacote === 'pacote2') valor = 20.00;

    try {
        // Criando uma cobrança do tipo PIX avulsa (Sem exigir cadastro prévio de cliente)
        const cobranca = await asaasInstance.post('/payments', {
            billingType: 'PIX',
            value: valor,
            dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Vence em 1 dia
            description: `Compra de Diamantes - Nick: ${Nick}`
        });

        const paymentId = cobranca.data.id;

        // Busca o código Copia e Cola do Pix dessa cobrança
        const qrCodeResponse = await asaasInstance.get(`/payments/${paymentId}/pixQrCode`);

        return res.json({
            copia_e_cola: qrCodeResponse.data.payload
        });

    } catch (error) {
        console.error("Erro detalhado do Asaas:", error.response ? error.response.data : error.message);
        return res.status(500).json({ erro: "Erro ao gerar o Pix no Asaas" });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
