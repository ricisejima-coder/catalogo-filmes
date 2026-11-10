import Link from "next/link";

export function EstadoVazio() {
  return (
    <div className="flex flex-col items-center gap-4 px-6 py-16 text-center">
      <p className="text-lg text-texto">Nenhum filme encontrado com esses filtros</p>
      <Link href="/" className="rounded-md bg-luz px-5 py-2 text-sm font-semibold text-tela hover:bg-texto">
        Limpar filtros
      </Link>
    </div>
  );
}
