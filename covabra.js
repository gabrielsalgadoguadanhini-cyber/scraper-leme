const axios = require("axios");

const URL =
"https://www.covabra.com.br/api/catalog_system/pub/products/search";

const TAMANHO = 50;

const LIMITE = 2500;

// CEP geral de Leme-SP
const CEP_LEME = "13610000";

// Configurações do cabeçalho para simular a sessão localizada em Leme-SP
const HEADERS_LEME = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Cookie": `vtex_segment=eyJ1dG1fc291cmNlIjpudWxsLCJ1dG1fbWVkaXVtIjpudWxsLCJ1dG1fY2FtcGFpZ24iOm51bGwsImNoYW5uZWwiOiIxIiwicHJpY2VUYWJsZUlkIjpudWxsLCJyZWdpb25JZCI6bnVsbCwicG9zdGFsQ29kZSI6IjEzNjEwMDAwIiwiY291bnRyeUNvZGUiOiJCUkEifQ==;`
};

async function buscarCovabra() {

    let produtos = [];

    const ids = new Set();

    for (let inicio = 0; inicio <= LIMITE; inicio += TAMANHO) {

        console.log(`[Covabra Leme] Buscando ${inicio} - ${inicio + TAMANHO - 1}`);

        try {

            // Adicionado postalCode=${CEP_LEME} e sc=1 na URL
            const resposta = await axios.get(
                `${URL}?_from=${inicio}&_to=${inicio + TAMANHO - 1}&sc=1&postalCode=${CEP_LEME}`,
                {
                    headers: HEADERS_LEME,
                    timeout: 30000
                }
            );

            const lista = resposta.data;

            if (!Array.isArray(lista) || lista.length === 0)
                break;

for (const produto of lista) {
                const item = produto.items?.[0];
                const seller = item?.sellers?.[0];

                if (!seller) continue;
                if (ids.has(produto.productId)) continue;

                ids.add(produto.productId);

                produtos.push({
                    preco: seller.commertialOffer?.Price ?? 0,
                    nome: produto.productName,
                    mercado: "Covabra (Leme)",
                    link: "https://www.covabra.com.br"
                });
            } // <-- FECHE AQUI O FOR DOS PRODUTOS

            console.log(`Total parcial Leme: ${produtos.length}`);
            await new Promise(r => setTimeout(r, 300));

        } catch (erro) { // Agora o catch se conecta corretamente ao try
            if (erro.response?.status === 400) break;
            console.log(`Erro na página ${inicio}`);
        }
    }

    produtos.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
    return produtos;
}

module.exports = buscarCovabra;