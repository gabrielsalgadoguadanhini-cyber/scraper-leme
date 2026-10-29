# Coletor de preços (scraper-leme) — versão corrigida

Versão revisada do repositório `gabrielsalgadoguadanhini-cyber/scraper-leme`, usado na demonstração do ComparaKi
para os mercados de Leme/SP. Roda no GitHub Actions todos os dias às 06:00 (Brasília) e grava na tabela `produtos` do Supabase.

## O que mudou

| Antes | Agora |
|---|---|
| Gravava só nome, preço e o link da página inicial do mercado | Grava também **imagem**, **código de barras (GTIN)**, **marca**, **disponibilidade**, **link da página do produto** e **data da coleta** |
| Apagava a tabela inteira e depois inseria (se falhasse no meio, o app ficava sem preços) | Substitui **um mercado por vez**, só depois de gravar todos os lotes novos; se algo falhar, desfaz e mantém os preços antigos |
| Mercado fora do ar = mercado some do app | Se a coleta vier vazia ou com menos da metade dos produtos, os preços anteriores são mantidos |
| Gravava preço R$ 0 quando o produto não tinha preço | Linhas sem preço são descartadas |
| Covabra e Savegnago paravam em 2.500 produtos | Busca por departamento (e subcategoria quando passa de 2.500) |
| **Tenda pegava só a 1ª página de cada categoria** (lia `products.pages`, que não existe) | Lê `total_pages` e percorre todas as páginas |
| Sem nova tentativa em erro de rede | 3 tentativas com espera crescente; pausa de 300 ms entre páginas |
| User-agent de navegador | User-agent identificado (`ComparaKi-TCC/1.0`) |
| `node_modules` versionado | `.gitignore` |

**Jaú Serve:** o site exige uma loja selecionada; sem isso a busca devolve 0 produtos. O coletor mantém os preços anteriores
e avisa no log. Caminho recomendado: planilha enviada pelo mercado (`connectors/partner-csv.js` no projeto do app).

## Como publicar

1. **Supabase → SQL Editor:** rode `sql/002_colunas_coletor.sql` (cria as colunas novas e deixa a tabela só-leitura para a chave pública do app).
   Antes, confira se já existe alguma política que libera escrita:
   ```sql
   select policyname, cmd, roles from pg_policies where tablename = 'produtos';
   ```
   Se aparecer política de `INSERT`, `UPDATE` ou `DELETE` para `anon`/`public`, remova-a (`drop policy "<nome>" on public.produtos;`).
2. **Repositório do coletor:** substitua os arquivos pelos desta pasta (`index.js`, `covabra.js`, `savegnago.js`, `tenda.js`, `jauserve.js`, `lib/`, `package.json`, `.gitignore`, `.github/workflows/scraper.yml`) e apague a pasta `node_modules` e o `package-lock.json` antigo do repositório.
3. **GitHub → Actions → Automacao Scraper Leme → Run workflow** para rodar uma vez na hora. No fim do log aparece um resumo por mercado: produtos, quantos com imagem, quantos com código de barras e se foi atualizado ou mantido.
4. **App:** os arquivos de `www/` do projeto já leem as colunas novas. Para a versão na Hostinger, baixe antes o `public_html/comparaki` atual (backup) e depois envie os arquivos novos.

Os segredos `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` continuam os mesmos no GitHub (Settings → Secrets → Actions).

## Testes
Os mapeamentos (`lib/mapear.js`) são testados com respostas reais das APIs no projeto do app: `sh tests/run.sh`.
Não foi possível rodar a coleta completa nesta máquina (sem Node.js); a primeira execução real é a do passo 3.
