// tenda.js - Tenda Atacado (API pública do site, filial Leme = store 4).
// Correção: a API devolve `total_pages` no topo da resposta; o código antigo lia `products.pages`
// (inexistente) e por isso só pegava a 1ª página de cada categoria.
const axios = require('axios');
const { mapearTenda } = require('./lib/mapear');

const STORE_ID = '4';
const PAUSA_MS = 300;
const esperar = ms => new Promise(r => setTimeout(r, ms));

const client = axios.create({
  baseURL: 'https://api.tendaatacado.com.br/api/public',
  headers: {
    'User-Agent': 'ComparaKi-TCC/1.0 (estudo academico; contato via mercado)',
    'Accept': 'application/json, text/plain, */*',
    'Origin': 'https://www.tendaatacado.com.br',
    'Referer': 'https://www.tendaatacado.com.br/',
    'x-store-id': STORE_ID
  },
  timeout: 15000
});

const categoriasManuais = [
  // --- MERCEARIA ---
  { dep: 'Mercearia', id: 125, name: 'Achocolatado em Pó', link: 'achocolatado-em-po' },
  { dep: 'Mercearia', id: 126, name: 'Açúcar e Adoçantes', link: 'acucar-e-adocantes' },
  { dep: 'Mercearia', id: 128, name: 'Arroz', link: 'arroz' },
  { dep: 'Mercearia', id: 129, name: 'Aveias e Cereais', link: 'aveias-e-cereais' },
  { dep: 'Mercearia', id: 131, name: 'Biscoitos, Torradas e Salgadinhos', link: 'biscoitos-torradas-e-salgadinhos' },
  { dep: 'Mercearia', id: 132, name: 'Café', link: 'cafe' },
  { dep: 'Mercearia', id: 135, name: 'Conservas e Enlatados', link: 'conservas-e-enlatados' },
  { dep: 'Mercearia', id: 136, name: 'Doces e Sobremesas', link: 'doces-e-sobremesas' },
  { dep: 'Mercearia', id: 137, name: 'Farinhas', link: 'farinhas' },
  { dep: 'Mercearia', id: 138, name: 'Feijão', link: 'feijao' },
  { dep: 'Mercearia', id: 139, name: 'Massas e Macarrão', link: 'massas-e-macarrao' },
  { dep: 'Mercearia', id: 140, name: 'Óleos e Azeites', link: 'oleos-e-azeites' },
  { dep: 'Mercearia', id: 141, name: 'Temperos e Condimentos', link: 'temperos-e-condimentos' },
  { dep: 'Mercearia', id: 180, name: 'Molhos', link: 'molhos' },
  { dep: 'Mercearia', id: 181, name: 'Sal e Vinagre', link: 'sal-e-vinagre' },
  { dep: 'Mercearia', id: 182, name: 'Grãos e Sementes', link: 'graos-e-sementes' },

  // --- BEBIDAS ---
  { dep: 'Bebidas', id: 142, name: 'Águas', link: 'aguas' },
  { dep: 'Bebidas', id: 143, name: 'Cervejas', link: 'cervejas' },
  { dep: 'Bebidas', id: 144, name: 'Refrigerantes', link: 'refrigerantes' },
  { dep: 'Bebidas', id: 145, name: 'Sucos e Chás', link: 'sucos-e-chas' },
  { dep: 'Bebidas', id: 146, name: 'Energéticos e Isotônicos', link: 'energeticos-e-isotonicos' },
  { dep: 'Bebidas', id: 147, name: 'Vinhos e Espumantes', link: 'vinhos-e-espumantes' },
  { dep: 'Bebidas', id: 148, name: 'Destilados', link: 'destilados' },
  { dep: 'Bebidas', id: 183, name: 'Vodkas e Gins', link: 'vodkas-e-gins' },
  { dep: 'Bebidas', id: 184, name: 'Whiskies', link: 'whiskies' },
  { dep: 'Bebidas', id: 185, name: 'Sucos Concentrados e Em Pó', link: 'sucos-concentrados-e-em-po' },

  // --- LIMPEZA ---
  { dep: 'Limpeza', id: 150, name: 'Detergentes e Sabões em Pó', link: 'detergentes-e-saboes-em-po' },
  { dep: 'Limpeza', id: 151, name: 'Amaciantes', link: 'amaciantes' },
  { dep: 'Limpeza', id: 152, name: 'Desinfetantes e Limpadores', link: 'desinfetantes-e-limpadores' },
  { dep: 'Limpeza', id: 153, name: 'Papel Higiênico e Toalhas', link: 'papel-higienico-e-toalhas' },
  { dep: 'Limpeza', id: 154, name: 'Esponjas e Lãs de Aço', link: 'esponjas-e-las-de-aco' },
  { dep: 'Limpeza', id: 155, name: 'Sacos de Lixo', link: 'sacos-de-lixo' },
  { dep: 'Limpeza', id: 186, name: 'Inseticidas e Repelentes', link: 'inseticidas-e-repelentes' },
  { dep: 'Limpeza', id: 187, name: 'Aromatizadores e Odorizadores', link: 'aromatizadores-e-odorizadores' },
  { dep: 'Limpeza', id: 188, name: 'Sabão em Barra', link: 'sabao-em-barra' },
  { dep: 'Limpeza', id: 189, name: 'Lustra Móveis e Ceras', link: 'lustra-moveis-e-ceras' },

  // --- FRIOS E LATICÍNIOS ---
  { dep: 'Frios e Laticínios', id: 160, name: 'Leites', link: 'leites' },
  { dep: 'Frios e Laticínios', id: 161, name: 'Queijos', link: 'queijos' },
  { dep: 'Frios e Laticínios', id: 162, name: 'Requeijão e Manteigas', link: 'requeijao-e-manteigas' },
  { dep: 'Frios e Laticínios', id: 163, name: 'Iogurtes e Bebidas Lácteas', link: 'iogurtes-e-bebidas-lacteas' },
  { dep: 'Frios e Laticínios', id: 164, name: 'Presuntos e Embutidos', link: 'presuntos-e-embutidos' },
  { dep: 'Frios e Laticínios', id: 190, name: 'Margarinas', link: 'margarinas' },
  { dep: 'Frios e Laticínios', id: 191, name: 'Sobremesas Lácteas', link: 'sobremesas-lacteas' },
  { dep: 'Frios e Laticínios', id: 192, name: 'Creme de Leite e Leite Condensado', link: 'creme-de-leite-e-leite-condensado' },

  // --- HIGIENE E PERFUMARIA ---
  { dep: 'Higiene e Perfumaria', id: 170, name: 'Sabonetes', link: 'sabonetes' },
  { dep: 'Higiene e Perfumaria', id: 171, name: 'Shampoos e Condicionadores', link: 'shampoos-e-condicionadores' },
  { dep: 'Higiene e Perfumaria', id: 172, name: 'Creme Dental e Fio Dental', link: 'creme-dental-e-fio-dental' },
  { dep: 'Higiene e Perfumaria', id: 173, name: 'Desodorantes', link: 'desodorantes' },
  { dep: 'Higiene e Perfumaria', id: 174, name: 'Fraldas e Cuidados com o Bebê', link: 'fraldas-e-cuidados-com-o-bebe' },
  { dep: 'Higiene e Perfumaria', id: 193, name: 'Absorventes e Cuidados Íntimos', link: 'absorventes-e-cuidados-intimos' },
  { dep: 'Higiene e Perfumaria', id: 194, name: 'Barbeadores e Cargas', link: 'barbeadores-e-cargas' },
  { dep: 'Higiene e Perfumaria', id: 195, name: 'Hidratantes e Gel', link: 'hidratantes-e-gel' },

  // --- CONGELADOS ---
  { dep: 'Congelados', id: 196, name: 'Pizzas Congeladas', link: 'pizzas-congeladas' },
  { dep: 'Congelados', id: 197, name: 'Salgados e Empanados', link: 'salgados-e-empanados' },
  { dep: 'Congelados', id: 198, name: 'Batatas Congeladas', link: 'batatas-congeladas' },
  { dep: 'Congelados', id: 199, name: 'Sorvetes e Picolés', link: 'sorvetes-e-picoles' },
  { dep: 'Congelados', id: 200, name: 'Hambúrgueres', link: 'hamburgueres' },

  // --- HORTIFRUTI E FRESCOS ---
  { dep: 'Hortifruti', id: 201, name: 'Frutas', link: 'frutas' },
  { dep: 'Hortifruti', id: 202, name: 'Legumes', link: 'legumes' },
  { dep: 'Hortifruti', id: 203, name: 'Verduras e Temperos Frescos', link: 'verduras-e-temperos-frescos' },
  { dep: 'Hortifruti', id: 204, name: 'Ovos', link: 'ovos' },

  // --- PET SHOP ---
  { dep: 'Pet Shop', id: 205, name: 'Ração para Cães', link: 'racao-para-caes' },
  { dep: 'Pet Shop', id: 206, name: 'Ração para Gatos', link: 'racao-para-gatos' },
  { dep: 'Pet Shop', id: 207, name: 'Petiscos e Acessórios Pet', link: 'petiscos-e-acessorios-pet' },

  // --- BAZAR E UTILIDADES ---
  { dep: 'Bazar', id: 208, name: 'Descartáveis', link: 'descartaveis' },
  { dep: 'Bazar', id: 209, name: 'Utilidades Domésticas', link: 'utilidades-domesticas' },
  { dep: 'Bazar', id: 210, name: 'Lâmpadas e Pilhas', link: 'lampadas-e-pilhas' },
  { dep: 'Bazar', id: 211, name: 'Automotivo', link: 'automotivo' }
];

async function buscarPagina(subcat, page) {
  for (let tentativa = 1; tentativa <= 3; tentativa++) {
    try {
      const r = await client.get(`/store/category/${subcat.id}/products`, {
        params: { 'query[link]': subcat.link, page, order: 'relevance' }
      });
      return r.data;
    } catch (erro) {
      const status = erro.response && erro.response.status;
      if ((status && status < 500 && status !== 429) || tentativa === 3) return null;
      await esperar(1000 * 4 ** (tentativa - 1));
    }
  }
  return null;
}

async function buscarTenda() {
  console.log('=== TENDA ATACADO ===');
  const coletadoEm = new Date().toISOString();
  const saida = [];
  for (const sub of categoriasManuais) {
    let page = 1, totalPaginas = 1, totalSub = 0;
    do {
      const dados = await buscarPagina(sub, page);
      const lista = Array.isArray(dados && dados.products) ? dados.products : (dados && dados.products && dados.products.content) || [];
      totalPaginas = Number(dados && (dados.total_pages || (dados.products && dados.products.totalPages))) || 1;
      for (const p of lista) {
        const linha = mapearTenda(p, coletadoEm);
        if (linha) { saida.push(linha); totalSub++; }
      }
      if (!lista.length) break;
      page++;
      await esperar(PAUSA_MS);
    } while (page <= totalPaginas);
    console.log(`[Tenda] ${sub.dep} > ${sub.name}: ${totalSub} produtos`);
  }
  console.log(`=== TENDA: ${saida.length} produtos ===`);
  return saida;
}

module.exports = buscarTenda;
