export function Trailer({ youtubeId }: { youtubeId: string | null }) {
  if (!youtubeId) return null;
  return (
    <section aria-labelledby="trailer">
      <h2 id="trailer" className="mb-3 text-lg font-semibold">Trailer</h2>
      <div className="aspect-video overflow-hidden rounded-xl bg-black ring-1 ring-white/10">
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
