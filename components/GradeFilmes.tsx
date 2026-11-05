import type { FilmeResumo } from "@/lib/tmdb/tipos";
import { CardFilme } from "./CardFilme";

export function GradeFilmes({ filmes }: { filmes: FilmeResumo[] }) {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {filmes.map((filme) => (
        <li key={filme.id}>
          <CardFilme filme={filme} />
        </li>
      ))}
    </ul>
  );
}
