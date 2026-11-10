// Tipos do app: o resto do código só conhece estes formatos, nunca o JSON cru do TMDB.

export type Streaming = { id: number; nome: string; logoUrl: string | null };
export type Genero = { id: number; nome: string };

export type FilmeResumo = {
  id: number;
  titulo: string;
  ano: string | null;
  nota: number;
  posterUrl: string | null;
  /** Imagem deitada (cena do filme), usada nos cartões e no destaque. */
  fundoUrl?: string | null;
  sinopse?: string;
  generoIds: number[];
};

/** `pagina` é a última página do TMDB consumida; a próxima chamada pede `pagina + 1`. */
export type PaginaFilmes = { filmes: FilmeResumo[]; pagina: number; temMais: boolean };

export type PessoaElenco = { nome: string; personagem: string; fotoUrl: string | null };

export type FilmeDetalhe = {
  id: number;
  titulo: string;
  tituloOriginal: string | null;
  ano: string | null;
  duracao: string | null;
  generos: string[];
  nota: number;
  sinopse: string;
  posterUrl: string | null;
  fundoUrl: string | null;
  ondeAssistir: Streaming[];
  elenco: PessoaElenco[];
  trailerYoutubeId: string | null;
};

// Formatos crus da API (apenas os campos que usamos).
export type TmdbFilme = {
  id: number;
  title: string;
  release_date?: string;
  vote_average: number;
  vote_count?: number;
  poster_path: string | null;
  backdrop_path?: string | null;
  overview?: string;
  genre_ids: number[];
};
export type TmdbPagina = { page: number; total_pages: number; results: TmdbFilme[] };
export type TmdbProvedor = {
  provider_id: number;
  provider_name: string;
  logo_path: string | null;
  display_priority?: number;
};
