import "server-only";

// Único lugar do app que conhece o token do TMDB. Roda só no servidor.

const BASE_URL = "https://api.themoviedb.org/3";
const TIMEOUT_MS = 8000;

/** Tempo de cache, em segundos. */
export const CACHE = { REFERENCIAS: 86400, LISTAS: 21600, DETALHES: 86400 } as const;

/** O TMDB não devolve páginas além da 500. */
export const PAGINA_MAXIMA = 500;

export class ErroTmdb extends Error {
  constructor(
    mensagem: string,
    public status?: number,
  ) {
    super(mensagem);
    this.name = "ErroTmdb";
  }
}

export class ErroNaoEncontrado extends ErroTmdb {
  constructor() {
    super("Não encontrado no TMDB", 404);
    this.name = "ErroNaoEncontrado";
  }
}

export async function tmdbGet<T>(
  caminho: string,
  params: Record<string, string | number | undefined>,
  revalidate: number,
): Promise<T> {
  const token = process.env.TMDB_READ_TOKEN;
  if (!token) throw new Error("Defina TMDB_READ_TOKEN em .env.local");

  const url = new URL(BASE_URL + caminho);
  for (const [chave, valor] of Object.entries(params)) {
    if (valor !== undefined) url.searchParams.set(chave, String(valor));
  }

  let resposta: Response;
  try {
    resposta = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, accept: "application/json" },
      next: { revalidate },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    throw new ErroTmdb("Falha ao consultar o TMDB");
  }

  if (resposta.status === 404) throw new ErroNaoEncontrado();
  if (!resposta.ok) throw new ErroTmdb("Falha ao consultar o TMDB", resposta.status);
  return (await resposta.json()) as T;
}
