import { instalarFetchFalso } from "@/tests/fetchFalso";
import { listarGeneros, listarStreamings, STREAMINGS_PRINCIPAIS } from "./referencias";

beforeEach(() => vi.stubEnv("TMDB_READ_TOKEN", "tok"));

it("lista só os streamings escolhidos, na ordem da lista fixa", async () => {
  const f = instalarFetchFalso({
    "/watch/providers/movie": {
      results: [
        { provider_id: 2791, provider_name: "JustWatch TV Beta", logo_path: "/j.png", display_priority: 1 },
        { provider_id: 1899, provider_name: "HBO Max", logo_path: "/h.png", display_priority: 50 },
        { provider_id: 2, provider_name: "Apple TV Store", logo_path: "/s.png", display_priority: 2 },
        { provider_id: 8, provider_name: "Netflix", logo_path: "/n.png", display_priority: 0 },
      ],
    },
  });
  expect(await listarStreamings()).toEqual([
    { id: 8, nome: "Netflix", logoUrl: "https://image.tmdb.org/t/p/w92/n.png" },
    { id: 1899, nome: "HBO Max", logoUrl: "https://image.tmdb.org/t/p/w92/h.png" },
  ]);
  const url = new URL(String(f.mock.calls[0][0]));
  expect(url.searchParams.get("watch_region")).toBe("BR");
  expect(url.searchParams.get("language")).toBe("pt-BR");
});

it("a lista fixa tem os 11 streamings principais do Brasil", () => {
  expect(STREAMINGS_PRINCIPAIS).toEqual([8, 119, 337, 1899, 307, 350, 531, 283, 11, 47, 167]);
});

it("lista gêneros em pt-BR", async () => {
  const f = instalarFetchFalso({ "/genre/movie/list": { genres: [{ id: 28, name: "Ação" }] } });
  expect(await listarGeneros()).toEqual([{ id: 28, nome: "Ação" }]);
  expect(new URL(String(f.mock.calls[0][0])).searchParams.get("language")).toBe("pt-BR");
});
