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

// 🔐 SENHA DO PAINEL ADMIN
// Defina a variável de ambiente ADMIN_SECRET no Render para proteger seu painel!
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'nexus_admin_2024';

// --- PERSISTÊNCIA EM ARQUIVO (Loja não some mais ao reiniciar) ---
const LOJA_FILE = path.join(__dirname, 'loja_data.json');

function carregarLoja() {
    try {
        if (fs.existsSync(LOJA_FILE)) {
            const dados = JSON.parse(fs.readFileSync(LOJA_FILE, 'utf8'));
            console.log(`✅ Loja carregada: ${dados.skins.length} skins, ${dados.weapons.length} weapons`);
            return dados;
        }
    } catch (e) {
        console.error('Erro ao carregar loja:', e.message);
    }
    return { skins: [], weapons: [] };
}

function salvarLoja() {
    try {
        fs.writeFileSync(LOJA_FILE, JSON.stringify(lojaDinamica, null, 2), 'utf8');
    } catch (e) {
        console.error('Erro ao salvar loja:', e.message);
    }
}

// --- ESTADO DO SERVIDOR ---
let codigosValidos = {};
let filas = { solo: [], duo: [], squad: [] };
let lojaDinamica = carregarLoja();
let jogadoresGlobais = {};

// --- MIDDLEWARE DE AUTENTICAÇÃO DO PAINEL ---
function verificarAdmin(req, res, next) {
    const senhaRecebida = req.headers['x-admin-secret'] || req.body?.adminSecret;
    if (senhaRecebida !== ADMIN_SECRET) {
        return res.status(403).json({ sucesso: false, erro: 'Acesso negado. Senha incorreta.' });
    }
    next();
}

// --- SOCKET.IO ---
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

// --- ROTAS ADMIN (protegidas por senha) ---

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

app.post('/admin/add-loja', verificarAdmin, (req, res) => {
    const { tipo, id, name, price, priceD, comportamento, config_frames } = req.body;

    if (tipo !== 'skins' && tipo !== 'weapons') {
        return res.status(400).json({ sucesso: false, erro: 'Tipo inválido. Use skins ou weapons.' });
    }
    if (comportamento === 'replace_default') {
        return res.status(400).json({ sucesso: false, erro: 'Comportamento replace_default não é permitido.' });
    }
    if (!id || !name) {
        return res.status(400).json({ sucesso: false, erro: 'ID e nome são obrigatórios.' });
    }

    lojaDinamica[tipo] = lojaDinamica[tipo].filter(item => item.id !== id);
    lojaDinamica[tipo].push({ id, name, price: price || 0, priceD: priceD || 0, comportamento: 'custom_isolated', config_frames });

    salvarLoja();
    io.emit('atualizar_loja_dinamica', lojaDinamica);
    res.json({ sucesso: true });
});

app.get('/admin/loja', verificarAdmin, (req, res) => {
    res.json({ sucesso: true, itens: lojaDinamica.skins.concat(lojaDinamica.weapons) });
});

app.post('/admin/remover-loja', verificarAdmin, (req, res) => {
    const { id } = req.body;
    if (!id) return res.status(400).json({ sucesso: false, erro: 'ID inválido.' });
    lojaDinamica.skins = lojaDinamica.skins.filter(item => item.id !== id);
    lojaDinamica.weapons = lojaDinamica.weapons.filter(item => item.id !== id);
    salvarLoja();
    io.emit('atualizar_loja_dinamica', lojaDinamica);
    res.json({ sucesso: true });
});

// --- ROTAS DO JOGO ---

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
    const { valor, nome, Nick, cpfCnpj } = req.body;
    const nomeComprador = nome || Nick;
    if (!valor || valor <= 0 || !nomeComprador) {
        return res.status(400).json({ sucesso: false, erro: 'Campos valor e nome são obrigatórios.' });
    }

    try {
        const emailGenerico = 'jogador@freex7.com';
        const cpfGenerico = (cpfCnpj || '01234567890').replace(/\D/g, '');

        const dadosPagamento = {
            transaction_amount: Number(valor),
            description: `Compra de diamantes no Nexus Strike - ${nomeComprador}`,
            payment_method_id: 'pix',
            payer: {
                email: emailGenerico,
                first_name: nomeComprador,
                identification: { type: 'CPF', number: cpfGenerico }
            }
        };

        const mpResponse = await axios.post('https://api.mercadopago.com/v1/payments', dadosPagamento, {
            headers: {
                'Authorization': `Bearer ${MERCADOPG_TOKEN}`,
                'X-Idempotency-Key': `pix-${Date.now()}`
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

app.get('/status', (req, res) => {
    res.json({ status: 'online', skins: lojaDinamica.skins.length, weapons: lojaDinamica.weapons.length });
});

// Proxy de upload para o GitHub — evita bloqueio de CORS no navegador
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
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        res.json({ sucesso: true, data: response.data });
    } catch (err) {
        res.status(500).json({ sucesso: false, erro: err.response?.data?.message || err.message });
    }
});

// Proxy para verificar SHA do arquivo no GitHub
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

// Serve arquivos estáticos da raiz
app.use(express.static(path.join(__dirname)));

// Serve o painel direto pelo servidor
app.get('/painel', (req, res) => {
    res.sendFile(path.join(__dirname, 'Painel.html'));
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log(`🚀 Servidor Nexus Strike online na porta ${PORT}`));
