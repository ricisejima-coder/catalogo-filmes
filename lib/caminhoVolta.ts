// Caminho de volta depois do login. Só aceita caminhos internos do próprio site,
// para que o parâmetro ?voltar= não vire um redirecionamento para outro domínio.

// Navegadores removem tab e quebra de linha da URL: "/\t/mal.com" vira "//mal.com".
const CARACTERE_DE_CONTROLE = /[\u0000-\u001f\u007f]/;

export function validarVoltar(valor: unknown): string {
  if (typeof valor !== "string" || !valor.startsWith("/")) return "/";
  if (CARACTERE_DE_CONTROLE.test(valor)) return "/";
  const segundo = valor.charAt(1);
  if (segundo === "/" || segundo === "\\") return "/";
  return valor;
}

export function hrefEntrar(voltar: string): string {
  return `/entrar?voltar=${encodeURIComponent(voltar)}`;
}
