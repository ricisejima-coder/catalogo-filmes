import { vi } from "vitest";

export function respostaJson(corpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { "content-type": "application/json" },
  });
}

/**
 * Substitui o fetch global. Responde pela pathname depois de "/3"
 * (ex.: "/discover/movie"). Rota ausente → 404.
 */
export function instalarFetchFalso(rotas: Record<string, unknown>) {
  const falso = vi.fn(async (entrada: RequestInfo | URL) => {
    const caminho = new URL(String(entrada)).pathname.replace(/^\/3/, "");
    return caminho in rotas ? respostaJson(rotas[caminho]) : respostaJson({}, 404);
  });
  vi.stubGlobal("fetch", falso);
  return falso;
}
