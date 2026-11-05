import { CACHE, tmdbGet } from "./cliente";
import { anoDe, arredondarNota, imagemUrl, paraStreaming } from "./imagens";
import type { FilmeDetalhe, TmdbProvedor } from "./tipos";

const MAXIMO_ELENCO = 10;

type TmdbVideo = { key: string; site: string; type: string; iso_639_1?: string };

type TmdbDetalhe = {
  id: number;
  title: string;
  original_title?: string;
  release_date?: string;
  runtime?: number | null;
  genres?: { id: number; name: string }[];
  vote_average?: number;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  credits?: { cast?: { name: string; character?: string; profile_path?: string | null }[] };
  videos?: { results?: TmdbVideo[] };
  "watch/providers"?: { results?: Record<string, { flatrate?: TmdbProvedor[] } | undefined> };
};

export function formatarDuracao(minutos: number | null | undefined): string | null {
  if (!minutos || minutos <= 0) return null;
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  if (h === 0) return `${m}min`;
  return m === 0 ? `${h}h` : `${h}h ${m}min`;
}

function escolherTrailer(videos: TmdbVideo[]): string | null {
  const trailers = videos.filter((v) => v.site === "YouTube" && v.type === "Trailer");
  const preferido = trailers.find((v) => v.iso_639_1 === "pt") ?? trailers[0];
  return preferido?.key ?? null;
}

export async function obterDetalhes(id: number): Promise<FilmeDetalhe> {
  const d = await tmdbGet<TmdbDetalhe>(
    `/movie/${id}`,
    { language: "pt-BR", append_to_response: "credits,videos,watch/providers", include_video_language: "pt,en" },
    CACHE.DETALHES,
  );

  return {
    id: d.id,
    titulo: d.title,
    tituloOriginal: d.original_title && d.original_title !== d.title ? d.original_title : null,
    ano: anoDe(d.release_date),
    duracao: formatarDuracao(d.runtime),
    generos: (d.genres ?? []).map((g) => g.name),
    nota: arredondarNota(d.vote_average ?? 0),
    sinopse: d.overview ?? "",
    posterUrl: imagemUrl(d.poster_path, "w500"),
    fundoUrl: imagemUrl(d.backdrop_path, "w1280"),
    ondeAssistir: (d["watch/providers"]?.results?.BR?.flatrate ?? []).map(paraStreaming),
    elenco: (d.credits?.cast ?? []).slice(0, MAXIMO_ELENCO).map((p) => ({
      nome: p.name,
      personagem: p.character ?? "",
      fotoUrl: imagemUrl(p.profile_path, "w185"),
    })),
    trailerYoutubeId: escolherTrailer(d.videos?.results ?? []),
  };
}
