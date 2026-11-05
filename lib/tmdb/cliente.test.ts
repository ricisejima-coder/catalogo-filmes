import { respostaJson } from "@/tests/fetchFalso";
import { ErroNaoEncontrado, ErroTmdb, tmdbGet } from "./cliente";

beforeEach(() => {
  vi.stubEnv("TMDB_READ_TOKEN", "tok");
});

it("chama a URL certa com token e parâmetros, omitindo indefinidos", async () => {
  const f = vi.fn().mockResolvedValue(respostaJson({ ok: 1 }));
  vi.stubGlobal("fetch", f);
  const r = await tmdbGet<{ ok: number }>("/discover/movie", { page: 2, with_genres: undefined }, 21600);
  expect(r).toEqual({ ok: 1 });
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
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(respostaJson({}, 500)));
  await expect(tmdbGet("/x", {}, 1)).rejects.toMatchObject({ name: "ErroTmdb", status: 500 });
});

it("falha de rede ou timeout vira ErroTmdb", async () => {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new DOMException("t", "TimeoutError")));
  await expect(tmdbGet("/x", {}, 1)).rejects.toBeInstanceOf(ErroTmdb);
});

it("sem token lança erro explicativo", async () => {
  vi.stubEnv("TMDB_READ_TOKEN", "");
  await expect(tmdbGet("/x", {}, 1)).rejects.toThrow("Defina TMDB_READ_TOKEN em .env.local");
});
