export type Lista = "quero_ver" | "ja_vi";

export const LISTAS: readonly Lista[] = ["quero_ver", "ja_vi"];

export type Marcacao = { filmeId: number; lista: Lista; criadoEm: string };

export type MapaMarcacoes = Record<number, Lista>;

export type ResultadoMarcacao = "ok" | "sem-login" | "erro";
