# Catálogo de Filmes em Streaming — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** App web em Next.js que lista os filmes disponíveis por assinatura nos streamings do Brasil, com filtros, busca e página de detalhes, usando a API do TMDB.

**Architecture:** Next.js App Router. Toda chamada ao TMDB passa por `lib/tmdb` e roda no servidor, então o token nunca chega ao navegador. Os filtros vivem na URL e são lidos e escritos por `lib/filtros.ts`. A primeira página do catálogo é renderizada no servidor, e as páginas seguintes vêm de `GET /api/filmes`.

**Tech Stack:** Next.js (App Router, versão estável mais recente) + React + TypeScript, Tailwind CSS, Vitest + Testing Library + jsdom, deploy na Vercel.

**Spec:** `docs/superpowers/specs/2026-11-05-catalogo-filmes-streaming-design.md`

## Global Constraints

- Região fixa `watch_region=BR`; monetização fixa `with_watch_monetization_types=flatrate`; idioma `language=pt-BR`; `include_adult=false` em discover e search.
- O token é lido somente de `process.env.TMDB_READ_TOKEN`, só em código de servidor (`lib/tmdb/cliente.ts`). Ele nunca aparece em componentes `"use client"`.
- Cache (`next: { revalidate }`): streamings e gêneros 86400 s; catálogo, busca e disponibilidade por filme 21600 s; detalhes 86400 s.
- Timeout de 8 s em toda chamada ao TMDB.
- Textos de interface em pt-BR, copiados literalmente da spec (seção 6 e 7).
- Base de imagens: `https://image.tmdb.org/t/p/{tamanho}{caminho}`. Tamanhos: card `w342`, pôster de detalhe `w500`, fundo `w1280`, elenco `w185`, logos `w92`.
- Testes ficam ao lado do arquivo testado (`x.ts` → `x.test.ts`). Nenhum teste acessa a internet: `fetch` é sempre simulado.
- Next.js 15+: `params` e `searchParams` das páginas são `Promise` e precisam de `await`.

## Review Focus

1. **Busca com acentos e símbolos** (`"Ação & Cia"`): a query deve ser codificada corretamente, sem quebrar a URL. Teste na Task 6.
2. **Busca só com espaços** (`busca=%20%20`): tratada como "sem busca", mostrando o catálogo normal. Teste na Task 2.
3. **URL com ids de streaming repetidos ou lixo** (`streaming=8,abc,8`): vira `[8]`, sem erro. Teste na Task 2.
4. **`/filme/abc`** (id não numérico): mostra "Filme não encontrado" em vez de erro 500. Teste na Task 11.
5. **`/api/filmes?pagina=9999` ou `pagina=-1`**: a página é limitada ao intervalo 1–500, sem pedido inválido ao TMDB. Teste na Task 10.

---

### Task 1: Projeto base, layout e rodapé de atribuição

**Files:**
- Create: projeto Next.js na raiz (via `create-next-app`), `vitest.config.mts`, `vitest.setup.ts`, `.env.example`, `public/sem-poster.svg`, `public/sem-foto.svg`, `public/tmdb-logo.svg`
- Modify: `app/layout.tsx`, `app/page.tsx` (placeholder), `next.config.ts`, `package.json` (script `test`), `.gitignore`
- Test: `app/Rodape.test.tsx`
- Create: `app/Rodape.tsx`

**Interfaces:**
- Produces: `Rodape()` (componente sem props); comando `npm test` (executa `vitest run`).

- [ ] **Step 1: Criar o projeto**

Run: `npx create-next-app@latest . --ts --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-npm`
Se o comando recusar a pasta por já haver arquivos, mova `docs/` temporariamente para fora, rode de novo e traga `docs/` de volta. Depois confira se `.gitignore` contém `.env*.local`.

- [ ] **Step 2: Instalar e configurar os testes**

Run: `npm i -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event vite-tsconfig-paths`
`vitest.config.mts`: plugins `react()` e `tsconfigPaths()`, `test.environment: "jsdom"`, `test.setupFiles: ["./vitest.setup.ts"]`. O `vitest.setup.ts` importa `@testing-library/jest-dom/vitest`. Em `package.json`, defina `"test": "vitest run"`.

- [ ] **Step 3: Escrever o teste que falha**

```tsx
// app/Rodape.test.tsx
it("mostra as atribuições do TMDB e do JustWatch", () => {
  render(<Rodape />);
  expect(screen.getByText("Este produto usa a API do TMDB, mas não é endossado nem certificado pelo TMDB.")).toBeInTheDocument();
  expect(screen.getByText("Dados de streaming fornecidos por JustWatch.")).toBeInTheDocument();
  expect(screen.getByAltText("TMDB")).toBeInTheDocument();
});
```

- [ ] **Step 4: Rodar e ver falhar**

Run: `npm test -- app/Rodape.test.tsx`. Esperado: FAIL (módulo `./Rodape` não existe).

- [ ] **Step 5: Implementar**

- `app/Rodape.tsx`: logo `/tmdb-logo.svg` (alt `"TMDB"`) e os dois textos.
- `app/layout.tsx`: `<html lang="pt-BR">`, um cabeçalho com o nome do app como link para `/`, `{children}` e `<Rodape />`; `metadata.title = "Catálogo de Streaming"`.
- `next.config.ts`: `images.remotePatterns` para `https://image.tmdb.org/t/p/**`.
- `.env.example`: `TMDB_READ_TOKEN=`.
- SVGs de placeholder: retângulo cinza simples (pôster 2:3, foto circular). O logo do TMDB vem do kit oficial em https://www.themoviedb.org/about/logos-attribution.
- `app/page.tsx`: por enquanto, só um `<h1>Catálogo</h1>`.

- [ ] **Step 6: Rodar e ver passar**

Run: `npm test` → PASS. Run: `npm run build` → build concluído sem erros.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: projeto Next.js com Tailwind, Vitest e rodapé de atribuição"
```

---

### Task 2: Filtros na URL

**Files:**
- Create: `lib/filtros.ts`
- Test: `lib/filtros.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export type Ordem = "populares" | "avaliados" | "recentes";
  export type Filtros = { streamings: number[]; genero?: number; ordem: Ordem; busca?: string };
  export type ParametrosUrl = Record<string, string | string[] | undefined>;
  export const FILTROS_PADRAO: Filtros; // { streamings: [], ordem: "populares" }
  export function lerFiltros(params: ParametrosUrl): Filtros;
  export function escreverFiltros(filtros: Filtros): string; // query string sem "?", omite padrões; "" quando tudo é padrão
  ```

- [ ] **Step 1: Escrever os testes que falham**

```ts
it("lê todos os filtros", () => {
  expect(lerFiltros({ streaming: "8,119", genero: "28", ordem: "avaliados", busca: "batman" }))
    .toEqual({ streamings: [8, 119], genero: 28, ordem: "avaliados", busca: "batman" });
});
it("sem parâmetros devolve o padrão", () => {
  expect(lerFiltros({})).toEqual({ streamings: [], ordem: "populares" });
});
it("ignora ids inválidos e repetidos", () => {
  expect(lerFiltros({ streaming: "8,abc,8,,119" }).streamings).toEqual([8, 119]);
});
it("ignora gênero e ordem inválidos", () => {
  const f = lerFiltros({ genero: "x", ordem: "foo" });
  expect(f.genero).toBeUndefined();
  expect(f.ordem).toBe("populares");
});
it("busca só com espaços vira sem busca; busca é aparada", () => {
  expect(lerFiltros({ busca: "   " }).busca).toBeUndefined();
  expect(lerFiltros({ busca: "  batman " }).busca).toBe("batman");
});
it("usa o primeiro valor quando o parâmetro vem repetido", () => {
  expect(lerFiltros({ ordem: ["recentes", "avaliados"] }).ordem).toBe("recentes");
});
it("escreve só o que não é padrão", () => {
  expect(escreverFiltros(FILTROS_PADRAO)).toBe("");
  expect(escreverFiltros({ streamings: [8, 119], genero: 28, ordem: "recentes", busca: "ação & cia" }))
    .toBe("streaming=8%2C119&genero=28&ordem=recentes&busca=a%C3%A7%C3%A3o+%26+cia");
});
it("ler(escrever(f)) devolve f", () => {
  const f: Filtros = { streamings: [337], genero: 35, ordem: "avaliados", busca: "amor" };
  expect(lerFiltros(Object.fromEntries(new URLSearchParams(escreverFiltros(f))))).toEqual(f);
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- lib/filtros.test.ts`. Esperado: FAIL (módulo não existe).

- [ ] **Step 3: Implementar `lib/filtros.ts`**

`escreverFiltros` usa `URLSearchParams`, na ordem de chaves `streaming`, `genero`, `ordem`, `busca`. Chaves com valor indefinido ou padrão não entram no objeto, e por isso não aparecem como `undefined` no `toEqual`.

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- lib/filtros.test.ts` → PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/filtros.ts lib/filtros.test.ts
git commit -m "feat: leitura e escrita dos filtros na URL"
```

---

### Task 3: Cliente do TMDB, tipos e imagens

**Files:**
- Create: `lib/tmdb/cliente.ts`, `lib/tmdb/tipos.ts`, `lib/tmdb/imagens.ts`, `tests/fetchFalso.ts`
- Test: `lib/tmdb/cliente.test.ts`, `lib/tmdb/imagens.test.ts`

**Interfaces:**
- Produces:
  ```ts
  // tipos.ts
  export type Streaming = { id: number; nome: string; logoUrl: string | null };
  export type Genero = { id: number; nome: string };
  export type FilmeResumo = { id: number; titulo: string; ano: string | null; nota: number; posterUrl: string | null; generoIds: number[] };
  export type PaginaFilmes = { filmes: FilmeResumo[]; pagina: number; temMais: boolean }; // pagina = última página do TMDB consumida
  export type PessoaElenco = { nome: string; personagem: string; fotoUrl: string | null };
  export type FilmeDetalhe = {
    id: number; titulo: string; tituloOriginal: string | null; ano: string | null; duracao: string | null;
    generos: string[]; nota: number; sinopse: string; posterUrl: string | null; fundoUrl: string | null;
    ondeAssistir: Streaming[]; elenco: PessoaElenco[]; trailerYoutubeId: string | null;
  };
  // tipos crus da API (só o que usamos):
  export type TmdbFilme = { id: number; title: string; release_date?: string; vote_average: number; poster_path: string | null; genre_ids: number[] };
  export type TmdbPagina = { page: number; total_pages: number; results: TmdbFilme[] };
  export type TmdbProvedor = { provider_id: number; provider_name: string; logo_path: string | null; display_priority?: number };

  // imagens.ts
  export type TamanhoImagem = "w92" | "w185" | "w342" | "w500" | "w1280";
  export function imagemUrl(caminho: string | null | undefined, tamanho: TamanhoImagem): string | null;
  export function paraFilmeResumo(f: TmdbFilme): FilmeResumo;  // ano = 4 primeiros chars de release_date ou null; nota arredondada a 1 casa
  export function paraStreaming(p: TmdbProvedor): Streaming;   // logo em w92

  // cliente.ts
  export class ErroTmdb extends Error { constructor(mensagem: string, public status?: number) }
  export class ErroNaoEncontrado extends ErroTmdb {}
  export const CACHE = { REFERENCIAS: 86400, LISTAS: 21600, DETALHES: 86400 } as const;
  export function tmdbGet<T>(caminho: string, params: Record<string, string | number | undefined>, revalidate: number): Promise<T>;

  // tests/fetchFalso.ts
  export function respostaJson(corpo: unknown, status?: number): Response;
  export function instalarFetchFalso(rotas: Record<string, unknown>): ReturnType<typeof vi.fn>;
  // responde pela pathname depois de "/3" (ex.: "/discover/movie"); rota ausente → 404
  ```

- [ ] **Step 1: Escrever os testes que falham**

```ts
// cliente.test.ts  (beforeEach: vi.stubEnv("TMDB_READ_TOKEN", "tok"))
it("chama a URL certa com token e parâmetros, omitindo indefinidos", async () => {
  const f = vi.fn().mockResolvedValue(respostaJson({ ok: 1 }));
  vi.stubGlobal("fetch", f);
  await tmdbGet("/discover/movie", { page: 2, with_genres: undefined }, 21600);
  const [url, init] = f.mock.calls[0];
  expect(String(url)).toBe("https://api.themoviedb.org/3/discover/movie?page=2");
  expect(init.headers.Authorization).toBe("Bearer tok");
  expect(init.next).toEqual({ revalidate: 21600 });
  expect(init.signal).toBeInstanceOf(AbortSignal);
});
it("404 lança ErroNaoEncontrado", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(respostaJson({}, 404)));
  await expect(tmdbGet("/movie/1", {}, 1)).rejects.toBeInstanceOf(ErroNaoEncontrado);
});
it("500 e 429 lançam ErroTmdb com status", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(respostaJson({}, 429)));
  await expect(tmdbGet("/x", {}, 1)).rejects.toMatchObject({ name: "ErroTmdb", status: 429 });
});
it("falha de rede ou timeout vira ErroTmdb", async () => {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new DOMException("t", "TimeoutError")));
  await expect(tmdbGet("/x", {}, 1)).rejects.toBeInstanceOf(ErroTmdb);
});
it("sem token lança erro explicativo", async () => {
  vi.stubEnv("TMDB_READ_TOKEN", "");
  await expect(tmdbGet("/x", {}, 1)).rejects.toThrow("Defina TMDB_READ_TOKEN em .env.local");
});

// imagens.test.ts
it("monta URL de imagem ou devolve null", () => {
  expect(imagemUrl("/a.jpg", "w342")).toBe("https://image.tmdb.org/t/p/w342/a.jpg");
  expect(imagemUrl(null, "w342")).toBeNull();
});
it("converte filme do TMDB", () => {
  expect(paraFilmeResumo({ id: 1, title: "X", release_date: "2024-05-01", vote_average: 7.456, poster_path: "/p.jpg", genre_ids: [28] }))
    .toEqual({ id: 1, titulo: "X", ano: "2024", nota: 7.5, posterUrl: "https://image.tmdb.org/t/p/w342/p.jpg", generoIds: [28] });
  expect(paraFilmeResumo({ id: 2, title: "Y", release_date: "", vote_average: 0, poster_path: null, genre_ids: [] }).ano).toBeNull();
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- lib/tmdb`. Esperado: FAIL (módulos não existem).

- [ ] **Step 3: Implementar**

- `tmdbGet` usa `fetch(url, { headers: { Authorization, accept: "application/json" }, next: { revalidate }, signal: AbortSignal.timeout(8000) })`.
- Erros: as classes definem `this.name` (`"ErroTmdb"` e `"ErroNaoEncontrado"`). A mensagem genérica é `"Falha ao consultar o TMDB"`.
- `cliente.ts` começa com `import "server-only"`. Instale com `npm i server-only` e, no `vitest.config.mts`, crie o alias `"server-only"` → um arquivo vazio `tests/vazio.ts`.

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- lib/tmdb` → PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/tmdb tests vitest.config.mts package.json package-lock.json
git commit -m "feat: cliente do TMDB com erros, timeout e cache"
```

---

### Task 4: Streamings e gêneros

**Files:**
- Create: `lib/tmdb/referencias.ts`
- Test: `lib/tmdb/referencias.test.ts`

**Interfaces:**
- Consumes: `tmdbGet`, `CACHE.REFERENCIAS`, `paraStreaming`, `TmdbProvedor` (Task 3).
- Produces: `listarStreamings(): Promise<Streaming[]>` (os 12 com menor `display_priority`, nessa ordem) e `listarGeneros(): Promise<Genero[]>`.

- [ ] **Step 1: Escrever os testes que falham**

```ts
it("lista os 12 streamings de maior prioridade no BR", async () => {
  const provs = Array.from({ length: 15 }, (_, i) => ({ provider_id: i + 1, provider_name: `P${i + 1}`, logo_path: "/l.png", display_priority: 15 - i }));
  const f = instalarFetchFalso({ "/watch/providers/movie": { results: provs } });
  const r = await listarStreamings();
  expect(r).toHaveLength(12);
  expect(r[0]).toEqual({ id: 15, nome: "P15", logoUrl: "https://image.tmdb.org/t/p/w92/l.png" });
  const url = new URL(String(f.mock.calls[0][0]));
  expect(url.searchParams.get("watch_region")).toBe("BR");
  expect(url.searchParams.get("language")).toBe("pt-BR");
});
it("lista gêneros em pt-BR", async () => {
  instalarFetchFalso({ "/genre/movie/list": { genres: [{ id: 28, name: "Ação" }] } });
  expect(await listarGeneros()).toEqual([{ id: 28, nome: "Ação" }]);
});
```

- [ ] **Step 2: Rodar e ver falhar.** Run: `npm test -- lib/tmdb/referencias.test.ts` → FAIL.
- [ ] **Step 3: Implementar `lib/tmdb/referencias.ts`.**
- [ ] **Step 4: Rodar e ver passar.** Run: `npm test -- lib/tmdb/referencias.test.ts` → PASS.
- [ ] **Step 5: Commit**

```bash
git add lib/tmdb/referencias.ts lib/tmdb/referencias.test.ts
git commit -m "feat: lista de streamings e gêneros"
```

---

### Task 5: Catálogo sem busca (discover)

**Files:**
- Create: `lib/tmdb/catalogo.ts`
- Test: `lib/tmdb/catalogo.test.ts`

**Interfaces:**
- Consumes: `Filtros` (Task 2), `tmdbGet`, `CACHE.LISTAS`, `paraFilmeResumo`, `TmdbPagina`, `PaginaFilmes` (Task 3), `listarStreamings` (Task 4).
- Produces:
  ```ts
  export const PAGINA_MAXIMA = 500;
  export function descobrirFilmes(filtros: Filtros, pagina: number, todosStreamingIds: number[]): Promise<PaginaFilmes>;
  export function listarFilmes(filtros: Filtros, pagina: number): Promise<PaginaFilmes>;
  // listarFilmes: com busca → buscarFilmes (Task 6); sem busca → descobrirFilmes, passando os ids de listarStreamings()
  ```

- [ ] **Step 1: Escrever os testes que falham**

```ts
const pag = { page: 1, total_pages: 3, results: [{ id: 1, title: "A", release_date: "2020-01-01", vote_average: 8, poster_path: null, genre_ids: [] }] };
const params = (f: ReturnType<typeof vi.fn>) => new URL(String(f.mock.calls[0][0])).searchParams;

it("envia os parâmetros fixos e os streamings selecionados com OU", async () => {
  const f = instalarFetchFalso({ "/discover/movie": pag });
  await descobrirFilmes({ streamings: [8, 119], genero: 28, ordem: "populares" }, 1, [8, 119, 337]);
  const p = params(f);
  expect(p.get("language")).toBe("pt-BR");
  expect(p.get("watch_region")).toBe("BR");
  expect(p.get("with_watch_monetization_types")).toBe("flatrate");
  expect(p.get("include_adult")).toBe("false");
  expect(p.get("with_watch_providers")).toBe("8|119");
  expect(p.get("with_genres")).toBe("28");
  expect(p.get("sort_by")).toBe("popularity.desc");
  expect(p.get("page")).toBe("1");
});
it("sem streaming selecionado usa todos", async () => {
  const f = instalarFetchFalso({ "/discover/movie": pag });
  await descobrirFilmes({ streamings: [], ordem: "populares" }, 1, [8, 119, 337]);
  expect(params(f).get("with_watch_providers")).toBe("8|119|337");
});
it("ordem avaliados exige 300 votos", async () => {
  const f = instalarFetchFalso({ "/discover/movie": pag });
  await descobrirFilmes({ streamings: [], ordem: "avaliados" }, 1, [8]);
  expect(params(f).get("sort_by")).toBe("vote_average.desc");
  expect(params(f).get("vote_count.gte")).toBe("300");
});
it("ordem recentes não inclui filmes futuros", async () => {
  vi.setSystemTime(new Date("2026-11-05T12:00:00Z"));
  const f = instalarFetchFalso({ "/discover/movie": pag });
  await descobrirFilmes({ streamings: [], ordem: "recentes" }, 1, [8]);
  expect(params(f).get("sort_by")).toBe("primary_release_date.desc");
  expect(params(f).get("primary_release_date.lte")).toBe("2026-11-05");
});
it("temMais respeita total_pages e o limite de 500", async () => {
  instalarFetchFalso({ "/discover/movie": { ...pag, page: 3, total_pages: 3 } });
  expect((await descobrirFilmes(FILTROS_PADRAO, 3, [8])).temMais).toBe(false);
  instalarFetchFalso({ "/discover/movie": { ...pag, page: 500, total_pages: 900 } });
  expect((await descobrirFilmes(FILTROS_PADRAO, 500, [8])).temMais).toBe(false);
  instalarFetchFalso({ "/discover/movie": pag });
  expect(await descobrirFilmes(FILTROS_PADRAO, 1, [8])).toMatchObject({ pagina: 1, temMais: true, filmes: [{ id: 1, titulo: "A" }] });
});
```

- [ ] **Step 2: Rodar e ver falhar.** Run: `npm test -- lib/tmdb/catalogo.test.ts` → FAIL.
- [ ] **Step 3: Implementar `descobrirFilmes` e `listarFilmes` em `lib/tmdb/catalogo.ts`.** A data de "hoje" é `new Date().toISOString().slice(0, 10)`. O ramo de busca de `listarFilmes` chama `buscarFilmes` da Task 6. Até lá, deixe esse ramo chamando `descobrirFilmes`.
- [ ] **Step 4: Rodar e ver passar.** Run: `npm test -- lib/tmdb/catalogo.test.ts` → PASS.
- [ ] **Step 5: Commit**

```bash
git add lib/tmdb/catalogo.ts lib/tmdb/catalogo.test.ts
git commit -m "feat: catálogo de filmes por streaming, gênero e ordem"
```

---

### Task 6: Busca por título com checagem de disponibilidade

**Files:**
- Create: `lib/tmdb/busca.ts`
- Modify: `lib/tmdb/catalogo.ts` (o ramo de busca de `listarFilmes` passa a chamar `buscarFilmes`)
- Test: `lib/tmdb/busca.test.ts`

**Interfaces:**
- Consumes: Tasks 2 e 3, `PAGINA_MAXIMA` (Task 5).
- Produces: `buscarFilmes(filtros: Filtros & { busca: string }, pagina: number): Promise<PaginaFilmes>`.

Algoritmo (não decorre só da assinatura):
```
atual = pagina; consumidas = 0; filmes = []
repita:
  r = GET /search/movie {query: busca, language: pt-BR, include_adult: false, page: atual} (CACHE.LISTAS)
  para cada resultado, em paralelo (Promise.allSettled):
    GET /movie/{id}/watch/providers (CACHE.LISTAS) → ids = results.BR?.flatrate?.map(provider_id) ?? []
    mantém se ids não vazio
         E (filtros.streamings vazio OU interseção com ids)
         E (sem filtros.genero OU genre_ids contém filtros.genero)
    rejeitado → descarta o filme
  consumidas++
  enquanto filmes vazio E consumidas < 3 E atual < min(r.total_pages, PAGINA_MAXIMA): atual++
retorna { filmes, pagina: atual, temMais: atual < min(r.total_pages, PAGINA_MAXIMA) }
```

- [ ] **Step 1: Escrever os testes que falham**

Use um `fetch` simulado que responde a `/search/movie` pelo parâmetro `page` e a `/movie/{id}/watch/providers` por id. Monte esse simulador no próprio arquivo de teste. Filmes de teste: 1 (Netflix 8, gênero 28), 2 (sem `BR`), 3 (Prime 119, gênero 35), 4 (providers com erro 500).

```ts
it("mantém só filmes em streaming por assinatura no BR", async () => {
  const r = await buscarFilmes({ streamings: [], ordem: "populares", busca: "x" }, 1);
  expect(r.filmes.map(f => f.id)).toEqual([1, 3]);   // 2 sem BR, 4 com erro → descartados
});
it("aplica o filtro de streaming", async () => {
  expect((await buscarFilmes({ streamings: [119], ordem: "populares", busca: "x" }, 1)).filmes.map(f => f.id)).toEqual([3]);
});
it("aplica o filtro de gênero", async () => {
  expect((await buscarFilmes({ streamings: [], genero: 28, ordem: "populares", busca: "x" }, 1)).filmes.map(f => f.id)).toEqual([1]);
});
it("codifica acentos e símbolos na query", async () => {
  await buscarFilmes({ streamings: [], ordem: "populares", busca: "Ação & Cia" }, 1);
  expect(urlDaBusca().searchParams.get("query")).toBe("Ação & Cia");
});
it("avança até 3 páginas quando a página filtrada vem vazia", async () => {
  // páginas 1 e 2 só com o filme 2; página 3 com o filme 1; total_pages 10
  const r = await buscarFilmes({ streamings: [], ordem: "populares", busca: "x" }, 1);
  expect(r).toMatchObject({ pagina: 3, temMais: true, filmes: [{ id: 1 }] });
});
it("para após 3 páginas mesmo sem resultado", async () => {
  // páginas 1 a 5 só com o filme 2; total_pages 5
  const r = await buscarFilmes({ streamings: [], ordem: "populares", busca: "x" }, 1);
  expect(r).toMatchObject({ pagina: 3, temMais: true, filmes: [] });
});
it("temMais false na última página", async () => {
  // total_pages 1
  expect((await buscarFilmes({ streamings: [], ordem: "populares", busca: "x" }, 1)).temMais).toBe(false);
});
```
Acrescente em `catalogo.test.ts`: `listarFilmes` com `busca` chama `/search/movie` e não chama `/discover/movie`.

- [ ] **Step 2: Rodar e ver falhar.** Run: `npm test -- lib/tmdb` → FAIL.
- [ ] **Step 3: Implementar `lib/tmdb/busca.ts` e ligar em `listarFilmes`.**
- [ ] **Step 4: Rodar e ver passar.** Run: `npm test -- lib/tmdb` → PASS.
- [ ] **Step 5: Commit**

```bash
git add lib/tmdb
git commit -m "feat: busca por título mostrando só filmes em streaming"
```

---

### Task 7: Detalhes do filme (dados)

**Files:**
- Create: `lib/tmdb/detalhes.ts`
- Test: `lib/tmdb/detalhes.test.ts`

**Interfaces:**
- Consumes: Task 3.
- Produces: `obterDetalhes(id: number): Promise<FilmeDetalhe>` (propaga `ErroNaoEncontrado`) e `formatarDuracao(minutos: number | null | undefined): string | null`.

- [ ] **Step 1: Escrever os testes que falham**

```ts
it("formata duração", () => {
  expect(formatarDuracao(135)).toBe("2h 15min");
  expect(formatarDuracao(45)).toBe("45min");
  expect(formatarDuracao(120)).toBe("2h");
  expect(formatarDuracao(0)).toBeNull();
  expect(formatarDuracao(null)).toBeNull();
});
it("pede detalhes com append_to_response e idiomas de vídeo", async () => {
  const f = instalarFetchFalso({ "/movie/10": detalheCompleto });
  await obterDetalhes(10);
  const p = new URL(String(f.mock.calls[0][0])).searchParams;
  expect(p.get("append_to_response")).toBe("credits,videos,watch/providers");
  expect(p.get("include_video_language")).toBe("pt,en");
  expect(p.get("language")).toBe("pt-BR");
});
it("converte a resposta completa", async () => {
  instalarFetchFalso({ "/movie/10": detalheCompleto });
  const d = await obterDetalhes(10);
  expect(d.tituloOriginal).toBe("Original Title");   // diferente de title
  expect(d.duracao).toBe("2h 15min");
  expect(d.generos).toEqual(["Ação"]);
  expect(d.ondeAssistir).toEqual([{ id: 8, nome: "Netflix", logoUrl: "https://image.tmdb.org/t/p/w92/n.png" }]);
  expect(d.elenco).toHaveLength(10);                  // fixture tem 12
  expect(d.trailerYoutubeId).toBe("ptKey");           // en Trailer vem antes na lista, pt é preferido
  expect(d.fundoUrl).toBe("https://image.tmdb.org/t/p/w1280/b.jpg");
});
it("campos ausentes viram null ou vazio", async () => {
  instalarFetchFalso({ "/movie/11": detalheMinimo });   // sem BR, sem vídeos, sem elenco, sem poster, title == original_title
  const d = await obterDetalhes(11);
  expect(d).toMatchObject({ tituloOriginal: null, posterUrl: null, ondeAssistir: [], elenco: [], trailerYoutubeId: null });
});
it("vídeo que não é Trailer do YouTube é ignorado", async () => { /* só um Teaser e um Trailer no Vimeo → null */ });
it("404 propaga ErroNaoEncontrado", async () => {
  instalarFetchFalso({});
  await expect(obterDetalhes(99)).rejects.toBeInstanceOf(ErroNaoEncontrado);
});
```
Escreva as fixtures `detalheCompleto` e `detalheMinimo` no topo do teste, no formato da resposta do TMDB (`title`, `original_title`, `runtime`, `genres`, `overview`, `poster_path`, `backdrop_path`, `credits.cast[]` com `name`, `character`, `profile_path`; `videos.results[]` com `key`, `site`, `type`, `iso_639_1`; `"watch/providers".results.BR.flatrate[]`).

- [ ] **Step 2: Rodar e ver falhar.** Run: `npm test -- lib/tmdb/detalhes.test.ts` → FAIL.
- [ ] **Step 3: Implementar `lib/tmdb/detalhes.ts`** (cache `CACHE.DETALHES`; pôster `w500`; elenco `w185`).
- [ ] **Step 4: Rodar e ver passar.** Run: `npm test -- lib/tmdb/detalhes.test.ts` → PASS.
- [ ] **Step 5: Commit**

```bash
git add lib/tmdb/detalhes.ts lib/tmdb/detalhes.test.ts
git commit -m "feat: dados de detalhes do filme"
```

---

### Task 8: Card, grade e estado vazio

**Files:**
- Create: `components/CardFilme.tsx`, `components/GradeFilmes.tsx`, `components/EstadoVazio.tsx`
- Test: `components/CardFilme.test.tsx`, `components/EstadoVazio.test.tsx`

**Interfaces:**
- Consumes: `FilmeResumo` (Task 3).
- Produces: `CardFilme({ filme }: { filme: FilmeResumo })`, `GradeFilmes({ filmes }: { filmes: FilmeResumo[] })` e `EstadoVazio()`.

- [ ] **Step 1: Escrever os testes que falham**

```tsx
const filme = { id: 7, titulo: "Duna", ano: "2021", nota: 7.8, posterUrl: "https://image.tmdb.org/t/p/w342/d.jpg", generoIds: [] };
it("mostra título, ano, nota e link para o detalhe", () => {
  render(<CardFilme filme={filme} />);
  expect(screen.getByRole("link")).toHaveAttribute("href", "/filme/7");
  expect(screen.getByText("Duna")).toBeInTheDocument();
  expect(screen.getByText("2021")).toBeInTheDocument();
  expect(screen.getByText("7.8")).toBeInTheDocument();
  expect(screen.getByAltText("Pôster de Duna")).toBeInTheDocument();
});
it("sem pôster usa a imagem padrão", () => {
  render(<CardFilme filme={{ ...filme, posterUrl: null }} />);
  expect(screen.getByAltText("Pôster de Duna").getAttribute("src")).toContain("sem-poster.svg");
});
it("estado vazio oferece limpar filtros", () => {
  render(<EstadoVazio />);
  expect(screen.getByText("Nenhum filme encontrado com esses filtros")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Limpar filtros" })).toHaveAttribute("href", "/");
});
```

- [ ] **Step 2: Rodar e ver falhar.** Run: `npm test -- components` → FAIL.
- [ ] **Step 3: Implementar.** Use `next/image` com `width={342} height={513}`. `GradeFilmes` é um grid responsivo (2 colunas no celular, até 6 no desktop) e cada card fica num `<li>`.
- [ ] **Step 4: Rodar e ver passar.** Run: `npm test -- components` → PASS.
- [ ] **Step 5: Commit**

```bash
git add components
git commit -m "feat: card de filme, grade e estado vazio"
```

---

### Task 9: Barra de filtros

**Files:**
- Create: `components/BarraFiltros.tsx` (`"use client"`), `components/SeletorStreamings.tsx`, `components/SeletorGenero.tsx`, `components/SeletorOrdem.tsx`, `components/CampoBusca.tsx`
- Test: `components/BarraFiltros.test.tsx`

**Interfaces:**
- Consumes: `Filtros`, `escreverFiltros` (Task 2); `Streaming`, `Genero` (Task 3).
- Produces: `BarraFiltros({ streamings, generos, filtros }: { streamings: Streaming[]; generos: Genero[]; filtros: Filtros })`. Cada mudança chama `router.push("/?" + escreverFiltros(novo))`, ou `router.push("/")` quando a string fica vazia.
- Subcomponentes: `SeletorStreamings({ streamings, selecionados, aoAlternar(id) })` são botões com o logo, com `aria-pressed` e `aria-label` igual ao nome do streaming. `SeletorGenero({ generos, valor, aoMudar(id | undefined) })` é um `<select>` com rótulo "Gênero" e a opção "Todos". `SeletorOrdem({ valor, desabilitado, aoMudar })` é um `<select>` com rótulo "Ordenar por" e as opções "Mais populares", "Melhor avaliados" e "Mais recentes"; quando está desabilitado, mostra "Ordenado por relevância". `CampoBusca({ valorInicial, aoBuscar(texto) })` é um `<form role="search">` com input rotulado "Buscar filme" que envia ao apertar Enter.

- [ ] **Step 1: Escrever os testes que falham** (com `vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }))`)

```tsx
const streamings = [{ id: 8, nome: "Netflix", logoUrl: null }, { id: 119, nome: "Prime Video", logoUrl: null }];
const generos = [{ id: 28, nome: "Ação" }];
it("marcar um streaming adiciona à URL", async () => {
  render(<BarraFiltros streamings={streamings} generos={generos} filtros={{ streamings: [8], ordem: "populares" }} />);
  await userEvent.click(screen.getByRole("button", { name: "Prime Video" }));
  expect(push).toHaveBeenCalledWith("/?streaming=8%2C119");
});
it("desmarcar o último streaming volta para /", async () => {
  render(<BarraFiltros streamings={streamings} generos={generos} filtros={{ streamings: [8], ordem: "populares" }} />);
  expect(screen.getByRole("button", { name: "Netflix" })).toHaveAttribute("aria-pressed", "true");
  await userEvent.click(screen.getByRole("button", { name: "Netflix" }));
  expect(push).toHaveBeenCalledWith("/");
});
it("escolher gênero e ordem", async () => {
  render(<BarraFiltros streamings={streamings} generos={generos} filtros={FILTROS_PADRAO} />);
  await userEvent.selectOptions(screen.getByLabelText("Gênero"), "28");
  expect(push).toHaveBeenLastCalledWith("/?genero=28");
  await userEvent.selectOptions(screen.getByLabelText("Ordenar por"), "avaliados");
  expect(push).toHaveBeenLastCalledWith("/?ordem=avaliados");
});
it("buscar ao apertar Enter", async () => {
  render(<BarraFiltros streamings={streamings} generos={generos} filtros={FILTROS_PADRAO} />);
  await userEvent.type(screen.getByLabelText("Buscar filme"), "batman{Enter}");
  expect(push).toHaveBeenLastCalledWith("/?busca=batman");
});
it("com busca ativa a ordem fica desabilitada", () => {
  render(<BarraFiltros streamings={streamings} generos={generos} filtros={{ ...FILTROS_PADRAO, busca: "x" }} />);
  expect(screen.getByLabelText("Ordenar por")).toBeDisabled();
  expect(screen.getByText("Ordenado por relevância")).toBeInTheDocument();
});
```

- [ ] **Step 2: Rodar e ver falhar.** Run: `npm test -- components/BarraFiltros.test.tsx` → FAIL.
- [ ] **Step 3: Implementar os cinco componentes.**
- [ ] **Step 4: Rodar e ver passar.** Run: `npm test -- components` → PASS.
- [ ] **Step 5: Commit**

```bash
git add components
git commit -m "feat: barra de filtros ligada à URL"
```

---

### Task 10: Página do catálogo, "Carregar mais", carregando e erro

**Files:**
- Create: `app/api/filmes/route.ts`, `components/BotaoCarregarMais.tsx` (`"use client"`), `app/loading.tsx`, `app/error.tsx` (`"use client"`)
- Modify: `app/page.tsx`
- Test: `app/api/filmes/route.test.ts`, `components/BotaoCarregarMais.test.tsx`, `app/error.test.tsx`

**Interfaces:**
- Consumes: `lerFiltros`, `escreverFiltros`, `Filtros` (Task 2); `listarFilmes`, `PAGINA_MAXIMA` (Task 5); `listarStreamings`, `listarGeneros` (Task 4); `ErroTmdb` (Task 3); `GradeFilmes`, `EstadoVazio` (Task 8); `BarraFiltros` (Task 9).
- Produces:
  - `GET /api/filmes?<filtros>&pagina=N` → `200 PaginaFilmes` em JSON. `pagina` é `parseInt`, limitada a 1–500, e vale 1 quando é inválida. `ErroTmdb` → `502 { erro: "Falha ao consultar o TMDB" }`.
  - `BotaoCarregarMais({ filtros, ultimaPagina, temMais }: { filtros: Filtros; ultimaPagina: number; temMais: boolean })`

- [ ] **Step 1: Escrever os testes que falham**

```ts
// route.test.ts  (vi.mock("@/lib/tmdb/catalogo") — listarFilmes simulado)
it("lê filtros e página da URL", async () => {
  listarFilmes.mockResolvedValue({ filmes: [], pagina: 2, temMais: false });
  const r = await GET(new Request("http://x/api/filmes?streaming=8&pagina=2"));
  expect(listarFilmes).toHaveBeenCalledWith({ streamings: [8], ordem: "populares" }, 2);
  expect(await r.json()).toEqual({ filmes: [], pagina: 2, temMais: false });
});
it("limita a página entre 1 e 500", async () => {
  listarFilmes.mockResolvedValue({ filmes: [], pagina: 1, temMais: false });
  await GET(new Request("http://x/api/filmes?pagina=9999"));
  expect(listarFilmes).toHaveBeenLastCalledWith(expect.anything(), 500);
  await GET(new Request("http://x/api/filmes?pagina=-1"));
  expect(listarFilmes).toHaveBeenLastCalledWith(expect.anything(), 1);
  await GET(new Request("http://x/api/filmes?pagina=abc"));
  expect(listarFilmes).toHaveBeenLastCalledWith(expect.anything(), 1);
});
it("erro do TMDB vira 502", async () => {
  listarFilmes.mockRejectedValue(new ErroTmdb("x", 500));
  expect((await GET(new Request("http://x/api/filmes"))).status).toBe(502);
});

// BotaoCarregarMais.test.tsx  (fetch simulado)
it("busca a próxima página e mostra os filmes", async () => {
  fetch.mockResolvedValue(respostaJson({ filmes: [filmeX], pagina: 2, temMais: false }));
  render(<BotaoCarregarMais filtros={{ streamings: [8], ordem: "populares" }} ultimaPagina={1} temMais />);
  await userEvent.click(screen.getByRole("button", { name: "Carregar mais" }));
  expect(fetch).toHaveBeenCalledWith("/api/filmes?streaming=8&pagina=2");
  expect(await screen.findByText(filmeX.titulo)).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Carregar mais" })).not.toBeInTheDocument();
});
it("em erro mostra mensagem e Tentar de novo", async () => {
  fetch.mockResolvedValue(respostaJson({ erro: "x" }, 502));
  render(<BotaoCarregarMais filtros={FILTROS_PADRAO} ultimaPagina={1} temMais />);
  await userEvent.click(screen.getByRole("button", { name: "Carregar mais" }));
  expect(await screen.findByText("Não foi possível carregar mais filmes.")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Tentar de novo" })).toBeInTheDocument();
});
it("sem mais páginas não mostra o botão", () => {
  render(<BotaoCarregarMais filtros={FILTROS_PADRAO} ultimaPagina={1} temMais={false} />);
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});

// error.test.tsx
it("mostra erro amigável e tenta de novo", async () => {
  const reset = vi.fn();
  render(<Erro error={new Error("x")} reset={reset} />);
  expect(screen.getByText("Não conseguimos carregar os filmes agora")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Tentar de novo" }));
  expect(reset).toHaveBeenCalled();
});
```

- [ ] **Step 2: Rodar e ver falhar.** Run: `npm test -- app components/BotaoCarregarMais.test.tsx` → FAIL.
- [ ] **Step 3: Implementar**
  - `app/page.tsx` (Server Component): `const filtros = lerFiltros(await searchParams)`. Em seguida, `Promise.all([listarStreamings(), listarGeneros(), listarFilmes(filtros, 1)])`. Renderiza `<BarraFiltros>`. Se não houver filmes e `temMais` for falso, mostra `<EstadoVazio>`. Caso contrário, mostra `<GradeFilmes>` e `<BotaoCarregarMais key={escreverFiltros(filtros)} …>`. A `key` reinicia o botão quando os filtros mudam.
  - `BotaoCarregarMais`: guarda os filmes extras e a última página. Durante o carregamento, o botão mostra "Carregando…" e fica desabilitado. Se a busca devolver uma página vazia mas `temMais` for verdadeiro, o botão continua visível.
  - `app/loading.tsx`: 20 cards cinzas com `animate-pulse`.
  - `app/error.tsx`: componente `Erro({ error, reset })` com os textos acima.
- [ ] **Step 4: Rodar e ver passar.** Run: `npm test` → PASS.
- [ ] **Step 5: Conferir no navegador.** Crie o `.env.local` com o token real e rode `npm run dev`. Abra `http://localhost:3000` e confira: a grade aparece; marcar Netflix muda a URL e a lista; "Carregar mais" traz mais filmes; buscar "batman" mostra só filmes que estão em streaming.
- [ ] **Step 6: Commit**

```bash
git add app components
git commit -m "feat: página do catálogo com carregar mais, carregando e erro"
```

---

### Task 11: Página de detalhes

**Files:**
- Create: `app/filme/[id]/page.tsx`, `app/filme/[id]/not-found.tsx`, `components/OndeAssistir.tsx`, `components/Elenco.tsx`, `components/Trailer.tsx`, `lib/idFilme.ts`
- Test: `components/OndeAssistir.test.tsx`, `components/Elenco.test.tsx`, `components/Trailer.test.tsx`, `lib/idFilme.test.ts`

**Interfaces:**
- Consumes: `obterDetalhes` (Task 7), `ErroNaoEncontrado` (Task 3), tipos `Streaming` e `PessoaElenco`.
- Produces: `lerIdFilme(bruto: string): number | null` (aceita só `/^\d+$/` maior que 0), `OndeAssistir({ streamings }: { streamings: Streaming[] })`, `Elenco({ pessoas }: { pessoas: PessoaElenco[] })` e `Trailer({ youtubeId }: { youtubeId: string | null })`.

- [ ] **Step 1: Escrever os testes que falham**

```tsx
it("lerIdFilme aceita só números positivos", () => {
  expect(lerIdFilme("550")).toBe(550);
  expect(lerIdFilme("abc")).toBeNull();
  expect(lerIdFilme("0")).toBeNull();
  expect(lerIdFilme("12abc")).toBeNull();
});
it("onde assistir lista logos e atribuição", () => {
  render(<OndeAssistir streamings={[{ id: 8, nome: "Netflix", logoUrl: "https://image.tmdb.org/t/p/w92/n.png" }]} />);
  expect(screen.getByAltText("Netflix")).toBeInTheDocument();
  expect(screen.getByText("Dados de streaming fornecidos por JustWatch.")).toBeInTheDocument();
});
it("onde assistir vazio explica", () => {
  render(<OndeAssistir streamings={[]} />);
  expect(screen.getByText("No momento não está em nenhum streaming por assinatura no Brasil.")).toBeInTheDocument();
});
it("elenco vazio não renderiza nada; sem foto usa avatar padrão", () => {
  const { container } = render(<Elenco pessoas={[]} />);
  expect(container).toBeEmptyDOMElement();
  render(<Elenco pessoas={[{ nome: "Ana", personagem: "Rita", fotoUrl: null }]} />);
  expect(screen.getByAltText("Ana").getAttribute("src")).toContain("sem-foto.svg");
});
it("trailer usa youtube-nocookie e some sem id", () => {
  const { container, rerender } = render(<Trailer youtubeId={null} />);
  expect(container).toBeEmptyDOMElement();
  rerender(<Trailer youtubeId="abc" />);
  expect(screen.getByTitle("Trailer")).toHaveAttribute("src", "https://www.youtube-nocookie.com/embed/abc");
});
```

- [ ] **Step 2: Rodar e ver falhar.** Run: `npm test -- components lib/idFilme.test.ts` → FAIL.
- [ ] **Step 3: Implementar**
  - `app/filme/[id]/page.tsx`: `const id = lerIdFilme((await params).id)`. Se `id` for `null`, chama `notFound()`. Depois chama `obterDetalhes(id)` e, se der `ErroNaoEncontrado`, chama `notFound()`; os outros erros sobem para o `app/error.tsx`. O layout segue a spec 5.4: fundo `fundoUrl` escurecido, pôster, título, título original (quando houver), ano · duração · gêneros, nota, sinopse e, por fim, `OndeAssistir`, `Trailer` e `Elenco`. A função `generateMetadata` define o título da aba como `"<titulo> | Catálogo de Streaming"`.
  - `not-found.tsx`: o texto "Filme não encontrado" e um link "Voltar ao catálogo" para `/`.
- [ ] **Step 4: Rodar e ver passar.** Run: `npm test` → PASS.
- [ ] **Step 5: Conferir no navegador.** Com `npm run dev`, abra um filme pela grade, depois `/filme/abc` e `/filme/999999999`. Os dois últimos devem mostrar "Filme não encontrado".
- [ ] **Step 6: Commit**

```bash
git add app components lib
git commit -m "feat: página de detalhes do filme"
```

---

### Task 12: Verificação final e publicação

**Files:**
- Create: `README.md` (o que é, como rodar, como obter o token, atribuições)

- [ ] **Step 1: Rodar tudo.** `npm test` → todos PASS. `npm run lint` → sem erros. `npm run build` → build concluído.
- [ ] **Step 2: Checar o token.** Rode `npm run build` e depois procure o valor do token dentro de `.next/static`. Ele não pode aparecer em nenhum arquivo enviado ao navegador.
- [ ] **Step 3: Escrever o README e fazer o commit.**

```bash
git add README.md
git commit -m "docs: README com instruções de uso"
```

- [ ] **Step 4: Publicar (feito junto com o usuário).** Suba o repositório para o GitHub e importe o projeto na Vercel. Defina `TMDB_READ_TOKEN` em Settings → Environment Variables e faça o deploy. Por fim, abra o link publicado e repita as conferências das Tasks 10 e 11.
