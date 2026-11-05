export default function Carregando() {
  return (
    <div aria-busy="true" aria-label="Carregando filmes">
      <div className="mb-8 h-36 animate-pulse rounded-2xl bg-zinc-900" />
      <ul className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {Array.from({ length: 20 }, (_, i) => (
          <li key={i}>
            <div className="aspect-[2/3] animate-pulse rounded-lg bg-zinc-800" />
            <div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-zinc-800" />
            <div className="mt-1 h-3 w-1/4 animate-pulse rounded bg-zinc-800" />
          </li>
        ))}
      </ul>
    </div>
  );
}
