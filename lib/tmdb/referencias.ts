import { CACHE, tmdbGet } from "./cliente";
import { paraStreaming } from "./imagens";
import type { Genero, Streaming, TmdbProvedor } from "./tipos";

/**
 * Streamings por assinatura mais conhecidos no Brasil, na ordem em que aparecem no filtro.
 * A ordem de prioridade do TMDB mistura lojas (aluguel/compra) e serviços de teste,
 * por isso usamos uma lista escolhida. Ids: Netflix, Prime Video, Disney+, HBO Max,
 * Globoplay, Apple TV, Paramount+, Crunchyroll, MUBI, Looke, Claro video.
 */
export const STREAMINGS_PRINCIPAIS = [8, 119, 337, 1899, 307, 350, 531, 283, 11, 47, 167];

export async function listarStreamings(): Promise<Streaming[]> {
  const r = await tmdbGet<{ results: TmdbProvedor[] }>(
    "/watch/providers/movie",
    { watch_region: "BR", language: "pt-BR" },
    CACHE.REFERENCIAS,
  );
  const porId = new Map(r.results.map((p) => [p.provider_id, p]));
  return STREAMINGS_PRINCIPAIS.flatMap((id) => {
    const provedor = porId.get(id);
    return provedor ? [paraStreaming(provedor)] : []; // some se o TMDB deixar de listá-lo
  });
}

export async function listarGeneros(): Promise<Genero[]> {
  const r = await tmdbGet<{ genres: { id: number; name: string }[] }>(
    "/genre/movie/list",
    { language: "pt-BR" },
    CACHE.REFERENCIAS,
  );
  return r.genres.map((g) => ({ id: g.id, nome: g.name }));
}
