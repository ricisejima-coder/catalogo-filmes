import { CACHE, tmdbGet } from "./cliente";
import { paraStreaming } from "./imagens";
import type { Genero, Streaming, TmdbProvedor } from "./tipos";

const QUANTIDADE_STREAMINGS = 12;

export async function listarStreamings(): Promise<Streaming[]> {
  const r = await tmdbGet<{ results: TmdbProvedor[] }>(
    "/watch/providers/movie",
    { watch_region: "BR", language: "pt-BR" },
    CACHE.REFERENCIAS,
  );
  return [...r.results]
    .sort((a, b) => (a.display_priority ?? Infinity) - (b.display_priority ?? Infinity))
    .slice(0, QUANTIDADE_STREAMINGS)
    .map(paraStreaming);
}

export async function listarGeneros(): Promise<Genero[]> {
  const r = await tmdbGet<{ genres: { id: number; name: string }[] }>(
    "/genre/movie/list",
    { language: "pt-BR" },
    CACHE.REFERENCIAS,
  );
  return r.genres.map((g) => ({ id: g.id, nome: g.name }));
}
