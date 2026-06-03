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
            customer: 'cus_000000000000', // Substitua pelo ID do cliente padrão do seu Asaas
            billingType: 'PIX',
            value: valorReais,
            dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // 1 dia de vencimento
            externalReference: `DIAMANTES-${Nick}-${Date.now()}`
        });

        const pagamentoId = resposta.data.id;

        // Pegando o QR Code e a chave Copia e Cola do Pix criado
        const respostaQr = await apiAsaas.get(`/payments/${pagamentoId}/pixQrCode`);

        res.json({
            sucesso: true,
            copia_e_cola: respostaQr.data.payload,
            imagem_base64: respostaQr.data.encodedImage
        });

    } catch (erro) {
        console.error("Erro ao gerar Pix no Asaas:", erro.response ? erro.response.data : erro.message);
        res.status(500).json({ sucesso: false, erro: "Não foi possível gerar o Pix." });
    }
});

// 2. ROTA WEBHOOK (RECEBE O AVISO DE PAGAMENTO DO ASAAS)
app.post('/webhook', async (req, res) => {
    // Responde ao Asaas imediatamente para confirmar o recebimento
    res.status(200).json({ recebido: true });

    const { event, payment } = req.body;

    // Se o pagamento foi recebido ou confirmado
    if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
        const referencia = payment.externalReference;
        
        if (referencia && referencia.startsWith('DIAMANTES-')) {
            const partes = referencia.split('-');
            const nickJogador = partes[1]; // Pega o Nick do jogador
            
            let diamantes = 0;
            if (payment.value === 5.00) diamantes = 100;
            if (payment.value === 20.00) diamantes = 500;

            console.log(`PAGAMENTO APROVADO: Enviando ${diamantes} diamantes para ${nickJogador}`);

            try {
                // O código para colocar os diamantes no seu banco de dados entrará aqui no futuro
            } catch (erroBanco) {
                console.error("Erro ao salvar no banco:", erroBanco);
            }
        }
    }
});

// Mantém o servidor conectado na porta certa
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
