// Filtros do catálogo. Eles vivem na URL (?streaming=8,119&genero=28...),
// então o botão "voltar" funciona e qualquer link já abre filtrado.

export type Ordem = "populares" | "avaliados" | "recentes";

export type Filtros = {
  streamings: number[]; // ids de provedores do TMDB; vazio = todos
  genero?: number; // id de gênero do TMDB
  ordem: Ordem;
  busca?: string; // texto já aparado; ausente = sem busca
};

export type ParametrosUrl = Record<string, string | string[] | undefined>;

export const FILTROS_PADRAO: Filtros = { streamings: [], ordem: "populares" };

const ORDENS: readonly Ordem[] = ["populares", "avaliados", "recentes"];

function primeiro(valor: string | string[] | undefined): string | undefined {
  return Array.isArray(valor) ? valor[0] : valor;
}

function idPositivo(texto: string): number | undefined {
  if (!/^\d+$/.test(texto)) return undefined;
  const n = Number(texto);
  return n > 0 ? n : undefined;
}

export function lerFiltros(params: ParametrosUrl): Filtros {
  const filtros: Filtros = { streamings: [], ordem: FILTROS_PADRAO.ordem };

  const ids = (primeiro(params.streaming) ?? "")
    .split(",")
    .map((parte) => idPositivo(parte.trim()))
    .filter((id): id is number => id !== undefined);
  filtros.streamings = [...new Set(ids)];

  const genero = idPositivo(primeiro(params.genero) ?? "");
  if (genero !== undefined) filtros.genero = genero;

  const ordem = primeiro(params.ordem);
  if (ORDENS.includes(ordem as Ordem)) filtros.ordem = ordem as Ordem;

  const busca = primeiro(params.busca)?.trim();
  if (busca) filtros.busca = busca;

  return filtros;
}

export function escreverFiltros(filtros: Filtros): string {
  const params = new URLSearchParams();
  if (filtros.streamings.length > 0) params.set("streaming", filtros.streamings.join(","));
  if (filtros.genero !== undefined) params.set("genero", String(filtros.genero));
  if (filtros.ordem !== FILTROS_PADRAO.ordem) params.set("ordem", filtros.ordem);
  const busca = filtros.busca?.trim();
  if (busca) params.set("busca", busca);
  return params.toString();
}
