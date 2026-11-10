import type { FilmeResumo, Streaming, TmdbFilme, TmdbProvedor } from "./tipos";

export type TamanhoImagem = "w92" | "w185" | "w342" | "w500" | "w780" | "w1280";

export function imagemUrl(caminho: string | null | undefined, tamanho: TamanhoImagem): string | null {
  return caminho ? `https://image.tmdb.org/t/p/${tamanho}${caminho}` : null;
}

export function anoDe(data: string | undefined): string | null {
  return data && data.length >= 4 ? data.slice(0, 4) : null;
}

export function arredondarNota(nota: number): number {
  return Math.round(nota * 10) / 10;
}

export function paraFilmeResumo(f: TmdbFilme): FilmeResumo {
  return {
    id: f.id,
    titulo: f.title,
    ano: anoDe(f.release_date),
    nota: arredondarNota(f.vote_average),
    posterUrl: imagemUrl(f.poster_path, "w342"),
    fundoUrl: imagemUrl(f.backdrop_path, "w780"),
    sinopse: f.overview ?? "",
    generoIds: f.genre_ids ?? [],
  };
}

export function paraStreaming(p: TmdbProvedor): Streaming {
  return { id: p.provider_id, nome: p.provider_name, logoUrl: imagemUrl(p.logo_path, "w92") };
}
