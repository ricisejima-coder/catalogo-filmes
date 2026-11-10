import Link from "next/link";

// Marca do site: símbolo (a luz âmbar do projetor com um "play") + nome em dois níveis.
export function Logotipo() {
  return (
    <Link
      href="/"
      aria-label="Catálogo de Streaming — página inicial"
      className="group inline-flex items-center gap-3 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-luz"
    >
      <svg
        aria-hidden
        viewBox="0 0 40 40"
        className="size-10 shrink-0 drop-shadow-[0_0_18px_rgba(245,184,61,0.35)] transition-transform duration-300 group-hover:scale-105"
      >
        <rect width="40" height="40" rx="10" className="fill-luz" />
        {/* Furos de película nas bordas de cima e de baixo. */}
        <g className="fill-tela/35">
          <rect x="8" y="4" width="4" height="3" rx="1" />
          <rect x="18" y="4" width="4" height="3" rx="1" />
          <rect x="28" y="4" width="4" height="3" rx="1" />
          <rect x="8" y="33" width="4" height="3" rx="1" />
          <rect x="18" y="33" width="4" height="3" rx="1" />
          <rect x="28" y="33" width="4" height="3" rx="1" />
        </g>
        <path d="M16 13.5v13a1 1 0 0 0 1.5.86l10.6-6.5a1 1 0 0 0 0-1.72L17.5 12.64A1 1 0 0 0 16 13.5Z" className="fill-tela" />
      </svg>
      <span className="flex flex-col leading-none">
        <span className="font-letreiro text-[1.7rem] font-black tracking-wide text-texto uppercase">Catálogo</span>
        <span className="mt-1 text-[0.62rem] font-semibold tracking-[0.38em] text-luz uppercase">de streaming</span>
      </span>
    </Link>
  );
}
