// Caminho de volta depois do login. Só aceita caminhos internos do próprio site,
// para que o parâmetro ?voltar= não vire um redirecionamento para outro domínio.

export function validarVoltar(valor: unknown): string {
  if (typeof valor !== "string" || !valor.startsWith("/")) return "/";
  const segundo = valor.charAt(1);
  if (segundo === "/" || segundo === "\\") return "/";
  return valor;
}

export function hrefEntrar(voltar: string): string {
  return `/entrar?voltar=${encodeURIComponent(voltar)}`;
}
