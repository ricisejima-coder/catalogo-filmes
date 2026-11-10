import type { Metadata } from "next";
import { Big_Shoulders, Geist } from "next/font/google";
import { Logotipo } from "@/components/Logotipo";
import { Rodape } from "./Rodape";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
// Letra alta e estreita, de letreiro de cinema, para títulos.
const bigShoulders = Big_Shoulders({ variable: "--font-big-shoulders", subsets: ["latin"], axes: ["opsz"] });

export const metadata: Metadata = {
  title: "Catálogo de Streaming",
  description: "Filmes disponíveis agora nos streamings por assinatura no Brasil.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${bigShoulders.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-tela text-texto">
        {/* Fica por cima do destaque, sem fundo próprio. */}
        <header className="absolute inset-x-0 top-0 z-20">
          <div className="moldura py-5">
            <Logotipo />
          </div>
        </header>
        <main className="flex-1 pt-20">{children}</main>
        <Rodape />
      </body>
    </html>
  );
}
