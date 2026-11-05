# Catálogo de Streaming

Catálogo web dos filmes disponíveis **agora** nos streamings por assinatura no Brasil (Netflix, Prime Video, Disney+, Max...), com filtros por streaming e gênero, ordenação, busca por título e página de detalhes com trailer e elenco.

Feito com Next.js, TypeScript e Tailwind CSS, usando a API do [TMDB](https://www.themoviedb.org/).

## Como rodar

1. Instale o [Node.js](https://nodejs.org/) (versão 20 ou mais nova).
2. Crie uma conta grátis no TMDB. Em **Configurações → API**, copie o **API Read Access Token** (o token longo).
3. Na pasta do projeto, copie `.env.example` para `.env.local` e cole o token:

   ```
   TMDB_READ_TOKEN=seu_token_aqui
   ```

4. Instale as dependências e inicie:

   ```bash
   npm install
   npm run dev
   ```

5. Abra http://localhost:3000.

## Comandos

| Comando | O que faz |
|---|---|
| `npm run dev` | Inicia o site em modo de desenvolvimento |
| `npm test` | Roda os testes automáticos |
| `npm run lint` | Verifica o estilo do código |
| `npm run build` | Gera a versão de produção |

## Como o código está organizado

- `app/` — páginas: catálogo (`page.tsx`), detalhes (`filme/[id]`) e a rota `api/filmes` usada pelo botão "Carregar mais".
- `components/` — peças da interface (card, grade, filtros, trailer...).
- `lib/filtros.ts` — lê e escreve os filtros na URL.
- `lib/tmdb/` — única parte que fala com o TMDB. Roda só no servidor, então o token nunca chega ao navegador.
- `docs/superpowers/` — especificação e plano de implementação.

## Publicar na Vercel

1. Suba o repositório para o GitHub.
2. Em [vercel.com](https://vercel.com), importe o repositório.
3. Em **Settings → Environment Variables**, crie `TMDB_READ_TOKEN` com o seu token.
4. Faça o deploy.

## Atribuições

Este produto usa a API do TMDB, mas não é endossado nem certificado pelo TMDB. Dados de streaming fornecidos por JustWatch.

> **Antes de publicar:** troque `public/tmdb-logo.svg` pelo logo oficial, que fica em https://www.themoviedb.org/about/logos-attribution.
