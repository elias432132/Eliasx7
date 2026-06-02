const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

// Pega o Token do Asaas cadastrado no painel do Render
const ASAAS_TOKEN = process.env.ASAAS_TOKEN;

const apiAsaas = axios.create({
    baseURL: 'https://www.asaas.com/api/v3', // URL Oficial do Asaas
    headers: {
        'access_token': ASAAS_TOKEN,
        'Content-Type': 'application/json'
    }
});

// 1. ROTA QUE GERA O PIX AUTOMÁTICO
app.post('/gerar-pix', async (req, res) => {
    const { pacote, Nick } = req.body;

    // Configura os valores dos pacotes
    let valorReais = 5.00;
    if (pacote === "pacote2") valorReais = 20.00;

    try {
        // Criando a cobrança via Pix no Asaas
        const resposta = await apiAsaas.post('/payments', {
            customer: 'cus_000000000000', 
            billingType: 'PIX',
            value: valorReais,
            dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Vence em 1 dia
            externalReference: `DIAMANTES-${Nick}-${Date.now()}`
        });

        const paymentId = resposta.data.id;

        // Pegando o QR Code e a chave Copia e Cola do Pix criado
        const qrCodeResposta = await apiAsaas.get(`/payments/${paymentId}/pixQrCode`);

        res.json({
            sucesso: true,
            copia_e_cola: qrCodeResposta.data.payload,
            imagem_base64: qrCodeResposta.data.encodedImage
        });

    } catch (erro) {
        console.error("Erro ao gerar Pix no Asaas:", erro.response ? erro.response.data : erro.message);
        res.status(500).json({ sucesso: false, erro: "Não foi possível gerar o Pix." });
    }
});

// Mantém o servidor ligado na porta certa
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
