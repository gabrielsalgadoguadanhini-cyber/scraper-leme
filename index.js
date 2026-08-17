const { createClient } = require('@supabase/supabase-js');

const buscarCovabra = require('./covabra');
const buscarJauServe = require('./jauserve');
const buscarSavegnago = require('./savegnago');
const buscarTenda = require('./tenda');

// Variáveis de Ambiente (Configuradas no GitHub Actions ou arquivo .env)
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://dqrcdgxsxpdpvukhmdry.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_KEY) {
  console.error("❌ ERRO: A variável de ambiente SUPABASE_SERVICE_ROLE_KEY não foi configurada.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

(async () => {
  try {
    console.log("==================================================");
    console.log("🚀 INICIANDO RASPAGEM DOS 4 MERCADOS DE LEME-SP");
    console.log("==================================================\n");

    // 1. Coleta os dados de cada supermercado
    console.log("--- 1/4: BUSCANDO COVABRA ---");
    const covabra = typeof buscarCovabra === 'function' ? await buscarCovabra() : [];

    console.log("\n--- 2/4: BUSCANDO JAÚ SERVE ---");
    const jauServe = typeof buscarJauServe === 'function' ? await buscarJauServe() : [];

    console.log("\n--- 3/4: BUSCANDO SAVEGNAGO ---");
    const savegnago = typeof buscarSavegnago === 'function' ? await buscarSavegnago() : [];

    console.log("\n--- 4/4: BUSCANDO TENDA ATACADO ---");
    const tenda = typeof buscarTenda === 'function' ? await buscarTenda() : [];

    // Unifica todos os produtos em um único array
    const todosProdutos = [
      ...covabra,
      ...jauServe,
      ...savegnago,
      ...tenda
    ];

    console.log(`\n==================================================`);
    console.log(`📦 Total coletado: ${todosProdutos.length} produtos.`);
    console.log("==================================================\n");

    if (todosProdutos.length === 0) {
      console.warn("⚠️ Nenhum produto foi retornado pelas raspagens. A atualização foi cancelada.");
      return;
    }

    console.log("⏳ Limpando banco de dados para atualização...");
    
    // Limpa os registros antigos da tabela 'produtos'
    const { error: deleteError } = await supabase
      .from('produtos')
      .delete()
      .neq('id', 0);

    if (deleteError) {
      console.error("❌ Erro ao limpar tabela no Supabase:", deleteError.message);
      process.exit(1);
    }

    console.log("🚀 Enviando novos produtos para o Supabase...");

    // Insere os produtos novos em lotes de 500 itens
    const TAMANHO_LOTE = 500;
    for (let i = 0; i < todosProdutos.length; i += TAMANHO_LOTE) {
      const lote = todosProdutos.slice(i, i + TAMANHO_LOTE);
      
      const { error: insertError } = await supabase
        .from('produtos')
        .insert(lote);

      if (insertError) {
        console.error(`❌ Erro ao inserir lote de ${i} até ${i + lote.length}:`, insertError.message);
      } else {
        console.log(`   ✓ Lote enviado: ${i + lote.length}/${todosProdutos.length} produtos.`);
      }
    }

    console.log("\n==================================================");
    console.log("✅ PROCESSO CONCLUÍDO COM SUCESSO!");
    console.log("📄 Banco de dados Supabase totalmente atualizado.");
    console.log("==================================================");

  } catch (erro) {
    console.error("❌ Erro crítico durante a execução:", erro);
    process.exit(1);
  }
})();