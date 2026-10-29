// lib/vtex.js - coleta de lojas VTEX (Covabra, Savegnago) por departamento.
// A busca VTEX só pagina até o item 2.500; buscando por departamento (e por subcategoria quando
// um departamento passa disso) o catálogo inteiro é coberto.
const axios = require('axios');
const { mapearVtex } = require('./mapear');

const CEP_LEME = '13610000';
const TAMANHO = 50;
const LIMITE_VTEX = 2500;
const PAUSA_MS = 800;               // o site recusa (erro 500) quando as consultas vêm muito seguidas
const ESPERA_ERRO_MS = [5000, 15000]; // espera antes da 2ª e da 3ª tentativa
const TEMPO_MAX_MERCADO_MS = 35 * 60 * 1000; // passou disso, salva o que já coletou e segue para o próximo

const esperar = ms => new Promise(r => setTimeout(r, ms));

function cliente(baseUrl) {
    // Sessão localizada em Leme-SP (CEP no segmento VTEX)
    const segmento = Buffer.from(JSON.stringify({ channel: '1', postalCode: CEP_LEME, countryCode: 'BRA' })).toString('base64');
    return axios.create({
        baseURL: baseUrl,
        timeout: 30000,
        headers: {
            'User-Agent': 'ComparaKi-TCC/1.0 (estudo academico; contato via mercado)',
            'Accept': 'application/json',
            'Cookie': `vtex_segment=${segmento};`,
        },
    });
}

async function comRetentativas(fn, rotulo) {
    for (let tentativa = 1; tentativa <= 3; tentativa++) {
        try {
            return await fn();
        } catch (erro) {
            const status = erro.response && erro.response.status;
            if (status && status >= 400 && status < 500 && status !== 429) throw erro; // erro do pedido: não repete
            if (tentativa === 3) throw erro;
            console.log(`   ↻ ${rotulo}: tentativa ${tentativa} falhou (${status || erro.code}); repetindo…`);
            await esperar(ESPERA_ERRO_MS[tentativa - 1]);
        }
    }
}

// Total de produtos de um filtro (cabeçalho "resources: 0-0/1441")
async function contar(http, fq) {
    const r = await comRetentativas(() => http.get('/api/catalog_system/pub/products/search', { params: { fq, _from: 0, _to: 0, sc: 1 } }), `contagem ${fq}`);
    const m = String(r.headers.resources || '').match(/\/(\d+)$/);
    return m ? Number(m[1]) : null;
}

async function buscarPagina(http, fq, inicio, mercado) {
    return comRetentativas(() => http.get('/api/catalog_system/pub/products/search', {
        params: { fq, _from: inicio, _to: inicio + TAMANHO - 1, sc: 1, postalCode: CEP_LEME },
    }), `${mercado} ${fq} ${inicio}`).catch(e => ({ erro: e }));
}

function guardar(lista, mercado, baseUrl, coletadoEm, saida, ids) {
    for (const p of lista) {
        if (ids.has(p.productId)) continue;
        ids.add(p.productId);
        const linha = mapearVtex(p, mercado, baseUrl, coletadoEm);
        if (linha) saida.push(linha);
    }
}

async function paginar(http, fq, mercado, baseUrl, coletadoEm, saida, ids, pendentes, prazo) {
    for (let inicio = 0; inicio < LIMITE_VTEX; inicio += TAMANHO) {
        if (Date.now() > prazo) return;
        const r = await buscarPagina(http, fq, inicio, mercado);
        if (r.erro) {
            if (r.erro.response && r.erro.response.status === 400) break; // passou do fim
            console.log(`   ⚠️ ${mercado} ${fq} página ${inicio}: ${r.erro.message} (fica para a 2ª passada)`);
            pendentes.push([fq, inicio]);
            await esperar(PAUSA_MS * 3);
            continue;
        }
        const lista = r.data;
        if (!Array.isArray(lista) || !lista.length) break;
        guardar(lista, mercado, baseUrl, coletadoEm, saida, ids);
        if (lista.length < TAMANHO) break;
        await esperar(PAUSA_MS);
    }
}

async function coletarVtex({ mercado, baseUrl }) {
    const http = cliente(baseUrl);
    const coletadoEm = new Date().toISOString();
    const saida = [];
    const ids = new Set();
    const pendentes = [];
    const prazo = Date.now() + TEMPO_MAX_MERCADO_MS;
    let arvore = [];
    try {
        arvore = (await comRetentativas(() => http.get('/api/catalog_system/pub/category/tree/2'), 'árvore de categorias')).data || [];
    } catch (e) {
        console.log(`   ⚠️ ${mercado}: não foi possível ler as categorias (${e.message}); usando busca geral (máx. 2.500).`);
    }
    if (!arvore.length) {
        await paginar(http, undefined, mercado, baseUrl, coletadoEm, saida, ids, pendentes, prazo);
        return saida;
    }
    for (const dep of arvore) {
        if (Date.now() > prazo) { console.log(`   ⏱️ ${mercado}: tempo máximo atingido; salvando o que já foi coletado.`); break; }
        const fq = `C:/${dep.id}/`;
        const total = await contar(http, fq).catch(() => null);
        const filtros = total > LIMITE_VTEX && dep.children && dep.children.length
            ? dep.children.map(c => `C:/${dep.id}/${c.id}/`)
            : [fq];
        console.log(`[${mercado}] ${dep.name}: ${total ?? '?'} itens${filtros.length > 1 ? ` (dividido em ${filtros.length} subcategorias)` : ''}`);
        for (const f of filtros) await paginar(http, f, mercado, baseUrl, coletadoEm, saida, ids, pendentes, prazo);
        console.log(`   total parcial: ${saida.length}`);
    }
    // 2ª passada: só as páginas que o site recusou, depois de uma pausa para ele "esfriar"
    if (pendentes.length && Date.now() < prazo) {
        console.log(`[${mercado}] 2ª passada em ${pendentes.length} páginas recusadas…`);
        await esperar(30000);
        let recuperadas = 0;
        for (const [fq, inicio] of pendentes) {
            if (Date.now() > prazo) break;
            const r = await buscarPagina(http, fq, inicio, mercado);
            if (!r.erro && Array.isArray(r.data)) { guardar(r.data, mercado, baseUrl, coletadoEm, saida, ids); recuperadas++; }
            await esperar(PAUSA_MS * 2);
        }
        console.log(`   recuperadas ${recuperadas}/${pendentes.length} · total: ${saida.length}`);
    }
    return saida;
}

module.exports = { coletarVtex };
