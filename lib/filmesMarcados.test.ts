import { ErroNaoEncontrado } from "@/lib/tmdb/cliente";
import { obterDetalhes } from "@/lib/tmdb/detalhes";
import type { FilmeDetalhe } from "@/lib/tmdb/tipos";
import { carregarFilmesMarcados } from "./filmesMarcados";

vi.mock("@/lib/tmdb/detalhes", () => ({ obterDetalhes: vi.fn() }));

function detalhe(id: number, streaming = true): FilmeDetalhe {
  return {
    id,
    titulo: `Filme ${id}`,
    tituloOriginal: null,
    ano: "2020",
    duracao: null,
    generos: ["Drama"],
    nota: 7.5,
    sinopse: "x",
    posterUrl: `p${id}`,
    fundoUrl: `f${id}`,
    ondeAssistir: streaming ? [{ id: 1, nome: "Netflix", logoUrl: null }] : [],
    elenco: [],
    trailerYoutubeId: null,
  };
}

const m = (filmeId: number, lista: "quero_ver" | "ja_vi") => ({ filmeId, lista, criadoEm: "2026-01-01" });

beforeEach(() => vi.mocked(obterDetalhes).mockReset());

it("filtra pela lista, mantém a ordem recebida e marca foraDoStreaming quando ondeAssistir está vazio", async () => {
  vi.mocked(obterDetalhes).mockImplementation(async (id) => detalhe(id, id !== 3));
  const r = await carregarFilmesMarcados([m(3, "quero_ver"), m(2, "ja_vi"), m(1, "quero_ver")], "quero_ver");
  expect(r.map((f) => [f.id, f.foraDoStreaming])).toEqual([
    [3, true],
    [1, false],
  ]);
  expect(obterDetalhes).not.toHaveBeenCalledWith(2);
});

it("filme que o TMDB não acha (ou que falha) fica de fora sem derrubar o resto", async () => {
  vi.mocked(obterDetalhes).mockImplementation(async (id) => {
    if (id === 1) throw new ErroNaoEncontrado();
    if (id === 2) throw new Error("falhou");
    return detalhe(id);
  });
  const r = await carregarFilmesMarcados([m(1, "ja_vi"), m(2, "ja_vi"), m(3, "ja_vi")], "ja_vi");
  expect(r.map((f) => f.id)).toEqual([3]);
});

it("converte FilmeDetalhe em FilmeResumo: id, titulo, ano, nota, posterUrl, fundoUrl, generoIds []", async () => {
  vi.mocked(obterDetalhes).mockResolvedValue(detalhe(5));
  const [f] = await carregarFilmesMarcados([m(5, "ja_vi")], "ja_vi");
  expect(f).toEqual({
    id: 5,
    titulo: "Filme 5",
    ano: "2020",
    nota: 7.5,
    posterUrl: "p5",
    fundoUrl: "f5",
    generoIds: [],
    foraDoStreaming: false,
  });
});
