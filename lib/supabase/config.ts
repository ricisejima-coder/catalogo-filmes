type Ambiente = Record<string, string | undefined>;

// Os nomes ficam escritos por extenso porque o Next só troca NEXT_PUBLIC_*
// pelo valor quando o acesso é literal (process.env.NOME).
function ambientePadrao(): Ambiente {
  return {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  };
}

export function lerConfigSupabase(env: Ambiente = ambientePadrao()): {
  url: string;
  chave: string;
} {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const ausentes: string[] = [];
  if (!url) ausentes.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!chave) ausentes.push("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  if (!url || !chave) {
    throw new Error(`Defina ${ausentes.join(", ")} em .env.local`);
  }
  return { url, chave };
}
