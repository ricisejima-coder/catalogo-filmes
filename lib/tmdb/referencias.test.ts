import { instalarFetchFalso } from "@/tests/fetchFalso";
import { listarGeneros, listarStreamings } from "./referencias";

beforeEach(() => vi.stubEnv("TMDB_READ_TOKEN", "tok"));

it("lista os 12 streamings de maior prioridade no BR", async () => {
  const provs = Array.from({ length: 15 }, (_, i) => ({
    provider_id: i + 1,
    provider_name: `P${i + 1}`,
    logo_path: "/l.png",
    display_priority: 15 - i,
  }));
  const f = instalarFetchFalso({ "/watch/providers/movie": { results: provs } });
  const r = await listarStreamings();
  expect(r).toHaveLength(12);
  expect(r[0]).toEqual({ id: 15, nome: "P15", logoUrl: "https://image.tmdb.org/t/p/w92/l.png" });
  expect(r[11].id).toBe(4);
  const url = new URL(String(f.mock.calls[0][0]));
  expect(url.searchParams.get("watch_region")).toBe("BR");
  expect(url.searchParams.get("language")).toBe("pt-BR");
});

it("lista gêneros em pt-BR", async () => {
  const f = instalarFetchFalso({ "/genre/movie/list": { genres: [{ id: 28, name: "Ação" }] } });
  expect(await listarGeneros()).toEqual([{ id: 28, nome: "Ação" }]);
  expect(new URL(String(f.mock.calls[0][0])).searchParams.get("language")).toBe("pt-BR");
});
