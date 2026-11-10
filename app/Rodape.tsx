export function Rodape() {
  return (
    <footer className="mt-auto border-t border-white/10 py-6 text-sm text-apagado">
      <div className="moldura flex flex-col items-center gap-2 text-center sm:flex-row sm:text-left">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/tmdb-logo.svg" alt="TMDB" width={96} height={24} />
        <div>
          <p>Este produto usa a API do TMDB, mas não é endossado nem certificado pelo TMDB.</p>
          <p>Dados de streaming fornecidos por JustWatch.</p>
        </div>
      </div>
    </footer>
  );
}
