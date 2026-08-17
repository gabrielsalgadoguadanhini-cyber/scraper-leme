const axios = require('axios');
const cheerio = require('cheerio');

const client = axios.create({
  baseURL: 'https://www.jauserve.com.br/on/demandware.store/Sites-JauServe-Site/pt_BR',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Referer': 'https://www.jauserve.com.br/'
  },
  timeout: 15000
});

function removerAcentos(texto) {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

const categoriasJauServe = [

    // MERCEARIA
    { dep: 'Mercearia', name: 'Arroz', q: 'arroz' },
    { dep: 'Mercearia', name: 'Feijão', q: 'feijao' },
    { dep: 'Mercearia', name: 'Açúcar', q: 'acucar' },
    { dep: 'Mercearia', name: 'Café', q: 'cafe' },
    { dep: 'Mercearia', name: 'Óleo', q: 'oleo' },
    { dep: 'Mercearia', name: 'Azeite', q: 'azeite' },
    { dep: 'Mercearia', name: 'Macarrão', q: 'macarrao' },
    { dep: 'Mercearia', name: 'Farinha', q: 'farinha' },
    { dep: 'Mercearia', name: 'Biscoito', q: 'biscoito' },
    { dep: 'Mercearia', name: 'Achocolatado', q: 'achocolatado' },
    { dep: 'Mercearia', name: 'Molho', q: 'molho' },
    { dep: 'Mercearia', name: 'Maionese', q: 'maionese' },
    { dep: 'Mercearia', name: 'Ketchup', q: 'ketchup' },
    { dep: 'Mercearia', name: 'Mostarda', q: 'mostarda' },
    { dep: 'Mercearia', name: 'Tempero', q: 'tempero' },
    { dep: 'Mercearia', name: 'Sal', q: 'sal' },
    { dep: 'Mercearia', name: 'Vinagre', q: 'vinagre' },
    { dep: 'Mercearia', name: 'Milho', q: 'milho' },
    { dep: 'Mercearia', name: 'Ervilha', q: 'ervilha' },
    { dep: 'Mercearia', name: 'Atum', q: 'atum' },
    { dep: 'Mercearia', name: 'Sardinha', q: 'sardinha' },

    // BEBIDAS
    { dep: 'Bebidas', name: 'Refrigerante', q: 'refrigerante' },
    { dep: 'Bebidas', name: 'Cerveja', q: 'cerveja' },
    { dep: 'Bebidas', name: 'Suco', q: 'suco' },
    { dep: 'Bebidas', name: 'Água', q: 'agua' },
    { dep: 'Bebidas', name: 'Energético', q: 'energetico' },
    { dep: 'Bebidas', name: 'Chá', q: 'cha' },

    // LIMPEZA
    { dep: 'Limpeza', name: 'Sabão em Pó', q: 'sabao' },
    { dep: 'Limpeza', name: 'Sabão em Barra', q: 'sabao em barra' },
    { dep: 'Limpeza', name: 'Amaciante', q: 'amaciante' },
    { dep: 'Limpeza', name: 'Detergente', q: 'detergente' },
    { dep: 'Limpeza', name: 'Desinfetante', q: 'desinfetante' },
    { dep: 'Limpeza', name: 'Água Sanitária', q: 'agua sanitaria' },
    { dep: 'Limpeza', name: 'Multiuso', q: 'multiuso' },
    { dep: 'Limpeza', name: 'Esponja', q: 'esponja' },
    { dep: 'Limpeza', name: 'Saco de Lixo', q: 'saco de lixo' },
    { dep: 'Limpeza', name: 'Papel Higiênico', q: 'papel higienico' },
    { dep: 'Limpeza', name: 'Papel Toalha', q: 'papel toalha' },

    // FRIOS E LATICÍNIOS
    { dep: 'Frios e Laticínios', name: 'Leite', q: 'leite' },
    { dep: 'Frios e Laticínios', name: 'Queijo', q: 'queijo' },
    { dep: 'Frios e Laticínios', name: 'Presunto', q: 'presunto' },
    { dep: 'Frios e Laticínios', name: 'Mussarela', q: 'mussarela' },
    { dep: 'Frios e Laticínios', name: 'Manteiga', q: 'manteiga' },
    { dep: 'Frios e Laticínios', name: 'Margarina', q: 'margarina' },
    { dep: 'Frios e Laticínios', name: 'Iogurte', q: 'iogurte' },
    { dep: 'Frios e Laticínios', name: 'Requeijão', q: 'requeijao' },
    { dep: 'Frios e Laticínios', name: 'Creme de Leite', q: 'creme de leite' },
    { dep: 'Frios e Laticínios', name: 'Leite Condensado', q: 'leite condensado' },

    // HIGIENE
    { dep: 'Higiene', name: 'Sabonete', q: 'sabonete' },
    { dep: 'Higiene', name: 'Shampoo', q: 'shampoo' },
    { dep: 'Higiene', name: 'Condicionador', q: 'condicionador' },
    { dep: 'Higiene', name: 'Creme Dental', q: 'creme dental' },
    { dep: 'Higiene', name: 'Desodorante', q: 'desodorante' },
    { dep: 'Higiene', name: 'Hidratante', q: 'hidratante' },
    { dep: 'Higiene', name: 'Escova de Dentes', q: 'escova de dentes' },

    // CONGELADOS
    { dep: 'Congelados', name: 'Pizza', q: 'pizza' },
    { dep: 'Congelados', name: 'Hambúrguer', q: 'hamburguer' },
    { dep: 'Congelados', name: 'Batata', q: 'batata congelada' },
    { dep: 'Congelados', name: 'Nuggets', q: 'nuggets' },
    { dep: 'Congelados', name: 'Sorvete', q: 'sorvete' },
    { dep: 'Congelados', name: 'Picolé', q: 'picole' },

    // HORTIFRUTI
    { dep: 'Hortifruti', name: 'Banana', q: 'banana' },
    { dep: 'Hortifruti', name: 'Maçã', q: 'maca' },
    { dep: 'Hortifruti', name: 'Laranja', q: 'laranja' },
    { dep: 'Hortifruti', name: 'Limão', q: 'limao' },
    { dep: 'Hortifruti', name: 'Tomate', q: 'tomate' },
    { dep: 'Hortifruti', name: 'Batata', q: 'batata' },
    { dep: 'Hortifruti', name: 'Cebola', q: 'cebola' },
    { dep: 'Hortifruti', name: 'Alho', q: 'alho' },
    { dep: 'Hortifruti', name: 'Cenoura', q: 'cenoura' },
    { dep: 'Hortifruti', name: 'Alface', q: 'alface' },

    // PET
    { dep: 'Pet Shop', name: 'Ração para Cães', q: 'racao cachorro' },
    { dep: 'Pet Shop', name: 'Ração para Gatos', q: 'racao gato' },
    { dep: 'Pet Shop', name: 'Petisco', q: 'petisco' },

    // OUTROS
    { dep: 'Bazar', name: 'Pilha', q: 'pilha' },
    { dep: 'Bazar', name: 'Lâmpada', q: 'lampada' },
    { dep: 'Bazar', name: 'Papel Alumínio', q: 'papel aluminio' },
    { dep: 'Bazar', name: 'Filme Plástico', q: 'filme plastico' }
];

function extrairProdutosDoHtml(html) {
  const $ = cheerio.load(html);
  const produtos = [];

  $('.product, .product-tile, [data-pid]').each((_, element) => {
    const el = $(element);

    let nome = el.find('.pdp-link a, .product-name, .link, .name').text().trim();
    if (!nome) {
      nome = el.find('a').attr('title') || el.text().trim().split('\n')[0];
    }

    let precoTexto = el.find('.price .sales .value, .sales .value, .price .value, .formatted-price').last().text().trim();

    let precoNum = 0;
    if (precoTexto) {
      const valorLimpo = precoTexto.replace(/[^\d,]/g, '').replace(',', '.');
      precoNum = parseFloat(valorLimpo) || 0;
    }

    nome = nome.replace(/\s+/g, ' ');

    if (nome && nome.length > 3 && precoNum > 0) {
      produtos.push({ nome, preco: precoNum });
    }
  });

  return produtos;
}

async function buscarProdutosPagina(q, start = 0, sz = 36) {
  try {
    const response = await client.get('/Search-UpdateGrid', {
      params: {
        q: encodeURIComponent(removerAcentos(q)),
        start: start,
        sz: sz,
        pmin: '0.01'
      }
    });

    return response.data;
  } catch (error) {
    return null;
  }
}

async function buscarJauServe() {
  console.log('=== INICIANDO SCRAPER JAÚ SERVE ===\n');
  const todosOsProdutos = [];
  let categoriasComSucesso = 0;

  for (const cat of categoriasJauServe) {
    console.log(`[+] [${cat.dep}] Buscando: ${cat.name}...`);
    let start = 0;
    const sz = 36;
    let temMais = true;
    let totalCat = 0;

    while (temMais) {
      const html = await buscarProdutosPagina(cat.q, start, sz);

      if (html) {
        const produtosFiltrados = extrairProdutosDoHtml(html);

        if (produtosFiltrados.length > 0) {
          produtosFiltrados.forEach(p => {
    todosOsProdutos.push({
        preco: p.preco,
        nome: p.nome,
        mercado: "Jaú Serve",
        link: "https://www.jauserve.com.br"
    });
          });

          totalCat += produtosFiltrados.length;

          if (produtosFiltrados.length >= 10 && start < 180) {
            start += sz;
          } else {
            temMais = false;
          }
        } else {
          temMais = false;
        }
      } else {
        temMais = false;
      }

      await new Promise(resolve => setTimeout(resolve, 400));
    }

    if (totalCat > 0) {
      categoriasComSucesso++;
      console.log(`    ✓ Total capturado: ${totalCat} produtos\n`);
    } else {
      console.log(`    [-] Nenhum produto retornado para "${cat.name}"\n`);
    }
  }

  console.log(`=== JAÚ SERVE CONCLUÍDO: ${todosOsProdutos.length} produtos coletados. ===\n`);
  return todosOsProdutos;
}

module.exports = buscarJauServe;