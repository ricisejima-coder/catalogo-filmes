# Catálogo de Streaming

Catálogo web dos filmes disponíveis **agora** nos streamings por assinatura no Brasil (Netflix, Prime Video, Disney+, Max...), com filtros por streaming e gênero, ordenação, busca por título e página de detalhes com trailer e elenco.

Feito com Next.js, TypeScript e Tailwind CSS, usando a API do [TMDB](https://www.themoviedb.org/).

## Como rodar

1. Instale o [Node.js](https://nodejs.org/) (versão 22 ou mais nova).
2. Crie uma conta grátis no TMDB. Em **Configurações → API**, copie o **API Read Access Token** (o token longo).
3. Na pasta do projeto, copie `.env.example` para `.env.local` e preencha estas três variáveis:

   ```
   TMDB_READ_TOKEN=seu_token_aqui
   NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sua_chave_publica_aqui
   ```

   As duas do Supabase vêm de uma conta grátis: veja o passo a passo em [Contas e listas (Supabase)](#contas-e-listas-supabase).

4. Instale as dependências e inicie:

   ```bash
   npm install
   npm run dev
   ```

5. Abra http://localhost:3000.

## Contas e listas (Supabase)

Quem cria uma conta pode marcar filmes como **Quero ver** e **Já vi**. As listas ficam guardadas no [Supabase](https://supabase.com), um serviço grátis de banco de dados e login. As duas variáveis do Supabase abaixo são obrigatórias para rodar o site: sem elas, o servidor mostra um erro dizendo quais variáveis faltam.

Antes de começar, faça estes 4 passos no Supabase:

1. Crie a conta e o projeto no Supabase, na região South America (São Paulo).
2. Desligue a opção **Confirm email** nas configurações de login por e-mail.
3. Rode o arquivo `supabase/schema.sql` no editor de SQL do Supabase. Ele cria as tabelas e as regras de segurança.
4. Preencha o `.env.local` com a URL e a chave pública do projeto. Você encontra as duas em **Project Settings → API**.

No arquivo `.env.local`, use estas duas variáveis:

```
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sua_chave_publica_aqui
```

Use só a chave **publicável** (pública). Nunca coloque no projeto a chave `service_role` nem a senha do banco.

O arquivo `.env.local` não vai para o git (ele está no `.gitignore`), então não o envie para o GitHub nem mostre essas chaves em público.

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
3. Em **Settings → Environment Variables**, crie estas três variáveis: `TMDB_READ_TOKEN` (o seu token do TMDB), `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (as duas do seu projeto no Supabase). Sem elas o site não funciona.
4. Faça o deploy.

## Atribuições

Este produto usa a API do TMDB, mas não é endossado nem certificado pelo TMDB. Dados de streaming fornecidos por JustWatch.

