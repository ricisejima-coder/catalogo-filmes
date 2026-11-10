import { imagemUrl, paraFilmeResumo, paraStreaming } from "./imagens";

it("monta URL de imagem ou devolve null", () => {
  expect(imagemUrl("/a.jpg", "w342")).toBe("https://image.tmdb.org/t/p/w342/a.jpg");
  expect(imagemUrl(null, "w342")).toBeNull();
  expect(imagemUrl(undefined, "w92")).toBeNull();
});

it("converte filme do TMDB", () => {
  expect(
    paraFilmeResumo({
      id: 1,
      title: "X",
      release_date: "2024-05-01",
      vote_average: 7.456,
      poster_path: "/p.jpg",
      backdrop_path: "/f.jpg",
      overview: "Sinopse.",
      genre_ids: [28],
    }),
  ).toEqual({
    id: 1,
    titulo: "X",
    ano: "2024",
    nota: 7.5,
    posterUrl: "https://image.tmdb.org/t/p/w342/p.jpg",
    fundoUrl: "https://image.tmdb.org/t/p/w780/f.jpg",
    sinopse: "Sinopse.",
    generoIds: [28],
  });
  const semNada = paraFilmeResumo({ id: 2, title: "Y", release_date: "", vote_average: 0, poster_path: null, genre_ids: [] });
  expect(semNada.ano).toBeNull();
  expect(semNada.fundoUrl).toBeNull();
  expect(semNada.sinopse).toBe("");
});

it("converte provedor em streaming com logo w92", () => {
  expect(paraStreaming({ provider_id: 8, provider_name: "Netflix", logo_path: "/n.png" })).toEqual({
    id: 8,
    nome: "Netflix",
    logoUrl: "https://image.tmdb.org/t/p/w92/n.png",
  });
});
