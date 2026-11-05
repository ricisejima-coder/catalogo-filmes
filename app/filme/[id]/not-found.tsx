import Link from "next/link";

export default function FilmeNaoEncontrado() {
  return (
    <div className="flex flex-col items-center gap-4 px-6 py-20 text-center">
      <h1 className="text-2xl font-bold">Filme não encontrado</h1>
      <Link href="/" className="rounded-full bg-amber-400 px-5 py-2 text-sm font-semibold text-zinc-950 hover:bg-amber-300">
        Voltar ao catálogo
      </Link>
    </div>
  );
}
