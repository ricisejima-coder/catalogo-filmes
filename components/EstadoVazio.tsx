import Link from "next/link";

export function EstadoVazio() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-zinc-700 px-6 py-16 text-center">
      <p className="text-lg text-zinc-300">Nenhum filme encontrado com esses filtros</p>
      <Link href="/" className="rounded-full bg-amber-400 px-5 py-2 text-sm font-semibold text-zinc-950 hover:bg-amber-300">
        Limpar filtros
      </Link>
    </div>
  );
}
