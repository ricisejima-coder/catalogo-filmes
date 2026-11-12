import "server-only";
import type { Lista, Marcacao } from "@/lib/marcacoes/tipos";
import { obterDetalhes } from "@/lib/tmdb/detalhes";
import type { FilmeResumo } from "@/lib/tmdb/tipos";

export type FilmeMarcado = FilmeResumo & { foraDoStreaming: boolean };

/**
 * Busca no TMDB os filmes de uma lista, na ordem recebida (mais recentes primeiro).
 * Filme que o TMDB não acha, ou cuja busca falha, fica de fora sem derrubar os outros.
 * Sem streaming no Brasil (ondeAssistir vazio) vira `foraDoStreaming`.
 */
export async function carregarFilmesMarcados(marcacoes: Marcacao[], lista: Lista): Promise<FilmeMarcado[]> {
  const ids = marcacoes.filter((m) => m.lista === lista).map((m) => m.filmeId);
  const resultados = await Promise.allSettled(ids.map((id) => obterDetalhes(id)));
  return resultados.flatMap((r) =>
    r.status === "fulfilled"
      ? [
          {
            id: r.value.id,
            titulo: r.value.titulo,
            ano: r.value.ano,
            nota: r.value.nota,
            posterUrl: r.value.posterUrl,
            fundoUrl: r.value.fundoUrl,
            generoIds: [],
            foraDoStreaming: r.value.ondeAssistir.length === 0,
          },
        ]
      : [],
  );
}
