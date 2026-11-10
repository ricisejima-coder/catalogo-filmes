import { respostaJson } from "@/tests/fetchFalso";
import { buscarFilmes } from "./busca";
import type { TmdbFilme } from "./tipos";

beforeEach(() => vi.stubEnv("TMDB_READ_TOKEN", "tok"));

const filme = (id: number, genre_ids: number[]): TmdbFilme => ({
  id, title: `F${id}`, release_date: "2020-01-01", vote_average: 7, poster_path: null, genre_ids,
});
const F1 = filme(1, [28]); // Netflix (8)
const F2 = filme(2, [28]); // sem BR
const F3 = filme(3, [35]); // Prime (119)
const F4 = filme(4, [28]); // providers com erro 500

const provedores: Record<number, Response | (() => Response)> = {
  1: () => respostaJson({ results: { BR: { flatrate: [{ provider_id: 8 }] } } }),
  2: () => respostaJson({ results: { US: { flatrate: [{ provider_id: 8 }] } } }),
  3: () => respostaJson({ results: { BR: { flatrate: [{ provider_id: 119 }], rent: [{ provider_id: 2 }] } } }),
  4: () => respostaJson({}, 500),
};

/** paginas[n] = resultados da página n da busca. */
function simular(paginas: Record<number, TmdbFilme[]>, total_pages: number) {
  const f = vi.fn(async (entrada: RequestInfo | URL) => {
    const url = new URL(String(entrada));
    const m = url.pathname.match(/\/movie\/(\d+)\/watch\/providers$/);
    if (m) return (provedores[Number(m[1])] as () => Response)();
    if (url.pathname.endsWith("/search/movie")) {
      const page = Number(url.searchParams.get("page"));
      return respostaJson({ page, total_pages, results: paginas[page] ?? [] });
    }
    return respostaJson({}, 404);
  });
  vi.stubGlobal("fetch", f);
  return f;
}
const urlsDaBusca = (f: ReturnType<typeof simular>) =>
  f.mock.calls.map((c) => new URL(String(c[0]))).filter((u) => u.pathname.endsWith("/search/movie"));

it("mantém só filmes em streaming por assinatura no BR", async () => {
  simular({ 1: [F1, F2, F3, F4] }, 1);
  const r = await buscarFilmes({ streamings: [], ordem: "populares", busca: "x" }, 1);
  expect(r.filmes.map((f) => f.id)).toEqual([1, 3]);
});

it("aplica o filtro de streaming", async () => {
  simular({ 1: [F1, F2, F3, F4] }, 1);
  const r = await buscarFilmes({ streamings: [119], ordem: "populares", busca: "x" }, 1);
  expect(r.filmes.map((f) => f.id)).toEqual([3]);
});

it("aplica o filtro de gênero", async () => {
  simular({ 1: [F1, F2, F3, F4] }, 1);
  const r = await buscarFilmes({ streamings: [], genero: 28, ordem: "populares", busca: "x" }, 1);
  expect(r.filmes.map((f) => f.id)).toEqual([1]);
});

it("envia idioma, adulto e codifica acentos e símbolos na query", async () => {
  const f = simular({ 1: [F1] }, 1);
  await buscarFilmes({ streamings: [], ordem: "populares", busca: "Ação & Cia" }, 1);
  const [u] = urlsDaBusca(f);
  expect(u.searchParams.get("query")).toBe("Ação & Cia");
  expect(u.searchParams.get("language")).toBe("pt-BR");
  expect(u.searchParams.get("include_adult")).toBe("false");
  expect(u.searchParams.get("page")).toBe("1");
});

it("avança até 3 páginas quando a página filtrada vem vazia", async () => {
  simular({ 1: [F2], 2: [F2], 3: [F1] }, 10);
  const r = await buscarFilmes({ streamings: [], ordem: "populares", busca: "x" }, 1);
  expect(r).toMatchObject({ pagina: 3, temMais: true, filmes: [{ id: 1 }] });
});

it("para após 3 páginas mesmo sem resultado", async () => {
  const f = simular({ 1: [F2], 2: [F2], 3: [F2], 4: [F2], 5: [F2] }, 5);
  const r = await buscarFilmes({ streamings: [], ordem: "populares", busca: "x" }, 1);
  expect(r).toMatchObject({ pagina: 3, temMais: true, filmes: [] });
  expect(urlsDaBusca(f)).toHaveLength(3);
});

it("começa da página pedida", async () => {
  const f = simular({ 4: [F1] }, 10);
  const r = await buscarFilmes({ streamings: [], ordem: "populares", busca: "x" }, 4);
  expect(urlsDaBusca(f)[0].searchParams.get("page")).toBe("4");
  expect(r.pagina).toBe(4);
});

it("temMais false na última página", async () => {
  simular({ 1: [F1] }, 1);
  expect((await buscarFilmes({ streamings: [], ordem: "populares", busca: "x" }, 1)).temMais).toBe(false);
});

it("busca sem resultados no TMDB", async () => {
  simular({}, 0);
  expect(await buscarFilmes({ streamings: [], ordem: "populares", busca: "zzz" }, 1)).toEqual({
    filmes: [], pagina: 1, temMais: false,
  });
});

it("aplica a nota mínima, exigindo também 100 votos", async () => {
  const boa = { ...F1, vote_average: 8.2, vote_count: 500 };
  const fraca = { ...F3, vote_average: 7.9, vote_count: 500 };
  const poucosVotos = { ...F1, id: 1, vote_average: 9.5, vote_count: 3 };
  simular({ 1: [boa, fraca] }, 1);
  const r = await buscarFilmes({ streamings: [], ordem: "populares", notaMinima: 8, busca: "x" }, 1);
  expect(r.filmes.map((f) => f.id)).toEqual([1]);
  simular({ 1: [poucosVotos] }, 1);
  const r2 = await buscarFilmes({ streamings: [], ordem: "populares", notaMinima: 8, busca: "x" }, 1);
  expect(r2.filmes).toEqual([]);
});
