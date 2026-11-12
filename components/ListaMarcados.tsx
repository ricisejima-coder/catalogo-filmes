import type { FilmeMarcado } from "@/lib/filmesMarcados";
import type { Lista } from "@/lib/marcacoes/tipos";
import { CardFilme } from "./CardFilme";

type Props = { filmes: FilmeMarcado[]; lista: Lista; logado: boolean };

export function ListaMarcados({ filmes, lista, logado }: Props) {
  if (filmes.length === 0) {
    return <p className="py-16 text-center text-apagado">Nenhum filme aqui ainda. Marque filmes no catálogo.</p>;
  }
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-7 sm:gap-x-4 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
      {filmes.map((f) => (
        <li key={f.id}>
          <CardFilme filme={f} marcacao={lista} foraDoStreaming={f.foraDoStreaming} logado={logado} />
        </li>
      ))}
    </ul>
  );
}
