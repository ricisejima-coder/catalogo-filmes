export function Trailer({ youtubeId }: { youtubeId: string | null }) {
  if (!youtubeId) return null;
  return (
    <section aria-labelledby="trailer" className="mx-auto w-full max-w-5xl">
      <h2 id="trailer" className="mb-4 font-letreiro text-3xl font-extrabold tracking-wide">Trailer</h2>
      <div className="aspect-video overflow-hidden rounded-md bg-pelicula">
        <iframe
          title="Trailer"
          src={`https://www.youtube-nocookie.com/embed/${youtubeId}`}
          allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
          className="h-full w-full"
        />
      </div>
    </section>
  );
}
