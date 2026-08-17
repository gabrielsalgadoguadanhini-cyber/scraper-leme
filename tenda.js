const axios = require('axios');

const STORE_ID = '4'; // Filial Leme/Padrão

const client = axios.create({
  baseURL: 'https://api.tendaatacado.com.br/api/public',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
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

function extrairNomeEPreco(listaBruta) {
  if (!Array.isArray(listaBruta)) return [];

  return listaBruta.map(item => ({
    nome: item.name || item.title || 'Sem Nome',
    preco: item.price || item.sellPrice || item.finalPrice || 0
  }));
}

async function buscarProdutosPagina(subcat, page) {
  try {
    const response = await client.get(`/store/category/${subcat.id}/products`, {
      params: {
        'query[link]': subcat.link,
        page: page,
        order: 'relevance'
      }
    });

    return response.data;
  } catch (error) {
    return null;
  }
}

async function buscarTenda() {
  console.log('=== INICIANDO SCRAPER TENDA ATACADO ===\n');
  const todosOsProdutos = [];
  let subcategoriasComSucesso = 0;

  for (const sub of categoriasManuais) {
    console.log(`[+] [${sub.dep}] ${sub.name} (ID: ${sub.id})...`);
    let page = 1;
    let temMaisPaginas = true;
    let totalSubcat = 0;

    while (temMaisPaginas) {
      const resData = await buscarProdutosPagina(sub, page);

      const listaBruta = resData?.products?.content || (Array.isArray(resData?.products) ? resData.products : []);
      const totalPaginas = resData?.products?.pages || resData?.products?.totalPages || 1;

      if (Array.isArray(listaBruta) && listaBruta.length > 0) {
        const produtosFiltrados = extrairNomeEPreco(listaBruta);

       produtosFiltrados.forEach(p => {
    todosOsProdutos.push({
        preco: p.preco,
        nome: p.nome,
        mercado: "Tenda Atacado",
        link: "https://www.tendaatacado.com.br"
    });
});

        totalSubcat += produtosFiltrados.length;

        if (page < totalPaginas) {
          page++;
        } else {
          temMaisPaginas = false;
        }
      } else {
        temMaisPaginas = false;
      }

      await new Promise(resolve => setTimeout(resolve, 300));
    }

    if (totalSubcat > 0) {
      subcategoriasComSucesso++;
      console.log(`    ✓ Total capturado: ${totalSubcat} produtos\n`);
    } else {
      console.log(`    [-] ID ${sub.id} não possui produtos nesta loja\n`);
    }
  }

  console.log(`=== TENDA ATACADO CONCLUÍDO: ${todosOsProdutos.length} produtos coletados. ===\n`);
  return todosOsProdutos;
}

module.exports = buscarTenda;