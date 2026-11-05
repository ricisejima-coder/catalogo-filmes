import Image from "next/image";
import type { PessoaElenco } from "@/lib/tmdb/tipos";

export function Elenco({ pessoas }: { pessoas: PessoaElenco[] }) {
  if (pessoas.length === 0) return null;
  return (
    <section aria-labelledby="elenco">
      <h2 id="elenco" className="mb-3 text-lg font-semibold">Elenco principal</h2>
      <ul className="grid grid-cols-3 gap-4 sm:grid-cols-5">
        {pessoas.map((p, i) => (
          <li key={`${p.nome}-${i}`} className="text-center">
            <Image
              src={p.fotoUrl ?? "/sem-foto.svg"}
              alt={p.nome}
              width={185}
              height={185}
              className="mx-auto aspect-square w-20 rounded-full object-cover ring-1 ring-white/10"
            />
            <p className="mt-2 text-sm font-medium leading-tight">{p.nome}</p>
            {p.personagem && <p className="text-xs leading-tight text-zinc-500">{p.personagem}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}
