import { lerFiltros } from "@/lib/filtros";
import { listarFilmes, PAGINA_MAXIMA } from "@/lib/tmdb/catalogo";
import { ErroTmdb } from "@/lib/tmdb/cliente";

// Usado pelo botão "Carregar mais": devolve a página pedida do catálogo em JSON.

function lerPagina(valor: string | null): number {
  const n = Number.parseInt(valor ?? "", 10);
  if (Number.isNaN(n)) return 1;
  return Math.min(Math.max(n, 1), PAGINA_MAXIMA);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filtros = lerFiltros(Object.fromEntries(searchParams));
  try {
    return Response.json(await listarFilmes(filtros, lerPagina(searchParams.get("pagina"))));
  } catch (erro) {
    if (erro instanceof ErroTmdb) {
      return Response.json({ erro: "Falha ao consultar o TMDB" }, { status: 502 });
    }
    throw erro;
  }
}
