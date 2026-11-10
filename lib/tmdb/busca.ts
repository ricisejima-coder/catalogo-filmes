import { VOTOS_MINIMOS_COM_NOTA, type Filtros } from "@/lib/filtros";
import { CACHE, PAGINA_MAXIMA, tmdbGet } from "./cliente";
import { paraFilmeResumo } from "./imagens";
import type { FilmeResumo, PaginaFilmes, TmdbFilme, TmdbPagina } from "./tipos";

// A busca por nome do TMDB não sabe filtrar por streaming. Por isso conferimos,
// filme a filme, se ele está em algum streaming por assinatura no Brasil.

const PAGINAS_POR_CHAMADA = 3;

type TmdbProvedoresDoFilme = {
  results?: Record<string, { flatrate?: { provider_id: number }[] } | undefined>;
};

async function streamingsNoBrasil(filmeId: number): Promise<number[]> {
  const r = await tmdbGet<TmdbProvedoresDoFilme>(`/movie/${filmeId}/watch/providers`, {}, CACHE.LISTAS);
  return r.results?.BR?.flatrate?.map((p) => p.provider_id) ?? [];
}

function passaNaNota(f: TmdbFilme, notaMinima: Filtros["notaMinima"]): boolean {
  if (notaMinima === undefined) return true;
  return f.vote_average >= notaMinima && (f.vote_count ?? 0) >= VOTOS_MINIMOS_COM_NOTA;
}

async function filtrarDisponiveis(resultados: TmdbFilme[], filtros: Filtros): Promise<FilmeResumo[]> {
  // Gênero e nota primeiro: são de graça e poupam consultas de streaming.
  const candidatos = resultados.filter(
    (f) =>
      (filtros.genero === undefined || f.genre_ids?.includes(filtros.genero)) &&
      passaNaNota(f, filtros.notaMinima),
  );

  const checagens = await Promise.allSettled(candidatos.map((f) => streamingsNoBrasil(f.id)));

  return candidatos
    .filter((_, i) => {
      const checagem = checagens[i];
      if (checagem.status === "rejected") return false; // na dúvida, descarta
      const ids = checagem.value;
      if (ids.length === 0) return false;
      return filtros.streamings.length === 0 || ids.some((id) => filtros.streamings.includes(id));
    })
    .map(paraFilmeResumo);
}

export async function buscarFilmes(filtros: Filtros & { busca: string }, pagina: number): Promise<PaginaFilmes> {
  let atual = pagina;
  let consumidas = 0;
  let filmes: FilmeResumo[] = [];
  let ultima: number;

  while (true) {
    const r = await tmdbGet<TmdbPagina>(
      "/search/movie",
      { query: filtros.busca, language: "pt-BR", include_adult: "false", page: atual },
      CACHE.LISTAS,
    );
    ultima = Math.min(r.total_pages, PAGINA_MAXIMA);
    filmes = await filtrarDisponiveis(r.results, filtros);
    consumidas++;

    // Página vazia depois do filtro? Tenta a próxima, até 3 por chamada.
    if (filmes.length > 0 || consumidas >= PAGINAS_POR_CHAMADA || atual >= ultima) break;
    atual++;
  }

  return { filmes, pagina: atual, temMais: atual < ultima };
}
