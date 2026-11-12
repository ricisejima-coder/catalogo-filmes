import Link from "next/link";
import { type Aba, hrefAba } from "@/lib/abas";

const ABAS: { aba: Aba; rotulo: string }[] = [
  { aba: "streaming", rotulo: "Em streaming" },
  { aba: "quero_ver", rotulo: "Quero ver" },
  { aba: "ja_vi", rotulo: "Já vi" },
];

export function AbasCatalogo({ ativa }: { ativa: Aba }) {
  return (
    <nav aria-label="Listas" className="mb-5 flex gap-2">
      {ABAS.map(({ aba, rotulo }) => (
        <Link
          key={aba}
          href={hrefAba(aba)}
          aria-current={aba === ativa ? "page" : undefined}
          className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${
            aba === ativa ? "border-luz bg-luz text-tela" : "border-pelicula bg-pelicula text-apagado hover:text-texto"
          }`}
        >
          {rotulo}
        </Link>
      ))}
    </nav>
  );
}
