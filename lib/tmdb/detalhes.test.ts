import { instalarFetchFalso } from "@/tests/fetchFalso";
import { ErroNaoEncontrado } from "./cliente";
import { formatarDuracao, obterDetalhes } from "./detalhes";

beforeEach(() => vi.stubEnv("TMDB_READ_TOKEN", "tok"));

const detalheCompleto = {
  id: 10,
  title: "Título em Português",
  original_title: "Original Title",
  release_date: "2021-09-15",
  runtime: 135,
  genres: [{ id: 28, name: "Ação" }],
  vote_average: 7.86,
  overview: "Uma sinopse.",
  poster_path: "/p.jpg",
  backdrop_path: "/b.jpg",
  credits: {
    cast: Array.from({ length: 12 }, (_, i) => ({ name: `Ator ${i}`, character: `Papel ${i}`, profile_path: i === 0 ? "/a.jpg" : null })),
  },
  videos: {
    results: [
      { key: "teaserKey", site: "YouTube", type: "Teaser", iso_639_1: "pt" },
      { key: "enKey", site: "YouTube", type: "Trailer", iso_639_1: "en" },
      { key: "ptKey", site: "YouTube", type: "Trailer", iso_639_1: "pt" },
    ],
  },
  "watch/providers": {
    results: { BR: { flatrate: [{ provider_id: 8, provider_name: "Netflix", logo_path: "/n.png" }] } },
  },
};

const detalheMinimo = {
  id: 11,
  title: "Mesmo",
  original_title: "Mesmo",
  release_date: "",
  runtime: 0,
  genres: [],
  vote_average: 0,
  overview: "",
  poster_path: null,
  backdrop_path: null,
  credits: { cast: [] },
  videos: { results: [] },
  "watch/providers": { results: {} },
};

it("formata duração", () => {
  expect(formatarDuracao(135)).toBe("2h 15min");
  expect(formatarDuracao(45)).toBe("45min");
  expect(formatarDuracao(120)).toBe("2h");
  expect(formatarDuracao(0)).toBeNull();
  expect(formatarDuracao(null)).toBeNull();
  expect(formatarDuracao(undefined)).toBeNull();
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
  expect(d).toMatchObject({
    id: 10,
    titulo: "Título em Português",
    tituloOriginal: "Original Title",
    ano: "2021",
    duracao: "2h 15min",
    generos: ["Ação"],
    nota: 7.9,
    sinopse: "Uma sinopse.",
    posterUrl: "https://image.tmdb.org/t/p/w500/p.jpg",
    fundoUrl: "https://image.tmdb.org/t/p/w1280/b.jpg",
    trailerYoutubeId: "ptKey",
  });
  expect(d.ondeAssistir).toEqual([{ id: 8, nome: "Netflix", logoUrl: "https://image.tmdb.org/t/p/w92/n.png" }]);
  expect(d.elenco).toHaveLength(10);
  expect(d.elenco[0]).toEqual({ nome: "Ator 0", personagem: "Papel 0", fotoUrl: "https://image.tmdb.org/t/p/w185/a.jpg" });
  expect(d.elenco[1].fotoUrl).toBeNull();
});

it("sem trailer em pt usa o primeiro trailer do YouTube", async () => {
  instalarFetchFalso({
    "/movie/10": { ...detalheCompleto, videos: { results: [detalheCompleto.videos.results[1]] } },
  });
  expect((await obterDetalhes(10)).trailerYoutubeId).toBe("enKey");
});

it("campos ausentes viram null ou vazio", async () => {
  instalarFetchFalso({ "/movie/11": detalheMinimo });
  const d = await obterDetalhes(11);
  expect(d).toMatchObject({
    tituloOriginal: null, ano: null, duracao: null, posterUrl: null, fundoUrl: null,
    ondeAssistir: [], elenco: [], trailerYoutubeId: null,
  });
});

it("vídeo que não é Trailer do YouTube é ignorado", async () => {
  instalarFetchFalso({
    "/movie/11": {
      ...detalheMinimo,
      videos: { results: [
        { key: "t", site: "YouTube", type: "Teaser", iso_639_1: "pt" },
        { key: "v", site: "Vimeo", type: "Trailer", iso_639_1: "pt" },
      ] },
    },
  });
  expect((await obterDetalhes(11)).trailerYoutubeId).toBeNull();
});

it("404 propaga ErroNaoEncontrado", async () => {
  instalarFetchFalso({});
  await expect(obterDetalhes(99)).rejects.toBeInstanceOf(ErroNaoEncontrado);
});
