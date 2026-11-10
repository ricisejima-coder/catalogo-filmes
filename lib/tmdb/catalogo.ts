import { VOTOS_MINIMOS_COM_NOTA, type Filtros, type NotaMinima, type Ordem } from "@/lib/filtros";
import { CACHE, PAGINA_MAXIMA, tmdbGet } from "./cliente";
import { paraFilmeResumo } from "./imagens";
import { buscarFilmes } from "./busca";
import { listarStreamings } from "./referencias";
import type { PaginaFilmes, TmdbPagina } from "./tipos";

export { PAGINA_MAXIMA };

function parametrosDeOrdem(ordem: Ordem): Record<string, string | number> {
  switch (ordem) {
    case "avaliados":
      // Exige um mínimo de votos para não aparecer filme obscuro com nota 10.
      return { sort_by: "vote_average.desc", "vote_count.gte": 300 };
    case "recentes":
      // Só o que já estreou.
      return { sort_by: "primary_release_date.desc", "primary_release_date.lte": new Date().toISOString().slice(0, 10) };
    default:
      return { sort_by: "popularity.desc" };
  }
}

function parametrosDeNota(nota: NotaMinima | undefined): Record<string, number> {
  if (nota === undefined) return {};
  return { "vote_average.gte": nota, "vote_count.gte": VOTOS_MINIMOS_COM_NOTA };
}

export async function descobrirFilmes(
  filtros: Filtros,
  pagina: number,
  todosStreamingIds: number[],
): Promise<PaginaFilmes> {
  const ids = filtros.streamings.length > 0 ? filtros.streamings : todosStreamingIds;
  const r = await tmdbGet<TmdbPagina>(
    "/discover/movie",
    {
      language: "pt-BR",
      watch_region: "BR",
      with_watch_monetization_types: "flatrate",
      include_adult: "false",
      with_watch_providers: ids.join("|"), // "|" = OU: em qualquer um dos streamings
      with_genres: filtros.genero,
      ...parametrosDeNota(filtros.notaMinima),
      // Vem depois da nota: se a ordem exigir mais votos (avaliados = 300), ela vence.
      ...parametrosDeOrdem(filtros.ordem),
      page: pagina,
    },
    CACHE.LISTAS,
  );
  return {
    filmes: r.results.map(paraFilmeResumo),
    pagina,
    temMais: pagina < Math.min(r.total_pages, PAGINA_MAXIMA),
  };
}

export async function listarFilmes(filtros: Filtros, pagina: number): Promise<PaginaFilmes> {
  if (filtros.busca) return buscarFilmes({ ...filtros, busca: filtros.busca }, pagina);
  const streamings = await listarStreamings();
  return descobrirFilmes(filtros, pagina, streamings.map((s) => s.id));
}
