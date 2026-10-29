// lib/mapear.js - converte a resposta de cada API numa linha da tabela `produtos`.
// Funções puras (sem rede), testadas em tests/coletor.test.js com respostas reais.
//
// Linha gravada:
//   { mercado, nome, preco, link, imagem_url, gtin, marca, disponivel, coletado_em }
// `link` passa a ser a página do produto (antes era só a página inicial do mercado).

function gtinValido(g) {
    g = String(g || '').trim();
    if (!/^\d{8}$|^\d{12,14}$/.test(g)) return null;
    const d = g.split('').map(Number);
    const check = d.pop();
    const soma = d.reverse().reduce((s, x, i) => s + x * (i % 2 === 0 ? 3 : 1), 0);
    return (10 - (soma % 10)) % 10 === check ? g : null;
}

function urlHttps(u) {
    if (!u) return null;
    u = String(u).trim().replace(/^http:\/\//, 'https://');
    return /^https:\/\/[^\s]+$/.test(u) ? u : null;
}

// Imagens VTEX aceitam tamanho na URL: /ids/543976/ -> /ids/543976-300-300/ (miniatura leve para o app)
function miniaturaVtex(u) {
    return u ? u.replace(/\/arquivos\/ids\/(\d+)\//, '/arquivos/ids/$1-300-300/') : null;
}

function preco(v) {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null;
}

// VTEX (Covabra, Savegnago): /api/catalog_system/pub/products/search
function mapearVtex(produto, mercado, baseUrl, coletadoEm) {
    const item = produto.items && produto.items[0];
    const oferta = item && item.sellers && item.sellers[0] && item.sellers[0].commertialOffer;
    const valor = preco(oferta && oferta.Price);
    if (!item || !valor || !produto.productName) return null; // sem preço não grava (antes gravava R$ 0)
    const imagem = item.images && item.images[0] && item.images[0].imageUrl;
    const link = produto.link || (produto.linkText ? `${baseUrl}/${produto.linkText}/p` : baseUrl);
    return {
        mercado,
        nome: String(produto.productName).trim(),
        preco: valor,
        link: urlHttps(link) || baseUrl,
        imagem_url: urlHttps(miniaturaVtex(imagem)),
        gtin: gtinValido(item.ean),
        marca: produto.brand ? String(produto.brand).trim() : null,
        disponivel: oferta.IsAvailable !== false && (oferta.AvailableQuantity === undefined || oferta.AvailableQuantity > 0),
        coletado_em: coletadoEm,
    };
}

// Tenda: api.tendaatacado.com.br/api/public/store/category/{id}/products
// Usa o preço normal; o "preço especial via app" (promotions) não vale para quem compra na loja.
function mapearTenda(p, coletadoEm) {
    const valor = preco(p.price);
    if (!valor || !p.name) return null;
    const foto = (p.photos && p.photos[0] && p.photos[0].url) || p.thumbnail;
    return {
        mercado: 'Tenda Atacado',
        nome: String(p.name).trim(),
        preco: valor,
        link: urlHttps(p.url) || (p.token ? `https://www.tendaatacado.com.br/produto/${p.token}` : 'https://www.tendaatacado.com.br'),
        imagem_url: urlHttps(foto),
        gtin: gtinValido(p.barcode || p.ean),
        marca: p.brand ? String(p.brand).trim() : null,
        disponivel: p.availability ? p.availability === 'in_stock' : null,
        coletado_em: coletadoEm,
    };
}

// Remove duplicados (mesmo mercado + mesmo GTIN ou mesmo nome), mantendo o menor preço
function deduplicar(linhas) {
    const mapa = new Map();
    for (const l of linhas) {
        if (!l) continue;
        const chave = l.mercado + '|' + (l.gtin || l.nome.toLowerCase());
        const atual = mapa.get(chave);
        if (!atual || l.preco < atual.preco) mapa.set(chave, l);
    }
    return [...mapa.values()];
}

// Decide se a nova coleta de um mercado pode substituir a anterior.
// Protege contra coleta quebrada: se vier menos de 50% do que havia, mantém os preços antigos.
function podeSubstituir(novos, anteriores) {
    if (!novos) return { ok: false, motivo: 'nenhum produto coletado' };
    if (anteriores > 0 && novos < anteriores * 0.5) return { ok: false, motivo: `só ${novos} produtos (antes ${anteriores}); possível falha na coleta` };
    return { ok: true };
}

const api = { gtinValido, urlHttps, miniaturaVtex, mapearVtex, mapearTenda, deduplicar, podeSubstituir };
if (typeof module === 'object' && module.exports) module.exports = api;
if (typeof globalThis !== 'undefined') globalThis.ColetorMapear = api;
