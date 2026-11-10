import type { FilmeResumo } from "@/lib/tmdb/tipos";
import { CardFilme } from "./CardFilme";

export function GradeFilmes({ filmes }: { filmes: FilmeResumo[] }) {
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-7 sm:gap-x-4 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
      {filmes.map((filme) => (
        <li key={filme.id}>
          <CardFilme filme={filme} />
        </li>
      ))}
    </ul>
  );
}
