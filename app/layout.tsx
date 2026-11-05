import type { Metadata } from "next";
import Link from "next/link";
import { Geist } from "next/font/google";
import { Rodape } from "./Rodape";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Catálogo de Streaming",
  description: "Filmes disponíveis agora nos streamings por assinatura no Brasil.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-zinc-950 text-zinc-100">
        <header className="border-b border-zinc-800 px-4 py-4">
          <div className="mx-auto max-w-7xl">
            <Link href="/" className="text-xl font-bold tracking-tight">
              Catálogo de Streaming
            </Link>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">{children}</main>
        <Rodape />
      </body>
    </html>
  );
}
