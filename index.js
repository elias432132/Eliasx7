<script>
async function gerarPagamentoPix() {
    const playerId = document.getElementById('player-id').value;
    const valorSelecionado = document.getElementById('pacote-diamante').value;

    if (!playerId) {
        alert("Por favor, digite seu ID do jogo primeiro!");
        return;
    }

    alert("Gerando seu Pix... Aguarde alguns segundos.");

    try {
        const resposta = await fetch('https://eliasx7.onrender.com/gerar-pix', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pacote: valorSelecionado, Nick: playerId })
        });

        const dados = await resposta.json();

        if (dados.copia_e_cola) {
            document.getElementById('copia-e-cola').value = dados.copia_e_cola;
            document.getElementById('area-pix').style.display = 'block';
        } else {
            alert("Erro ao gerar o Pix. Verifique os logs do seu Render.");
        }
    } catch (erro) {
        console.error(erro);
        alert("Não foi possível conectar ao servidor do jogo.");
    }
}

function copiarPix() {
    const campoTexto = document.getElementById('copia-e-cola');
    campoTexto.select();
    document.execCommand('copy');
    alert("Código Pix copiado!");
}
</script>
