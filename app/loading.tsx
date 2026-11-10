export default function Carregando() {
  return (
    <div aria-busy="true" aria-label="Carregando filmes" className="moldura pt-4 pb-16">
      <div className="mb-3 h-12 w-72 max-w-full animate-pulse rounded bg-pelicula" />
      <div className="mb-8 h-32 animate-pulse rounded bg-pelicula/60" />
      <ul className="grid grid-cols-2 gap-x-3 gap-y-7 sm:gap-x-4 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
        {Array.from({ length: 20 }, (_, i) => (
          <li key={i}>
            <div className="aspect-video animate-pulse rounded-md bg-pelicula" />
            <div className="mt-2.5 h-4 w-3/4 animate-pulse rounded bg-pelicula" />
            <div className="mt-1 h-3 w-1/4 animate-pulse rounded bg-pelicula" />
          </li>
        ))}
      </ul>
    </div>
  );
}
