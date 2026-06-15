const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(cors({ origin: '*', methods: ['GET', 'POST'], credentials: true }));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });

// --- CONFIGURAÇÕES ---
const MERCADOPG_TOKEN = process.env.MERCADOPG_TOKEN;
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'nexusmaster';
const LOJA_FILE = path.join(__dirname, 'loja_data.json');

function carregarLoja() {
    try {
        if (fs.existsSync(LOJA_FILE)) {
            const dados = JSON.parse(fs.readFileSync(LOJA_FILE, 'utf8'));
            if (dados.skins && dados.skins.length > 0) {
                console.log(`✅ Loja carregada do arquivo: ${dados.skins.length} skins`);
                return dados;
            }
        }
    } catch (e) {
        console.error('Erro ao carregar loja:', e.message);
    }
    // 🔥 CORREÇÃO: Adicionado o "ice" na memória inicial do servidor
    return { skins: [], weapons: [], ice: [] };
}

function salvarLoja() {
    try {
        fs.writeFileSync(LOJA_FILE, JSON.stringify(lojaDinamica, null, 2), 'utf8');
    } catch (e) {
        console.error('Erro ao salvar loja:', e.message);
    }
}

let codigosValidos = {};
let filas = { solo: [], duo: [], squad: [] };
let lojaDinamica = carregarLoja();
let jogadoresGlobais = {};

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = process.env.GITHUB_OWNER || 'elias432132';
const GITHUB_REPO = process.env.GITHUB_REPO || 'Eliasx7';

async function carregarLojaDoGitHub() {
    if (!GITHUB_TOKEN) return;
    if (lojaDinamica.skins.length > 0) return; 
    try {
        const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/loja.json`;
        const response = await axios.get(url, { headers: { 'Authorization': `Bearer ${GITHUB_TOKEN}` } });
        const dados = JSON.parse(Buffer.from(response.data.content, 'base64').toString('utf8'));
        if (dados.skins && dados.skins.length > 0) {
            lojaDinamica = dados;
            salvarLoja();
            console.log(`✅ Loja carregada do GitHub: ${lojaDinamica.skins.length} skins`);
        }
    } catch (e) {
        console.log('Loja.json não encontrado no GitHub ainda.');
    }
}

setTimeout(carregarLojaDoGitHub, 3000);

function verificarAdmin(req, res, next) {
    const senhaRecebida = req.headers['x-admin-secret'] || req.body?.adminSecret;
    if (senhaRecebida !== ADMIN_SECRET) {
        return res.status(403).json({ sucesso: false, erro: 'Acesso negado. Senha incorreta.' });
    }
    next();
}

io.on('connection', (socket) => {
    socket.emit('atualizar_loja_dinamica', lojaDinamica);

    socket.on('pedir_loja_atualizada', () => {
        socket.emit('atualizar_loja_dinamica', lojaDinamica);
    });

    socket.on('registrar_nick', (nick) => {
        if (typeof nick === 'string' && nick.length <= 30) {
            jogadoresGlobais[socket.id] = { id: socket.id, nick: nick };
        }
    });

    socket.on('mensagem_para_dono', (texto) => {
        let nick = jogadoresGlobais[socket.id] ? jogadoresGlobais[socket.id].nick : 'Desconhecido';
        io.emit('aviso_painel_admin', { id: socket.id, nick: nick, msg: texto });
    });

    socket.on('resposta_do_dono', (dados) => {
        io.to(dados.idDestino).emit('nova_mensagem_sistema', { msg: `👑 PROMOTOR RESPONDEU: ${dados.msg}` });
    });

    socket.on('buscar_partida', (dados) => {
        const modo = dados.modo;
        if (!filas[modo]) return;
        const maxPlayers = modo === 'solo' ? 2 : (modo === 'duo' ? 4 : 8);
        filas[modo].push({ id: socket.id, nick: dados.nick });

        if (filas[modo].length >= maxPlayers) {
            const jogadoresSala = filas[modo].splice(0, maxPlayers);
            const salaId = 'SALA_REAL_' + Date.now();
            const timeA = jogadoresSala.slice(0, maxPlayers / 2).map(p => p.id);
            const timeB = jogadoresSala.slice(maxPlayers / 2).map(p => p.id);
            jogadoresSala.forEach(p => io.to(p.id).emit('partida_encontrada', { sala: salaId, modo, timeA, timeB }));
        } else {
            setTimeout(() => {
                const index = filas[modo].findIndex(p => p.id === socket.id);
                if (index !== -1) {
                    const p = filas[modo].splice(index, 1)[0];
                    io.to(p.id).emit('partida_encontrada', { sala: 'SALA_BOTS_' + Date.now(), modo, timeA: [p.id], timeB: [] });
                }
            }, 10000);
        }
    });

    socket.on('cancelar_busca', () => {
        ['solo', 'duo', 'squad'].forEach(m => filas[m] = filas[m].filter(p => p.id !== socket.id));
    });

    socket.on('enviar_mensagem', (msg) => { io.emit('nova_mensagem', msg); });

    socket.on('disconnect', () => {
        ['solo', 'duo', 'squad'].forEach(m => filas[m] = filas[m].filter(p => p.id !== socket.id));
        delete jogadoresGlobais[socket.id];
    });
});

app.get('/admin/jogadores', verificarAdmin, (req, res) => {
    res.json({ sucesso: true, lista: Object.values(jogadoresGlobais) });
});

app.post('/admin/gerar-codigo', verificarAdmin, (req, res) => {
    const { diamantes } = req.body;
    if (!diamantes || diamantes <= 0) return res.status(400).json({ sucesso: false, erro: 'Quantidade inválida.' });
    const codigo = 'X7-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    codigosValidos[codigo] = diamantes;
    res.json({ sucesso: true, codigo });
});

app.post('/admin/dar-vip', verificarAdmin, (req, res) => {
    const { nick } = req.body;
    if (!nick) return res.status(400).json({ sucesso: false, erro: 'Nick inválido.' });
    io.emit('forcar_vip', { nick });
    res.json({ sucesso: true });
});

app.post('/admin/remover-vip', verificarAdmin, (req, res) => {
    const { nick } = req.body;
    if (!nick) return res.status(400).json({ sucesso: false, erro: 'Nick inválido.' });
    io.emit('remover_vip', { nick });
    res.json({ sucesso: true });
});

app.post('/admin/banir', verificarAdmin, (req, res) => {
    const { nick } = req.body;
    if (!nick) return res.status(400).json({ sucesso: false, erro: 'Nick inválido.' });
    io.emit('jogador_banido', { nick });
    res.json({ sucesso: true });
});

// 🔥 CORREÇÃO PRINCIPAL: Aceitar Gelo e Armas
app.post('/admin/add-loja', verificarAdmin, (req, res) => {
    let { tipo, id, name, price, priceD, comportamento, config_frames } = req.body;

    // Traduz o que o Painel enviou para o que o Servidor entende
    if (tipo === 'armas') tipo = 'weapons';
    if (tipo === 'gelo') tipo = 'ice';

    if (tipo !== 'skins' && tipo !== 'weapons' && tipo !== 'ice') {
        return res.status(400).json({ sucesso: false, erro: 'Tipo inválido. Use skins, weapons ou ice.' });
    }
    if (!id || !name) {
        return res.status(400).json({ sucesso: false, erro: 'ID e nome são obrigatórios.' });
    }

    if (!lojaDinamica[tipo]) lojaDinamica[tipo] = [];

    lojaDinamica[tipo] = lojaDinamica[tipo].filter(item => item.id !== id);
    lojaDinamica[tipo].push({ id, name, price: price || 0, priceD: priceD || 0, comportamento: comportamento || 'custom_isolated', config_frames });

    salvarLoja();
    io.emit('atualizar_loja_dinamica', lojaDinamica);
    res.json({ sucesso: true });
});

app.get('/admin/loja', verificarAdmin, (req, res) => {
    let itens = [];
    if(lojaDinamica.skins) itens = itens.concat(lojaDinamica.skins);
    if(lojaDinamica.weapons) itens = itens.concat(lojaDinamica.weapons);
    if(lojaDinamica.ice) itens = itens.concat(lojaDinamica.ice);
    res.json({ sucesso: true, itens: itens });
});

app.post('/admin/remover-loja', verificarAdmin, (req, res) => {
    const { id } = req.body;
    if (!id) return res.status(400).json({ sucesso: false, erro: 'ID inválido.' });
    if (lojaDinamica.skins) lojaDinamica.skins = lojaDinamica.skins.filter(item => item.id !== id);
    if (lojaDinamica.weapons) lojaDinamica.weapons = lojaDinamica.weapons.filter(item => item.id !== id);
    if (lojaDinamica.ice) lojaDinamica.ice = lojaDinamica.ice.filter(item => item.id !== id);
    salvarLoja();
    io.emit('atualizar_loja_dinamica', lojaDinamica);
    res.json({ sucesso: true });
});

app.post('/jogo/resgatar-codigo', (req, res) => {
    const { codigo } = req.body;
    if (!codigo) return res.status(400).json({ sucesso: false, erro: 'Código inválido!' });
    if (codigosValidos[codigo]) {
        const dimas = codigosValidos[codigo];
        delete codigosValidos[codigo];
        res.json({ sucesso: true, diamantesGanhos: dimas });
    } else {
        res.json({ sucesso: false, erro: 'Código inválido!' });
    }
});

app.post('/gerar-pix', async (req, res) => {
    const { diamantes, nome, Nick, cpfCnpj, email } = req.body;
    const nomeComprador = nome || Nick || 'Sobrevivente';
    const qtdDiamantes = parseInt(diamantes);

    if (!qtdDiamantes || qtdDiamantes < 250) {
        return res.status(400).json({ sucesso: false, erro: 'Mínimo de 250 diamantes.' });
    }

    const valorRealCobrado = Number((qtdDiamantes * 0.02).toFixed(2));

    try {
        const emailGenerico = email || 'jogador@freex7.com';
        const cpfGenerico = (cpfCnpj || '01234567890').replace(/\D/g, '');

        const dadosPagamento = {
            transaction_amount: valorRealCobrado,
            description: `Pacote de ${qtdDiamantes} Diamantes - Nexus Strike`,
            payment_method_id: 'pix',
            payer: {
                email: emailGenerico,
                first_name: nomeComprador,
                identification: { type: 'CPF', number: cpfGenerico }
            },
            external_reference: `${Nick}||${qtdDiamantes}` 
        };

        const mpResponse = await axios.post('https://api.mercadopago.com/v1/payments', dadosPagamento, {
            headers: {
                'Authorization': `Bearer ${MERCADOPG_TOKEN}`,
                'X-Idempotency-Key': `pix-nexus-${Date.now()}`
            }
        });

        const copiaECola = mpResponse.data.point_of_interaction?.transaction_data?.qr_code;
        const qrCodeBase64 = mpResponse.data.point_of_interaction?.transaction_data?.qr_code_base64;
        const cobrancaId = mpResponse.data.id;

        if (!copiaECola) throw new Error('Mercado Pago não retornou a chave PIX.');
        
        res.json({ sucesso: true, copia_e_cola: copiaECola, qrcode_base64: qrCodeBase64, cobranca_id: cobrancaId });
    } catch (error) {
        console.error('Erro ao gerar PIX:', error.response?.data || error.message);
        res.status(500).json({ sucesso: false, erro: 'Erro interno no Mercado Pago.' });
    }
});

app.post('/notificacao-pagamento', async (req, res) => {
    res.sendStatus(200); 

    const { action, type, data } = req.body;
    
    if (action === 'payment.updated' || type === 'payment') {
        try {
            const paymentId = data.id;
            
            const mpRes = await axios.get(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
                headers: { 'Authorization': `Bearer ${MERCADOPG_TOKEN}` }
            });
            
            const pagamento = mpRes.data;
            
            if (pagamento.status === 'approved' && pagamento.external_reference) {
                const [nickJogador, qtdDiamantesString] = pagamento.external_reference.split('||');
                const dimasComprados = parseInt(qtdDiamantesString);

                console.log(`🤑 PIX APROVADO! Enviando ${dimasComprados} Dimas para ${nickJogador}`);

                let socketIdDoPagador = null;
                for (const [idSocket, infoJogador] of Object.entries(jogadoresGlobais)) {
                    if (infoJogador.nick === nickJogador) {
                        socketIdDoPagador = idSocket;
                        break;
                    }
                }

                if (socketIdDoPagador) {
                    io.to(socketIdDoPagador).emit('pix_confirmado_automatico', { 
                        diamantesGanhos: dimasComprados 
                    });
                }
            }
        } catch(error) {
            console.error('Erro ao processar notificação do MP:', error.message);
        }
    }
});

app.get('/status', (req, res) => {
    res.json({ status: 'online', skins: (lojaDinamica.skins || []).length, weapons: (lojaDinamica.weapons || []).length });
});

app.post('/proxy/carregar-loja-github', verificarAdmin, async (req, res) => {
    const { token, owner, repo } = req.body;
    try {
        const url = `https://api.github.com/repos/${owner}/${repo}/contents/loja.json`;
        const response = await axios.get(url, { headers: { 'Authorization': `Bearer ${token}` } });
        const dados = JSON.parse(Buffer.from(response.data.content, 'base64').toString('utf8'));
        if (dados.skins && dados.skins.length > 0) {
            lojaDinamica = dados;
            salvarLoja();
            io.emit('atualizar_loja_dinamica', lojaDinamica);
            res.json({ sucesso: true, skins: lojaDinamica.skins.length });
        } else {
            res.json({ sucesso: false, erro: 'Loja vazia no GitHub' });
        }
    } catch (err) {
        res.status(500).json({ sucesso: false, erro: err.message });
    }
});

app.post('/proxy/github-upload', verificarAdmin, async (req, res) => {
    const { token, owner, repo, path: filePath, content, sha } = req.body;
    if (!token || !owner || !repo || !filePath || !content) {
        return res.status(400).json({ sucesso: false, erro: 'Campos obrigatórios faltando.' });
    }
    try {
        const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
        const payload = { message: `Upload ${filePath}`, content };
        if (sha) payload.sha = sha;
        const response = await axios.put(url, payload, {
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            timeout: 30000
        });
        res.json({ sucesso: true, data: response.data });
    } catch (err) {
        res.status(500).json({ sucesso: false, erro: err.response?.data?.message || err.message });
    }
});

app.post('/proxy/salvar-loja-github', verificarAdmin, async (req, res) => {
    const { token, owner, repo } = req.body;
    if (!token || !owner || !repo) {
        return res.status(400).json({ sucesso: false, erro: 'Campos obrigatórios faltando.' });
    }
    try {
        const url = `https://api.github.com/repos/${owner}/${repo}/contents/loja.json`;
        const content = Buffer.from(JSON.stringify(lojaDinamica, null, 2)).toString('base64');
        let sha = null;
        try {
            const getRes = await axios.get(url, { headers: { 'Authorization': `Bearer ${token}` } });
            sha = getRes.data.sha;
        } catch(e) {}
        const payload = { message: 'Atualizar loja.json', content };
        if (sha) payload.sha = sha;
        await axios.put(url, payload, {
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            timeout: 30000
        });
        res.json({ sucesso: true });
    } catch (err) {
        res.status(500).json({ sucesso: false, erro: err.response?.data?.message || err.message });
    }
});

app.post('/proxy/github-get', verificarAdmin, async (req, res) => {
    const { token, owner, repo, path: filePath } = req.body;
    try {
        const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
        const response = await axios.get(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        res.json({ sucesso: true, sha: response.data.sha });
    } catch (err) {
        res.json({ sucesso: false, sha: null });
    }
});

app.use(express.static(path.join(__dirname)));

app.get('/painel', (req, res) => {
    res.sendFile(path.join(__dirname, 'Painel.html'));
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log(`🚀 Servidor Nexus Strike online na porta ${PORT}`));
