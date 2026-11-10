# Listas "Quero ver" e "Já vi" com login — Design

Data: 2026-11-10
Status: aprovado em conversa, aguardando revisão da especificação escrita

## Objetivo

Permitir que a pessoa marque filmes que quer assistir e filmes que já assistiu, e navegue por essas listas em abas na página inicial. Para isso, ela cria uma conta com e-mail e senha. Contas e marcações ficam no Supabase.

## Decisões tomadas

| Pergunta | Decisão |
|---|---|
| Quem não entrou pode ver o catálogo? | Sim. O login só é pedido ao marcar um filme ou abrir uma lista. |
| Filme que sai do streaming | Continua na lista, com o aviso "Fora do streaming agora". |
| Filme em duas listas | Não. Cada filme fica em uma lista só ou em nenhuma. Marcar "Já vi" tira o filme de "Quero ver". |
| Onde marcar | Ícones pequenos no cartão da grade e botões maiores na página de detalhes. |
| Recursos da conta | Só o básico: criar conta, entrar, sair. Sem confirmação por e-mail e sem "esqueci a senha". |
| Arquitetura | O servidor do site conversa com o Supabase (`@supabase/ssr`, sessão em cookie). |

## Fora do escopo desta versão

- Confirmação de e-mail, recuperação de senha, login social.
- Marcar o filme automaticamente depois do login. A pessoa volta à página e clica de novo.
- Filtros, busca e paginação dentro das listas.
- Notas, comentários ou compartilhamento de listas.

## 1. Banco de dados

Uma tabela no Supabase, `public.marcacoes`:

| coluna | tipo | regra |
|---|---|---|
| `usuario_id` | `uuid` | referência a `auth.users(id)`, `on delete cascade`, padrão `auth.uid()` |
| `filme_id` | `integer` | id do filme no TMDB |
| `lista` | `text` | `check (lista in ('quero_ver', 'ja_vi'))` |
| `criado_em` | `timestamptz` | padrão `now()`. É atualizada quando o filme troca de lista. |

- **Chave primária:** `(usuario_id, filme_id)`. Isso garante, no próprio banco, que um filme esteja em uma lista só.
- **Marcar ou trocar de lista:** `upsert` na chave primária, com `lista` e `criado_em` novos.
- **Desmarcar:** `delete` da linha.
- **O banco não guarda título nem pôster.** Esses dados vêm do TMDB na hora de exibir, o que também mostra se o filme ainda está no streaming.
- **RLS ligado.** As políticas de `select`, `insert`, `update` e `delete` exigem `usuario_id = auth.uid()`.
- O SQL completo fica versionado em `supabase/schema.sql`. A pessoa cola esse arquivo no editor de SQL do painel do Supabase.

## 2. Login e conta

- **Página `/entrar`:** duas abas, **Entrar** e **Criar conta**, cada uma com e-mail, senha e botão. Os formulários chamam Server Actions que usam `signInWithPassword` e `signUp`.
- **Mensagens de erro em português:** "E-mail ou senha incorretos", "Este e-mail já tem conta", "A senha precisa ter pelo menos 6 caracteres" e uma mensagem genérica para os demais casos.
- **Voltar para onde estava:** `/entrar?voltar=<caminho>`. Depois do login ou do cadastro, a pessoa é redirecionada para `voltar`. O site só aceita caminhos internos que começam com `/` e não com `//`, para que o parâmetro não sirva de redirecionamento para outro site.
- **Topo do site:** quem não entrou vê o link **Entrar**. Quem entrou vê o e-mail e o botão **Sair**, que chama uma Server Action com `signOut` e volta para `/`.
- **`proxy.ts` na raiz:** renova a sessão do Supabase a cada requisição, seguindo o padrão do `@supabase/ssr`. O arquivo se chama `proxy.ts` porque, no Next.js 16, `middleware.ts` foi descontinuado e renomeado. O matcher ignora arquivos estáticos e imagens.
- **Clientes Supabase:** `lib/supabase/servidor.ts` cria o cliente para Server Components e Server Actions, usando `cookies()` do Next. Quando necessário, `lib/supabase/navegador.ts` cria o cliente do navegador.
- **Variáveis em `.env.local`:** `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. A chave pública pode ir ao navegador porque o RLS protege os dados. A senha do banco e a chave `service_role` não são usadas.
- **No painel do Supabase:** desligar **Confirm email** em Authentication → Providers → Email.

## 3. Abas, botões e listas

### Abas

- Ficam abaixo do destaque, na página inicial, e são controladas pelo parâmetro `aba` da URL: sem parâmetro mostra **Em streaming**, `aba=quero-ver` mostra **Quero ver** e `aba=ja-vi` mostra **Já vi**. Um valor desconhecido mostra **Em streaming**.
- **Em streaming:** comportamento atual, com destaque, filtros, busca e "Carregar mais".
- **Quero ver / Já vi:** sem destaque, filtros nem paginação. Mostra a grade de `CardFilme`, ordenada por `criado_em`, da mais recente para a mais antiga. Os dados de cada filme vêm do TMDB (detalhes e provedores no Brasil), com o cache que o projeto já usa. Cartões de filmes que saíram do streaming por assinatura mostram o selo **"Fora do streaming agora"**.
- **Lista vazia:** "Nenhum filme aqui ainda. Marque filmes no catálogo."
- **Quem não entrou, numa aba de lista:** vê "Entre para montar suas listas" e um botão **Entrar**, que leva a `/entrar?voltar=/?aba=...`.
- **Filme que o TMDB não encontra mais:** fica de fora da exibição, sem quebrar a página, e a linha continua no banco.

### Botões de marcar

- Um componente cliente, `BotaoMarcar`, com duas variantes:
  - **compacta:** dois ícones no canto da imagem do `CardFilme`, um marcador para "Quero ver" e um "✓" para "Já vi";
  - **completa:** dois botões com texto na página de detalhes.
- **Estados:** nenhum, quero ver ou já vi. O botão ativo fica aceso.
  - clicar no botão ativo desmarca;
  - clicar no outro troca de lista.
- **No cartão:** o clique não navega para a página do filme. Os ícones ficam fora do `<Link>` (posicionados sobre a imagem) ou interrompem a navegação.
- **Atualização otimista:** o estado muda na hora (`useOptimistic`), e a Server Action `marcarFilme(filmeId, lista | null)` grava no banco e revalida a página. Se der erro, o estado volta ao anterior e aparece "Não deu para salvar, tente de novo".
- **Quem não entrou:** o clique leva a `/entrar?voltar=<página atual>`.
- **Acessibilidade:** cada botão tem `aria-pressed` e um rótulo com o nome do filme, por exemplo "Marcar Clube da Luta como quero ver".

### Carregar as marcações

- Ao montar uma página, o servidor busca **todas** as marcações da pessoa numa consulta só e monta um `Map<filmeId, lista>`, que é repassado à grade e aos cartões. Não há uma consulta por filme.
- O "Carregar mais" (`BotaoCarregarMais`) busca as páginas seguintes no navegador, pela rota `/api/filmes`. Como o servidor já buscou **todas** as marcações da pessoa, a página repassa essas marcações ao botão como objeto simples (`Record<number, Lista>`), e os cartões carregados depois usam a mesma tabela. A rota `/api/filmes` não muda.

## Organização do código

- `lib/supabase/`: criação dos clientes (servidor e navegador). É o único lugar que importa `@supabase/ssr`.
- `lib/marcacoes/`: `listarMarcacoes()`, `marcarFilme()` e os tipos `Lista = "quero_ver" | "ja_vi"`. O resto do site só usa estas funções.
- `lib/abas.ts`: lê e escreve o parâmetro `aba`. É uma função pura.
- `app/entrar/`: página e Server Actions de login, cadastro e saída.
- `components/`: `BotaoMarcar`, `AbasCatalogo`, `ListaMarcados` e `MenuConta`. O `CardFilme` recebe a marcação e o selo de fora do streaming.
- `proxy.ts` e `supabase/schema.sql` na raiz.

## Erros

| Situação | Comportamento |
|---|---|
| Supabase fora do ar ao abrir a página | O catálogo carrega normalmente, sem marcações. As abas de lista mostram "Não deu para carregar suas listas agora". |
| Falha ao salvar uma marcação | O botão volta ao estado anterior e aparece uma mensagem curta. |
| Sessão expirada ao marcar | Tratada como "não entrou": leva a `/entrar?voltar=...`. |
| Variáveis do Supabase ausentes | Erro claro no servidor, indicando quais variáveis faltam no `.env.local`. |

## Testes

**Automáticos (Vitest)**, com `lib/marcacoes` e os clientes Supabase substituídos por versões falsas:

- `lib/abas.ts`: valores válidos, ausente e desconhecido.
- Validação do parâmetro `voltar`: aceita caminhos internos e rejeita `//`, `http://` e vazio.
- `BotaoMarcar`: os três estados, troca de lista, desmarcar, volta ao estado anterior em caso de erro e redirecionamento de quem não entrou.
- `ListaMarcados`: ordem, selo "Fora do streaming agora", lista vazia e filme não encontrado.
- `/entrar`: alternância entre as abas e exibição das mensagens de erro.
- Os 71 testes existentes continuam passando.

**Manual, com o Supabase real:**

1. Criar conta, entrar, marcar filmes no cartão e na página de detalhes, trocar de lista e desmarcar.
2. Sair, entrar de novo e conferir que as marcações continuam lá.
3. Criar uma segunda conta e confirmar que ela não vê as marcações da primeira.

## Pré-requisitos

1. Criar a conta e o projeto no Supabase, na região South America (São Paulo).
2. Desligar **Confirm email**.
3. Rodar `supabase/schema.sql` no editor de SQL.
4. Preencher `.env.local` com a URL e a chave pública do projeto.
