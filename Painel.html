<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Painel Engenharia Master - NEXUS STRIKE</title>
    <script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
    <style>
        body { 
            background: #111; 
            font-family: sans-serif; 
            color: #fff; 
            margin: 0; 
            padding: 20px; 
        }
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
        }
        h1 { 
            color: #00ecff; 
            text-align: center; 
            border-bottom: 2px solid #333; 
            padding-bottom: 10px; 
            text-shadow: 0 0 15px #00ecff; 
        }
        .card { 
            background: #222; 
            border-radius: 8px; 
            padding: 20px; 
            margin-bottom: 20px; 
            border: 1px solid #444; 
        }
        .card-red { border-left: 5px solid #e74c3c; }
        .card-gold { border-left: 5px solid #f1c40f; }
        .card-green { border-left: 5px solid #2ecc71; }
        .card-purple { border-left: 5px solid #9b59b6; }
        .card-blue { border-left: 5px solid #3498db; }
        .card-orange { border-left: 5px solid #e67e22; }
        .card-cyan { border-left: 5px solid #00ecff; }
        
        input, select { 
            width: 100%; 
            background: #000; 
            border: 1px solid #555; 
            color: #fff; 
            padding: 12px; 
            margin-top: 8px; 
            margin-bottom: 15px; 
            border-radius: 4px; 
            box-sizing: border-box; 
            font-weight: bold; 
        }
        button { 
            width: 100%; 
            padding: 12px; 
            border: none; 
            font-weight: bold; 
            border-radius: 4px; 
            cursor: pointer; 
            text-transform: uppercase; 
            margin-bottom: 5px; 
        }
        
        .btn-gold { background: linear-gradient(135deg, #f1c40f, #f39c12); color: #000; }
        .btn-red { background: #c0392b; color: #fff; }
        .btn-green { background: #2ecc71; color: #000; }
        .btn-blue { background: #3498db; color: #fff; }
        .btn-purple { background: #9b59b6; color: #fff; }
        .btn-orange { background: #e67e22; color: #fff; }
        .btn-cyan { background: #00ecff; color: #000; }
        
        .flex-row { 
            display: flex; 
            gap: 10px; 
        }
        
        .grid-loja { 
            display: grid; 
            grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); 
            gap: 12px; 
            margin-top: 15px; 
        }
        .bloco-item { 
            background: #151515; 
            border: 1px solid #3af; 
            border-radius: 6px; 
            padding: 12px; 
            text-align: center; 
            box-shadow: 0 0 10px rgba(0,236,255,0.1); 
            transition: 0.2s; 
        }
        .bloco-item:hover { 
            transform: scale(1.03); 
            box-shadow: 0 0 15px rgba(0,236,255,0.3); 
        }
        .bloco-item img { 
            max-width: 45px; 
            max-height: 45px; 
            display: block; 
            margin: 0 auto 10px auto; 
            image-rendering: pixelated; 
        }
        .bloco-item .nome-item { 
            font-size: 12px; 
            font-weight: bold; 
            color: #fff; 
            overflow: hidden; 
            text-overflow: ellipsis; 
            white-space: nowrap; 
        }
        .bloco-item .precos-item { 
            font-size: 11px; 
            color: #f1c40f; 
            margin-top: 5px; 
            font-weight: bold; 
        }
        .bloco-item .id-item { 
            font-size: 10px; 
            color: #777; 
            margin-top: 2px; 
            font-family: monospace; 
        }
        .bloco-item .btn-remover-item { 
            background: #c0392b; 
            color: #fff; 
            border: none; 
            font-size: 9px; 
            padding: 4px; 
            border-radius: 3px; 
            cursor: pointer; 
            margin-top: 8px; 
            width: 100%; 
            font-weight: bold; 
        }
        
        .console-log { 
            background: #000; 
            border: 1px solid #333; 
            font-family: monospace; 
            font-size: 11px; 
            color: #2ecc71; 
            padding: 8px; 
            height: 60px; 
            overflow-y: auto; 
            margin-bottom: 10px; 
            border-radius: 4px; 
        }
        .secao-interna { 
            background: #1a1a1a; 
            padding: 10px; 
            border-radius: 4px; 
            border: 1px dashed #555; 
            margin-bottom: 15px; 
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>⚙️ CENTRAL MASTER - NEXUS STRIKE</h1>

        <div class="card card-purple">
            <h3 style="margin-top:0; color:#9b59b6;">🗺️ Engenharia de Mapas Automática (Via ZIP)</h3>
            <span style="font-size: 11px; color: #aaa;">O sistema extrai a imagem do seu arquivo ZIP, sobe direto para o seu GitHub e já injeta no jogo! Diga adeus aos URLs chatos.</span>
            
            <input type="text" id="cenario-id" placeholder="Nome/ID do Mapa (ex: cidade_guerra)">
            
            <div class="flex-row">
                <div style="flex: 1;">
                    <label style="font-weight: bold; font-size: 12px; color: #9b59b6;">📦 ZIP do Fundo (Cenário):</label>
                    <input type="file" id="zip-fundo" accept=".zip" style="margin-top: 4px;">
                </div>
                <div style="flex: 1;">
                    <label style="font-weight: bold; font-size: 12px; color: #9b59b6;">📦 ZIP do Chão:</label>
                    <input type="file" id="zip-chao" accept=".zip" style="margin-top: 4px;">
                </div>
            </div>
            
            <div class="secao-interna">
                <label style="font-weight: bold; font-size: 12px; color: #9b59b6; display: block; margin-bottom: 5px;">🧱 Construtor de Obstáculos Estáticos:</label>
                <div class="flex-row">
                    <input type="number" id="obs-pos-x" placeholder="Posição X">
                    <input type="number" id="obs-largura" placeholder="Largura (W)">
                    <input type="number" id="obs-altura" placeholder="Altura (H)">
                </div>
                <button class="btn-purple" style="font-size: 11px; margin-bottom: 8px;" onclick="adicionarObstaculoLista()">🧱 Inserir Obstáculo na Lista</button>
                <div id="lista-obs-adicionados" style="font-size: 11px; color: #2ecc71; font-family: monospace; max-height: 70px; overflow-y: auto; background: #000; padding: 5px; border-radius: 4px;">Nenhum obstáculo na fila...</div>
            </div>
            
            <div class="console-log" id="console-mapa">> Aguardando arquivos ZIP do mapa...</div>
            <button class="btn-purple" id="btn-injetar-mapa" style="background: linear-gradient(135deg, #9b59b6, #8e44ad);" onclick="enviarCenarioCompletoViaZip()">🌐 SUBIR ARQUIVOS E INJETAR MAPA</button>
        </div>

        <div class="card card-cyan">
            <h3 style="margin-top:0; color:#00ecff;">🏪 Vitrine Comercial da Loja</h3>
            <span style="font-size: 11px; color: #aaa;">Skins que você já enviou. Se o servidor do jogo desligar sozinho, use o botão verde abaixo para forçar o envio da sua lista salva!</span>
            <div class="grid-loja" id="vitrine-bloquinhos"></div>
            <button class="btn-cyan" style="margin-top: 15px; font-size: 11px;" onclick="sincronizarVitrine()">🔄 1. PEGAR DO SERVIDOR</button>
            <button class="btn-green" style="margin-top: 5px; font-size: 11px;" onclick="restaurarServidor()">⬆️ 2. RESTAURAR SERVIDOR (APÓS REINÍCIO)</button>
        </div>

        <div class="card card-orange">
            <h3 style="margin-top:0; color:#e67e22;">👥 Jogadores Online (Ao Vivo) — <span id="total-jogadores" style="color:#f1c40f;">0</span> online</h3>
            <button class="btn-orange" style="font-size: 11px;" onclick="carregarJogadores()">🔄 ATUALIZAR LISTA DE JOGADORES</button>
            <div id="lista-jogadores" style="margin-top: 15px; display: flex; flex-direction: column; gap: 8px;">
                <span style='color:#777;font-size:12px;text-align:center;'>Clique em atualizar para buscar os jogadores.</span>
            </div>
        </div>

        <div class="card card-gold">
            <h3 style="margin-top:0; color:#f1c40f;">💎 Gerador de Códigos de Diamantes</h3>
            <span style="font-size: 11px; color: #aaa;">Gere um código válido para até 3 jogadores diferentes resgatarem. O mesmo jogador não pode resgatar duas vezes.</span>
            <div class="flex-row" style="margin-top: 10px;">
                <input type="number" id="qtd-diamantes" placeholder="Quantidade de diamantes" min="1">
            </div>
            <button class="btn-gold" onclick="gerarCodigo()" style="margin-top: 5px;">🎁 GERAR CÓDIGO</button>
            <div id="codigo-gerado" style="margin-top: 10px; display:none; background:#000; padding: 15px; border-radius: 6px; text-align:center;">
                <p style="color:#aaa; font-size:11px; margin:0 0 5px 0;">Código gerado:</p>
                <p id="codigo-texto" style="color:#f1c40f; font-size:20px; font-weight:bold; letter-spacing:3px; margin:0;"></p>
                <p id="codigo-info" style="color:#aaa; font-size:11px; margin:5px 0 0 0;"></p>
            </div>
        </div>

        <div class="card card-green">
            <h3 style="margin-top:0; color:#2ecc71;">🥋 Injetor Automático de Skins</h3>
            <label style="font-weight: bold; font-size: 13px;">Arquivo ZIP dos Sprites:</label>
            <input type="file" id="zip-file" accept=".zip">
            <div class="flex-row">
                <div style="flex: 1;">
                    <label style="font-weight: bold; font-size: 13px;">ID Frame Inicial:</label>
                    <input type="number" id="skin-id-start" value="1">
                </div>
                <div style="flex: 1;">
                    <label style="font-weight: bold; font-size: 13px;">ID Frame Final:</label>
                    <input type="number" id="skin-id-end" value="9">
                </div>
            </div>
            <div class="flex-row">
                <div style="flex: 1;">
                    <label style="font-weight: bold; font-size: 13px;">Categoria na Loja:</label>
                    <select id="categoria-item">
                        <option value="skins">👕 Roupa / Personagem</option>
                        <option value="armas">🔫 Arma</option>
                        <option value="gelo">❄️ Skin de Gelo</option>
                    </select>
                </div>
                <div style="flex: 1;">
                    <label style="font-weight: bold; font-size: 13px;">Comportamento no Jogo:</label>
                    <select id="comportamento-skin">
                        <option value="custom_isolated">✨ Skin Isolada (Loja)</option>
                    </select>
                </div>
            </div>
            <input type="text" id="id-item-loja" placeholder="ID Interno do Sprite (ex: mestre_azul)">
            <input type="text" id="nome-item-loja" placeholder="Nome Comercial do Item">
            <div class="flex-row">
                <input type="number" id="preco-ouro" placeholder="Preço em Ouro">
                <input type="number" id="preco-dima" placeholder="Preço em Diamantes">
            </div>
            <div class="secao-interna">
                <label style="font-weight: bold; font-size: 12px; color: #2ecc71; display: block; margin-bottom: 5px;">🎬 Configuração Completa de Movimentos:</label>
                <div class="flex-row">
                    <div style="flex: 1;"><span style="font-size: 11px; color:#aaa;">Parado:</span><input type="text" id="frames-parado" value="1-1"></div>
                    <div style="flex: 1;"><span style="font-size: 11px; color:#aaa;">Andando:</span><input type="text" id="frames-andando" value="2-4"></div>
                </div>
                <div class="flex-row">
                    <div style="flex: 1;"><span style="font-size: 11px; color:#aaa;">Pulando:</span><input type="text" id="frames-pulando" value="5-5"></div>
                    <div style="flex: 1;"><span style="font-size: 11px; color:#aaa;">Atirando:</span><input type="text" id="frames-atirando" value="6-6"></div>
                </div>
                <div class="flex-row">
                    <div style="flex: 1;"><span style="font-size: 11px; color:#aaa;">Batendo:</span><input type="text" id="frames-ataque" value="6-6"></div>
                    <div style="flex: 1;"><span style="font-size: 11px; color:#aaa;">Morrendo:</span><input type="text" id="frames-morrendo" value="9-9"></div>
                </div>
                <div class="flex-row">
                    <div style="flex: 1;"><span style="font-size: 11px; color:#aaa;">FPS:</span><input type="number" id="velocidade-fps" value="12"></div>
                </div>
            </div>
            <div class="console-log" id="console-sequenciador">> Sistema pronto...</div>
            <button class="btn-green" id="btn-upload-zip" onclick="processarEUploadZip()">📦 FILTRAR SEQUÊNCIA E INJETAR NO JOGO</button>
        </div>

        <div class="card card-blue">
            <h3 style="margin-top:0; color:#3498db;">🔑 GitHub Asset Manager</h3>
            <input type="password" id="admin-secret-input" placeholder="🔐 Senha do Painel Admin (ADMIN_SECRET)">
            <input type="password" id="gh-token" placeholder="GitHub Personal Token">
            <input type="text" id="gh-owner" placeholder="Usuário GitHub">
            <input type="text" id="gh-repo" placeholder="Repositório">
            <button class="btn-blue" onclick="salvarConfigGitHub()">💾 SALVAR CREDENCIAIS</button>
        </div>
    </div>

    <script>
        const URL_SERVIDOR = "https://eliasx7.onrender.com";
        let itensLocaisLoja = JSON.parse(localStorage.getItem('vitrine_salva')) || [];
        let listaObstaculosTemp = []; 

        const ADMIN_SECRET = localStorage.getItem('admin_secret') || 'nexusmaster';

        function adminFetch(url, options = {}) {
            options.headers = options.headers || {};
            options.headers['x-admin-secret'] = ADMIN_SECRET;
            return fetch(url, options);
        }

        window.onload = function() {
            renderizarBloquinhos();
            document.getElementById('gh-token').value = localStorage.getItem('gh_token') || '';
            document.getElementById('gh-owner').value = localStorage.getItem('gh_owner') || '';
            document.getElementById('gh-repo').value = localStorage.getItem('gh_repo') || '';
            document.getElementById('admin-secret-input').value = localStorage.getItem('admin_secret') || 'nexusmaster';
        };

        function logConsole(idElemento, txt) {
            const c = document.getElementById(idElemento);
            c.innerHTML += "<br>> " + txt; 
            c.scrollTop = c.scrollHeight;
        }

        function salvarConfigGitHub() {
            localStorage.setItem('gh_token', document.getElementById('gh-token').value.trim());
            localStorage.setItem('gh_owner', document.getElementById('gh-owner').value.trim());
            localStorage.setItem('gh_repo', document.getElementById('gh-repo').value.trim());
            
            const novoSecret = document.getElementById('admin-secret-input').value.trim();
            if (novoSecret) {
                localStorage.setItem('admin_secret', novoSecret);
            }
            
            alert("✅ Credenciais salvas!");
        }

        function adicionarObstaculoLista() {
            const x = parseInt(document.getElementById('obs-pos-x').value);
            const w = parseInt(document.getElementById('obs-largura').value);
            const h = parseInt(document.getElementById('obs-altura').value);
            
            if (isNaN(x) || !w || !h) {
                return alert("Informe valores válidos de X, W e H!");
            }
            
            listaObstaculosTemp.push({ x, w, h, isGelo: false });
            
            let container = document.getElementById('lista-obs-adicionados');
            if(listaObstaculosTemp.length === 1) {
                container.innerHTML = "";
            }
            
            container.innerHTML += `<div>[Obstáculo] X: ${x} | W: ${w} | H: ${h}</div>`;
            
            document.getElementById('obs-pos-x').value = "";
            document.getElementById('obs-largura').value = "";
            document.getElementById('obs-altura').value = "";
        }

        async function extrairPrimeiraImagemDoZip(zipFile) {
            const zip = await JSZip.loadAsync(zipFile);
            for (let filename of Object.keys(zip.files)) {
                if (!zip.files[filename].dir && filename.match(/\.(png|jpg|jpeg)$/i)) {
                    return await zip.files[filename].async("base64");
                }
            }
            throw new Error("Nenhuma imagem encontrada dentro do ZIP!");
        }

        async function fazerUploadArquivoGitHub(token, owner, repo, path, base64Data) {
            let sha = null;
            try {
                let shaRes = await adminFetch(URL_SERVIDOR + '/proxy/github-get', {
                    method: 'POST', 
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ token, owner, repo, path })
                });
                let shaData = await shaRes.json();
                if (shaData.sha) {
                    sha = shaData.sha;
                }
            } catch(err) {
                // Arquivo não existe, continua sem o SHA (cria novo)
            }

            let resPut = await adminFetch(URL_SERVIDOR + '/proxy/github-upload', {
                method: 'POST', 
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ token, owner, repo, path, content: base64Data, sha })
            });

            if(!resPut.ok) {
                const errData = await resPut.json().catch(() => ({}));
                throw new Error(errData.erro || "Falha no upload para o GitHub.");
            }
        }

        async function enviarCenarioCompletoViaZip() {
            const idCenario = document.getElementById('cenario-id').value.trim().toLowerCase();
            const zipFundoInput = document.getElementById('zip-fundo').files[0];
            const zipChaoInput = document.getElementById('zip-chao').files[0];
            
            if(!idCenario) return alert("Digite um Nome/ID para o Mapa! (ex: guerra_noturna)");
            if(!zipFundoInput || !zipChaoInput) return alert("Selecione os DOIS arquivos ZIP (O Zip do Fundo e o Zip do Chão)!");
            
            const token = document.getElementById('gh-token').value.trim();
            const owner = document.getElementById('gh-owner').value.trim();
            const repo = document.getElementById('gh-repo').value.trim();
            
            if(!token || !owner || !repo) return alert("Configure suas credenciais do GitHub no card azul lá embaixo!");
            
            const btn = document.getElementById('btn-injetar-mapa');
            btn.innerText = "⏳ SUBINDO ARQUIVOS E INJETANDO...";
            btn.disabled = true;
            document.getElementById('console-mapa').innerHTML = "> Iniciando processo...";

            try {
                // 1. Extrair e subir o Fundo
                logConsole('console-mapa', `Extraindo Fundo do ZIP...`);
                let base64Fundo = await extrairPrimeiraImagemDoZip(zipFundoInput);
                let pathFundo = `mapas/${idCenario}_fundo.png`;
                
                logConsole('console-mapa', `Subindo Fundo pro GitHub...`);
                await fazerUploadArquivoGitHub(token, owner, repo, pathFundo, base64Fundo);

                // 2. Extrair e subir o Chão
                logConsole('console-mapa', `Extraindo Chão do ZIP...`);
                let base64Chao = await extrairPrimeiraImagemDoZip(zipChaoInput);
                let pathChao = `mapas/${idCenario}_chao.png`;
                
                logConsole('console-mapa', `Subindo Chão pro GitHub...`);
                await fazerUploadArquivoGitHub(token, owner, repo, pathChao, base64Chao);

                // 3. Montar as URLs diretas
                const cacheBuster = `?v=${Date.now()}`;
                const urlFundo = `https://raw.githubusercontent.com/${owner}/${repo}/main/${pathFundo}${cacheBuster}`;
                const urlChao = `https://raw.githubusercontent.com/${owner}/${repo}/main/${pathChao}${cacheBuster}`;

                logConsole('console-mapa', `Injetando no servidor online...`);
                let res = await adminFetch(URL_SERVIDOR + '/admin/definir-cenario', {
                    method: 'POST', 
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ 
                        fundo: urlFundo, 
                        chao: urlChao, 
                        obstaculos: listaObstaculosTemp 
                    })
                });
                
                let dados = await res.json();
                if(dados.sucesso) {
                    logConsole('console-mapa', `✅ SUCESSO ABSOLUTO!`);
                    alert("🗺️ MAPA INJETADO COM SUCESSO!\nAs imagens foram extraídas, salvas no seu GitHub e ativadas na arena online!");
                    listaObstaculosTemp = [];
                    document.getElementById('lista-obs-adicionados').innerText = "Nenhum obstáculo na fila...";
                }
            } catch(e) { 
                logConsole('console-mapa', `❌ ERRO: ${e.message}`);
                alert("Erro na engenharia de mapa: " + e.message); 
            }
            
            btn.innerText = "🌐 SUBIR ARQUIVOS E INJETAR MAPA";
            btn.disabled = false;
        }

        async function carregarJogadores() {
            try {
                let res = await adminFetch(URL_SERVIDOR + '/admin/jogadores');
                let dados = await res.json();
                
                let div = document.getElementById('lista-jogadores');
                document.getElementById('total-jogadores').textContent = dados.lista.length;
                div.innerHTML = "";
                
                if(dados.lista.length === 0) {
                    div.innerHTML = "<span style='color:#777;font-size:12px;text-align:center;'>Nenhum jogador online agora.</span>";
                    return;
                }
                
                dados.lista.forEach(j => {
                    div.innerHTML += `
                        <div style="background: #151515; padding: 10px; border: 1px solid #e67e22; border-radius: 5px; display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 10px;">
                            <span style="font-weight: bold; color: #fff;">👤 ${j.nick}</span>
                            <div style="display: flex; gap: 5px;">
                                <button class="btn-gold" style="padding: 6px; font-size: 10px; margin:0;" onclick="darVIP('${j.nick}')">👑 VIP</button>
                                <button class="btn-blue" style="padding: 6px; font-size: 10px; margin:0;" onclick="tirarVIP('${j.nick}')">❌ REMOVER VIP</button>
                                <button class="btn-red" style="padding: 6px; font-size: 10px; margin:0;" onclick="banirJogador('${j.nick}')">🚫 BANIR</button>
                            </div>
                        </div>
                    `;
                });
            } catch(e) {
                console.error(e);
            }
        }

        async function gerarCodigo() {
            const qtd = parseInt(document.getElementById('qtd-diamantes').value);
            
            if (!qtd || qtd <= 0) {
                return alert("Quantidade Inválida");
            }
            
            try {
                let res = await adminFetch(URL_SERVIDOR + '/admin/gerar-codigo', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ diamantes: qtd })
                });
                
                let dados = await res.json();
                
                if (dados.sucesso) {
                    document.getElementById('codigo-gerado').style.display = 'block';
                    document.getElementById('codigo-texto').textContent = dados.codigo;
                    document.getElementById('codigo-info').textContent = `💎 ${qtd} diamantes`;
                }
            } catch(e) {
                console.error(e);
            }
        }

        async function darVIP(nick) {
            if(!confirm(`Dar Verificado para ${nick}?`)) return;
            await adminFetch(URL_SERVIDOR + '/admin/dar-vip', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ nick })
            });
            alert("👑 Ordem enviada!");
        }

        async function tirarVIP(nick) {
            if(!confirm(`REMOVER Verificado de ${nick}?`)) return;
            await adminFetch(URL_SERVIDOR + '/admin/remover-vip', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ nick })
            });
            alert("❌ Ordem enviada!");
        }

        async function banirJogador(nick) {
            if(!confirm(`BANIR ${nick} PERMANENTEMENTE?`)) return;
            await adminFetch(URL_SERVIDOR + '/admin/banir', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ nick })
            });
            alert("🚫 Banido!");
            carregarJogadores();
        }

        function renderizarBloquinhos() {
            const vitrine = document.getElementById('vitrine-bloquinhos');
            const owner = localStorage.getItem('gh_owner') || 'owner';
            const repo = localStorage.getItem('gh_repo') || 'repo';
            
            if(itensLocaisLoja.length === 0) {
                vitrine.innerHTML = "<p style='color:#777; font-size:12px; text-align:center;'>Nenhuma roupa.</p>";
                return;
            }
            
            vitrine.innerHTML = "";
            itensLocaisLoja.forEach((item, index) => {
                const imgUrl = `https://raw.githubusercontent.com/${owner}/${repo}/main/img/${item.id}.x1.png`;
                vitrine.innerHTML += `
                    <div class="bloco-item">
                        <img src="${imgUrl}" onerror="this.src='https://placehold.co/45x45/222/00ecff?text=🥋'">
                        <div class="nome-item">${item.name}</div>
                        <div class="precos-item">🪙 ${item.price} | 💎 ${item.priceD}</div>
                        <div class="id-item">ID: ${item.id}</div>
                        <button class="btn-remover-item" onclick="removerBlocoLoja(${index}, '${item.id}')">Remover</button>
                    </div>
                `;
            });
        }

        async function removerBlocoLoja(index, idItem) {
            if(!confirm("Retirar skin?")) return;
            
            itensLocaisLoja.splice(index, 1);
            localStorage.setItem('vitrine_salva', JSON.stringify(itensLocaisLoja));
            renderizarBloquinhos();
            
            try {
                await adminFetch(URL_SERVIDOR + '/admin/remover-loja', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ id: idItem })
                });
            } catch(e) {}
        }

        async function sincronizarVitrine() {
            const token = localStorage.getItem('gh_token');
            const owner = localStorage.getItem('gh_owner');
            const repo = localStorage.getItem('gh_repo');
            
            if (token && owner && repo) {
                try {
                    await adminFetch(URL_SERVIDOR + '/proxy/carregar-loja-github', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({ token, owner, repo })
                    });
                } catch(e) {}
            }
            
            try {
                let res = await adminFetch(URL_SERVIDOR + '/admin/loja');
                let dados = await res.json();
                
                if(dados && dados.itens && dados.itens.length > 0) {
                    itensLocaisLoja = dados.itens;
                    localStorage.setItem('vitrine_salva', JSON.stringify(itensLocaisLoja));
                    renderizarBloquinhos();
                    alert("✅ Sincronizado!");
                } else {
                    alert("⚠️ O servidor do jogo está VAZIO!");
                }
            } catch(e) {}
        }

        async function restaurarServidor() {
            if(itensLocaisLoja.length === 0) return alert("Lista vazia.");
            
            for (let item of itensLocaisLoja) {
                try {
                    const itemComTipo = { ...item, tipo: item.tipo || 'skins' };
                    await adminFetch(URL_SERVIDOR + '/admin/add-loja', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify(itemComTipo)
                    });
                } catch(e) {}
            }
            
            const token = localStorage.getItem('gh_token');
            const owner = localStorage.getItem('gh_owner');
            const repo = localStorage.getItem('gh_repo');
            
            if (token && owner && repo) {
                try {
                    await adminFetch(URL_SERVIDOR + '/proxy/salvar-loja-github', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({ token, owner, repo })
                    });
                } catch(e) {}
            }
            alert("✅ Servidor curado e salvo!");
        }

        async function processarEUploadZip() {
            const token = document.getElementById('gh-token').value.trim();
            const owner = document.getElementById('gh-owner').value.trim();
            const repo = document.getElementById('gh-repo').value.trim();
            const zipInput = document.getElementById('zip-file').files[0];
            
            const idStart = parseInt(document.getElementById('skin-id-start').value) || 1;
            const idEnd = parseInt(document.getElementById('skin-id-end').value) || 9;
            const itemID = document.getElementById('id-item-loja').value.trim().toLowerCase();
            const itemNome = document.getElementById('nome-item-loja').value.trim();
            const precoOuro = parseInt(document.getElementById('preco-ouro').value) || 0;
            const precoDima = parseInt(document.getElementById('preco-dima').value) || 0;
            const comportamentoSkin = document.getElementById('comportamento-skin').value;
            const categoriaItem = document.getElementById('categoria-item').value;
            
            if(!token || !owner || !repo) return alert("Configure as credenciais!");
            if(!zipInput) return alert("Selecione o arquivo!");
            if(!itemID || !itemNome) return alert("Preencha ID e Nome!");
            
            const btn = document.getElementById('btn-upload-zip');
            btn.innerText = "⏳ SUBINDO ARQUIVOS...";
            btn.disabled = true;
            
            try {
                const zip = await JSZip.loadAsync(zipInput);
                let arquivosFila = [];
                
                zip.forEach((path, file) => {
                    if (!file.dir && path.match(/\.(png|jpg|jpeg)$/i)) {
                        arquivosFila.push(file);
                    }
                });
                
                arquivosFila.sort((a, b) => a.name.localeCompare(b.name, undefined, {numeric: true, sensitivity: 'base'}));
                
                for(let idx = 0; idx < arquivosFila.length; idx++) {
                    let numeroFrame = idStart + idx;
                    if (numeroFrame > idEnd) break;
                    
                    const base64Data = await arquivosFila[idx].async("base64");
                    const filename = `img/${itemID}.x${numeroFrame}.png`;
                    
                    await fazerUploadArquivoGitHub(token, owner, repo, filename, base64Data);
                    
                    logConsole('console-sequenciador', `✅ Frame ${numeroFrame} enviado!`);
                    await new Promise(r => setTimeout(r, 300));
                }
                
                const skinConfigCompleta = {
                    tipo: categoriaItem,
                    id: itemID,
                    name: itemNome,
                    price: precoOuro,
                    priceD: precoDima,
                    comportamento: comportamentoSkin,
                    config_frames: {
                        parado: document.getElementById('frames-parado').value.trim(),
                        andando: document.getElementById('frames-andando').value.trim(),
                        pulando: document.getElementById('frames-pulando').value.trim(),
                        atirando: document.getElementById('frames-atirando').value.trim(),
                        ataque: document.getElementById('frames-ataque').value.trim(),
                        morrendo: document.getElementById('frames-morrendo').value.trim(),
                        fps: parseInt(document.getElementById('velocidade-fps').value) || 12
                    },
                    v: Date.now()
                };
                
                itensLocaisLoja = itensLocaisLoja.filter(i => i.id !== itemID);
                itensLocaisLoja.push(skinConfigCompleta);
                localStorage.setItem('vitrine_salva', JSON.stringify(itensLocaisLoja));
                renderizarBloquinhos();
                
                let resServer = await adminFetch(URL_SERVIDOR + '/admin/add-loja', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(skinConfigCompleta)
                });
                
                if (!resServer.ok) {
                    throw new Error("Falha ao registrar no servidor");
                }
                
                if (token && owner && repo) {
                    await adminFetch(URL_SERVIDOR + '/proxy/salvar-loja-github', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({ token, owner, repo })
                    });
                }
                alert(`✅ ENGENHARIA CONCLUÍDA! Item registrado na loja!`);
            } catch(e) {
                alert("Erro: " + e.message);
            }
            
            btn.innerText = "📦 FILTRAR SEQUÊNCIA E INJETAR";
            btn.disabled = false;
        }
    </script>
</body>
</html>
