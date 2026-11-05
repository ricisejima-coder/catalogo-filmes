import { FILTROS_PADRAO } from "@/lib/filtros";
import { instalarFetchFalso } from "@/tests/fetchFalso";
import { descobrirFilmes, listarFilmes } from "./catalogo";

beforeEach(() => vi.stubEnv("TMDB_READ_TOKEN", "tok"));

const pag = {
  page: 1,
  total_pages: 3,
  results: [{ id: 1, title: "A", release_date: "2020-01-01", vote_average: 8, poster_path: null, genre_ids: [] }],
};
const params = (f: ReturnType<typeof vi.fn>, i = 0) => new URL(String(f.mock.calls[i][0])).searchParams;

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
  expect(params(f).has("with_genres")).toBe(false);
});

it("ordem avaliados exige 300 votos", async () => {
  const f = instalarFetchFalso({ "/discover/movie": pag });
  await descobrirFilmes({ streamings: [], ordem: "avaliados" }, 1, [8]);
  expect(params(f).get("sort_by")).toBe("vote_average.desc");
  expect(params(f).get("vote_count.gte")).toBe("300");
});

it("ordem recentes não inclui filmes futuros", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
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
  expect(await descobrirFilmes(FILTROS_PADRAO, 1, [8])).toMatchObject({
    pagina: 1,
    temMais: true,
    filmes: [{ id: 1, titulo: "A" }],
  });
});

it("listarFilmes sem busca usa os ids de todos os streamings", async () => {
  const f = instalarFetchFalso({
    "/watch/providers/movie": { results: [{ provider_id: 8, provider_name: "Netflix", logo_path: null, display_priority: 1 }] },
    "/discover/movie": pag,
  });
  await listarFilmes(FILTROS_PADRAO, 1);
  const discover = f.mock.calls.map((c) => new URL(String(c[0]))).find((u) => u.pathname.endsWith("/discover/movie"))!;
  expect(discover.searchParams.get("with_watch_providers")).toBe("8");
});

it("listarFilmes com busca usa /search/movie e não /discover/movie", async () => {
  const f = instalarFetchFalso({
    "/watch/providers/movie": { results: [] },
    "/search/movie": { page: 1, total_pages: 1, results: [] },
    "/discover/movie": pag,
  });
  await listarFilmes({ ...FILTROS_PADRAO, busca: "batman" }, 1);
  const caminhos = f.mock.calls.map((c) => new URL(String(c[0])).pathname);
  expect(caminhos).toContain("/3/search/movie");
  expect(caminhos).not.toContain("/3/discover/movie");
});
