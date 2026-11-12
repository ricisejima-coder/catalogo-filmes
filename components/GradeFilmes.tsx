import type { MapaMarcacoes } from "@/lib/marcacoes/tipos";
import type { FilmeResumo } from "@/lib/tmdb/tipos";
import { CardFilme } from "./CardFilme";

type Props = {
  filmes: FilmeResumo[];
  marcacoes?: MapaMarcacoes;
  logado?: boolean;
};

export function GradeFilmes({ filmes, marcacoes = {}, logado = false }: Props) {
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-7 sm:gap-x-4 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
      {filmes.map((filme) => (
        <li key={filme.id}>
          <CardFilme filme={filme} marcacao={marcacoes[filme.id] ?? null} logado={logado} />
        </li>
      ))}
    </ul>
  );
}
