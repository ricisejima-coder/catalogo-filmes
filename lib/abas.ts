// Abas da página inicial. Na URL a aba aparece como ?aba=quero-ver ou ?aba=ja-vi;
// no banco e no código ela usa o mesmo valor de Lista (quero_ver, ja_vi).

import type { ParametrosUrl } from "./filtros";
import type { Lista } from "./marcacoes/tipos";

export type Aba = "streaming" | Lista;

const SEGMENTO_URL: Record<Lista, string> = {
  quero_ver: "quero-ver",
  ja_vi: "ja-vi",
};

export function lerAba(params: ParametrosUrl): Aba {
  const bruto = Array.isArray(params.aba) ? params.aba[0] : params.aba;
  if (bruto === SEGMENTO_URL.quero_ver) return "quero_ver";
  if (bruto === SEGMENTO_URL.ja_vi) return "ja_vi";
  return "streaming";
}

export function hrefAba(aba: Aba): string {
  return aba === "streaming" ? "/" : `/?aba=${SEGMENTO_URL[aba]}`;
}
