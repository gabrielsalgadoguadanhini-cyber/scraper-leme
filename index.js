// index.js - coleta os 4 mercados e atualiza a tabela `produtos` com segurança.
//
// O que mudou em relação à versão anterior:
//  - Não apaga a tabela inteira antes de inserir. Cada mercado é substituído separadamente,
//    e só depois que TODOS os lotes novos dele foram gravados (se um lote falhar, os novos são
//    removidos e os preços antigos continuam no app).
//  - Se um mercado vier vazio ou com menos da metade dos produtos de antes, os preços antigos
//    dele são mantidos (proteção contra site fora do ar ou coleta quebrada).
//  - Grava imagem, código de barras, marca, disponibilidade, link do produto e data da coleta.
//    Se essas colunas ainda não existirem no banco, grava só os campos antigos e avisa.
//  - Preço zero ou vazio não é gravado.
const { createClient } = require('@supabase/supabase-js');
const WebSocket = require('ws');
const { deduplicar, podeSubstituir } = require('./lib/mapear');

const COLETORES = [
  ['Covabra (Leme)', require('./covabra')],
  ['Jaú Serve', require('./jauserve')],
  ['Savegnago (Leme)', require('./savegnago')],
  ['Tenda Atacado', require('./tenda')],
];
const CAMPOS_ANTIGOS = ['mercado', 'nome', 'preco', 'link'];
const TAMANHO_LOTE = 500;

let rawUrl = (process.env.SUPABASE_URL || 'https://dqrcdgxsxpdpvukhmdry.supabase.co').replace(/["']/g, '').trim();
if (!/^https?:\/\//.test(rawUrl)) rawUrl = `https://${rawUrl}`;
const SUPABASE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
if (!SUPABASE_KEY) {
  console.error('❌ ERRO: a variável de ambiente SUPABASE_SERVICE_ROLE_KEY não foi configurada.');
  process.exit(1);
}
const supabase = createClient(rawUrl, SUPABASE_KEY, { auth: { persistSession: false }, realtime: { transport: WebSocket } });

let soCamposAntigos = false;

async function contarAtuais(mercado) {
  const { count, error } = await supabase.from('produtos').select('id', { count: 'exact', head: true }).eq('mercado', mercado);
  if (error) throw new Error(`contagem de ${mercado}: ${error.message}`);
  return count || 0;
}

function semCamposNovos(linhas) {
  return linhas.map(l => Object.fromEntries(CAMPOS_ANTIGOS.map(c => [c, l[c]])));
}

async function inserirLote(lote) {
  let r = await supabase.from('produtos').insert(soCamposAntigos ? semCamposNovos(lote) : lote).select('id');
  // Coluna inexistente (migração não aplicada): grava só os campos antigos daqui em diante
  if (r.error && !soCamposAntigos && /column|coluna|schema cache/i.test(r.error.message)) {
    console.warn(`⚠️ O banco ainda não tem as colunas novas (${r.error.message}).`);
    console.warn('   Gravando só nome/preço/link. Rode coletor/sql/002_colunas_coletor.sql no Supabase para salvar imagem e código de barras.');
    soCamposAntigos = true;
    r = await supabase.from('produtos').insert(semCamposNovos(lote)).select('id');
  }
  if (r.error) throw new Error(r.error.message);
  return r.data.map(x => x.id);
}

async function substituirMercado(mercado, linhas) {
  const anteriores = await contarAtuais(mercado);
  const decisao = podeSubstituir(linhas.length, anteriores);
  if (!decisao.ok) {
    console.warn(`⚠️ ${mercado}: ${decisao.motivo}. Mantendo os ${anteriores} preços anteriores.`);
    return { mercado, status: 'mantido', anteriores, novos: linhas.length };
  }
  const novosIds = [];
  try {
    for (let i = 0; i < linhas.length; i += TAMANHO_LOTE) {
      novosIds.push(...await inserirLote(linhas.slice(i, i + TAMANHO_LOTE)));
      console.log(`   ✓ ${mercado}: ${Math.min(i + TAMANHO_LOTE, linhas.length)}/${linhas.length}`);
    }
  } catch (erro) {
    console.error(`❌ ${mercado}: falha ao inserir (${erro.message}). Desfazendo os novos e mantendo os antigos.`);
    for (let i = 0; i < novosIds.length; i += 500) {
      await supabase.from('produtos').delete().in('id', novosIds.slice(i, i + 500));
    }
    return { mercado, status: 'erro', anteriores, novos: 0 };
  }
  // Só agora remove os preços antigos deste mercado (ids anteriores ao primeiro id novo)
  const primeiroNovo = Math.min(...novosIds);
  const { error } = await supabase.from('produtos').delete().eq('mercado', mercado).lt('id', primeiroNovo);
  if (error) console.error(`⚠️ ${mercado}: novos gravados, mas os antigos não foram removidos (${error.message}).`);
  return { mercado, status: 'atualizado', anteriores, novos: linhas.length };
}

(async () => {
  const inicio = Date.now();
  const resumo = [];
  try {
    for (const [mercado, coletar] of COLETORES) {
      console.log(`\n--- ${mercado} ---`);
      let linhas = [];
      try {
        linhas = deduplicar(await coletar());
      } catch (erro) {
        console.error(`❌ ${mercado}: coleta falhou (${erro.message}).`);
      }
      const comImagem = linhas.filter(l => l.imagem_url).length;
      const comGtin = linhas.filter(l => l.gtin).length;
      console.log(`📦 ${mercado}: ${linhas.length} produtos · ${comImagem} com imagem · ${comGtin} com código de barras`);
      resumo.push(Object.assign(await substituirMercado(mercado, linhas), { comImagem, comGtin }));
    }
  } catch (erro) {
    console.error('❌ Erro crítico:', erro);
    process.exitCode = 1;
  }
  console.log('\n================ RESUMO ================');
  console.table(resumo);
  console.log(`Duração: ${Math.round((Date.now() - inicio) / 1000)} s`);
  if (resumo.some(r => r.status === 'erro')) process.exitCode = 1;
})();
