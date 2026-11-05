import { ErroTmdb } from "@/lib/tmdb/cliente";
import { GET } from "./route";

const { listarFilmes } = vi.hoisted(() => ({ listarFilmes: vi.fn() }));
vi.mock("@/lib/tmdb/catalogo", () => ({ listarFilmes, PAGINA_MAXIMA: 500 }));
beforeEach(() => {
  listarFilmes.mockReset();
});

it("lê filtros e página da URL", async () => {
  listarFilmes.mockResolvedValue({ filmes: [], pagina: 2, temMais: false });
  const r = await GET(new Request("http://x/api/filmes?streaming=8&pagina=2"));
  expect(listarFilmes).toHaveBeenCalledWith({ streamings: [8], ordem: "populares" }, 2);
  expect(r.status).toBe(200);
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
  const r = await GET(new Request("http://x/api/filmes"));
  expect(r.status).toBe(502);
  expect(await r.json()).toEqual({ erro: "Falha ao consultar o TMDB" });
});
