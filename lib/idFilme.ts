/** Converte o trecho da URL /filme/[id] em número; qualquer coisa estranha vira null. */
export function lerIdFilme(bruto: string): number | null {
  if (!/^\d+$/.test(bruto)) return null;
  const id = Number(bruto);
  return id > 0 ? id : null;
}
