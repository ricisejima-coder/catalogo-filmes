import Link from "next/link";

const BOTAO =
  "rounded-md border border-white/20 px-4 py-1.5 text-sm font-medium text-texto hover:border-luz hover:text-luz focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-luz";

export function MenuConta({
  usuario,
  acaoSair,
}: {
  usuario: { email: string } | null;
  acaoSair: () => Promise<void>;
}) {
  if (!usuario) {
    return (
      <Link href="/entrar" className={BOTAO}>
        Entrar
      </Link>
    );
  }
  return (
    <form action={acaoSair} className="flex items-center gap-3">
      <span className="hidden max-w-48 truncate text-sm text-apagado sm:inline">{usuario.email}</span>
      <button type="submit" className={BOTAO}>
        Sair
      </button>
    </form>
  );
}
