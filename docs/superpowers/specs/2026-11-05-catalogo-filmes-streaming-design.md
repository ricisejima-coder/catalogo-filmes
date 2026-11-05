# Catálogo de Filmes em Streaming — Design

**Data:** 2026-11-05
**Status:** aprovado

## 1. Objetivo

App web que mostra os filmes disponíveis **agora** nos streamings **por assinatura no Brasil**, usando a API do TMDB.

- **Para quem:** projeto de estudo e portfólio. Prioridades: código limpo e didático, visual caprichado, link público para mostrar.
- **Sucesso:** abrir o site, escolher um ou mais streamings (e opcionalmente um gênero), e encontrar um filme para assistir em menos de 1 minuto; o site publicado na Vercel com link compartilhável.

### Fora do escopo (versão 1)

Filtros extras (ano, nota mínima, duração), favoritos/"quero assistir", login de usuário, outros países, aluguel/compra/grátis, séries.

## 2. Decisões fechadas

| Tema | Decisão |
|---|---|
| Plataforma | Web |
| Stack | Next.js (App Router) + TypeScript + Tailwind CSS |
| Testes | Vitest + Testing Library; TDD (teste antes do código) |
| Deploy | Vercel; token em variável de ambiente `TMDB_READ_TOKEN` |
| Região | Somente Brasil (`watch_region=BR`) |
| Tipo de disponibilidade | Somente assinatura (`flatrate`) |
| Idioma | Interface e dados do TMDB em pt-BR (`language=pt-BR`) |
| Busca por título | Mostra apenas filmes que estão em algum streaming por assinatura no BR |

## 3. Arquitetura

```
Navegador ──► Páginas Next.js (servidor) ──► lib/tmdb ──► api.themoviedb.org/3
                    │                          └─ único lugar que conhece o token
                    └─ filtros na URL
```

- **O token nunca vai para o navegador.** Todas as chamadas ao TMDB acontecem no servidor (Server Components e um Route Handler).
- **Os filtros ficam na URL**, o que faz funcionar o botão voltar e os links compartilháveis. Exemplo: `/?streaming=8,119&genero=28&ordem=populares&busca=batman`.
- **Uma única camada (`lib/tmdb`) fala com o TMDB.** Ela adiciona os parâmetros fixos (idioma, região, monetização), trata erros e devolve tipos próprios do app, já limpos. Páginas e componentes nunca chamam a API diretamente.
- **Cache** (via `fetch` com `next.revalidate`):
  - lista de streamings e lista de gêneros: 24 h
  - páginas do catálogo, busca e disponibilidade de cada filme: 6 h
  - detalhes do filme: 24 h

### Estrutura de pastas

```
app/
  layout.tsx              # cabeçalho, rodapé com atribuição TMDB + JustWatch
  page.tsx                # Tela 1: Catálogo (renderiza a primeira página no servidor)
  loading.tsx             # esqueletos de cards
  error.tsx               # erro amigável + "Tentar de novo"
  filme/[id]/page.tsx     # Tela 2: Detalhes
  filme/[id]/not-found.tsx
  api/filmes/route.ts     # usado pelo botão "Carregar mais" (próximas páginas)
lib/
  filtros.ts              # lê/escreve os filtros da URL (tipo Filtros)
  tmdb/
    cliente.ts            # fetch autenticado, erros, cache
    catalogo.ts           # descobrirFilmes(), buscarFilmes()
    detalhes.ts           # obterDetalhes()
    referencias.ts        # listarStreamings(), listarGeneros()
    tipos.ts              # tipos do app (FilmeResumo, FilmeDetalhe, Streaming, Genero)
    imagens.ts            # monta URLs de imagem
components/
  BarraFiltros.tsx, SeletorStreamings.tsx, SeletorGenero.tsx,
  SeletorOrdem.tsx, CampoBusca.tsx, GradeFilmes.tsx, CardFilme.tsx,
  BotaoCarregarMais.tsx, EstadoVazio.tsx, OndeAssistir.tsx,
  Elenco.tsx, Trailer.tsx
```

## 4. Modelo de filtros (`lib/filtros.ts`)

```ts
type Ordem = "populares" | "avaliados" | "recentes";
type Filtros = {
  streamings: number[]; // ids de provedores TMDB; vazio = todos
  genero?: number;      // id de gênero TMDB
  ordem: Ordem;         // padrão: "populares"
  busca?: string;       // texto aparado; vazio = sem busca
};
```

- Parâmetros da URL: `streaming` (ids separados por vírgula), `genero`, `ordem`, `busca`.
- Valores inválidos (ids não numéricos, ordem desconhecida) são ignorados e substituídos pelo padrão; nunca causam erro.

## 5. Funcionalidades e uso da API

### 5.1 Lista de streamings e gêneros
- `GET /watch/providers/movie?watch_region=BR&language=pt-BR`: o app mostra os **12 primeiros** por `display_priority`, com o logo de cada um.
- `GET /genre/movie/list?language=pt-BR`

### 5.2 Catálogo em grade (sem busca)
`GET /discover/movie` com:
- fixos: `language=pt-BR`, `watch_region=BR`, `with_watch_monetization_types=flatrate`, `include_adult=false`
- `with_watch_providers`: os ids selecionados unidos por `|` (OU). **Sem seleção, usa os ids de todos os streamings da lista da 5.1**, para garantir que só apareçam filmes disponíveis em algum deles.
- `with_genres`: o gênero, se houver
- ordem:
  - `populares` → `sort_by=popularity.desc`
  - `avaliados` → `sort_by=vote_average.desc` + `vote_count.gte=300` (evita filmes obscuros com nota 10)
  - `recentes` → `sort_by=primary_release_date.desc` + `primary_release_date.lte=<hoje>` (evita filmes que ainda não estrearam)
- `page`: 20 filmes por página. O TMDB limita a 500 páginas; o botão "Carregar mais" some ao chegar em `total_pages` ou em 500.

Cada card mostra: pôster (`w342`), título, ano e nota (uma casa decimal). Clicar abre `/filme/[id]`.

### 5.3 Busca por título
Quando `busca` está preenchida:
1. `GET /search/movie?query=<busca>&language=pt-BR&include_adult=false&page=N`
2. Para cada resultado, `GET /movie/{id}/watch/providers` (em paralelo, com cache de 6 h). O filme é mantido apenas se `results.BR.flatrate` tiver algum item.
3. Se houver streamings selecionados, mantém apenas filmes com pelo menos um deles em `flatrate`.
4. Se houver gênero selecionado, mantém apenas filmes cujo `genre_ids` o contenha.
5. A **ordem é ignorada** durante a busca (vale a relevância do TMDB), e o seletor de ordem fica desabilitado com a dica "Ordenado por relevância".

Como a filtragem acontece depois, uma página de busca pode trazer menos de 20 filmes, ou nenhum. "Carregar mais" continua disponível até `total_pages` da busca. Se uma página filtrada vier vazia, o servidor avança automaticamente para a próxima, até **3 páginas por clique**.

### 5.4 Página de detalhes
`GET /movie/{id}?language=pt-BR&append_to_response=credits,videos,watch/providers&include_video_language=pt,en`

Mostra: pôster (`w500`), imagem de fundo (`w1280`, se houver), título, título original (se diferente), ano, duração (ex.: "2h 15min"), gêneros, nota, sinopse.
- **Onde assistir:** logos de `watch/providers.results.BR.flatrate`. Se estiver vazio: "No momento não está em nenhum streaming por assinatura no Brasil."
- **Elenco:** até 10 primeiros de `credits.cast`, com foto (`w185`) ou um avatar padrão.
- **Trailer:** o primeiro vídeo com `site=YouTube` e `type=Trailer`, priorizando pt-BR. É incorporado via `youtube-nocookie.com`. Sem trailer, a seção não aparece.
- TMDB retornando 404 → `notFound()` → página "Filme não encontrado".

## 6. Tratamento de erros e estados

| Situação | Comportamento |
|---|---|
| Carregando | `loading.tsx` com esqueletos de cards |
| Nenhum resultado | "Nenhum filme encontrado com esses filtros" + botão "Limpar filtros" (volta para `/`) |
| TMDB fora do ar, 5xx, timeout (8 s) ou 429 | `lib/tmdb/cliente.ts` lança `ErroTmdb`; `error.tsx` mostra "Não conseguimos carregar os filmes agora" + "Tentar de novo" |
| Falha no "Carregar mais" | Mensagem curta abaixo da grade + o botão vira "Tentar de novo"; os filmes já carregados permanecem |
| Falha ao checar a disponibilidade de um filme na busca | Esse filme é descartado; a busca continua |
| Pôster ausente | Imagem padrão local (`/public/sem-poster.svg`) |
| Elenco ou trailer ausentes | A seção não é exibida |
| Token ausente | Na primeira chamada ao TMDB, `cliente.ts` lança um erro claro: "Defina TMDB_READ_TOKEN em .env.local" |

## 7. Requisitos legais e de atribuição
- Rodapé com o logo do TMDB e o texto "Este produto usa a API do TMDB, mas não é endossado nem certificado pelo TMDB."
- Na seção "Onde assistir" e no rodapé: "Dados de streaming fornecidos por JustWatch."

## 8. Testes
- **`lib/filtros.ts`:** leitura e escrita da URL, valores inválidos, padrões.
- **`lib/tmdb/*`:** com `fetch` simulado (sem internet), verificam que cada filtro gera os parâmetros corretos, que respostas do TMDB são convertidas para os tipos do app, que a busca filtra corretamente por disponibilidade/streaming/gênero, e que os erros (404, 5xx, timeout) se comportam como descrito.
- **Componentes:** card (com e sem pôster), barra de filtros (atualiza a URL), estado vazio, "Onde assistir" (com e sem streamings), "Carregar mais" (sucesso, fim e erro).
- Abordagem TDD: o teste de cada unidade é escrito antes da implementação.

## 9. Pré-requisitos do usuário
- Conta grátis no TMDB e o **API Read Access Token**, salvo em `.env.local` (arquivo fora do git).
- Mais tarde: conta grátis na Vercel (login com GitHub) para o deploy.
