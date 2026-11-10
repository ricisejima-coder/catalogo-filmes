# Listas "Quero ver" e "Já vi" com login — Plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** a pessoa cria conta com e-mail e senha, marca filmes como "Quero ver" ou "Já vi" e navega por essas listas em abas na página inicial.

**Architecture:** o servidor do Next conversa com o Supabase via `@supabase/ssr`, com a sessão em cookie renovada pelo `proxy.ts`. As marcações ficam numa tabela com RLS. Os Server Components leem todas as marcações da pessoa de uma vez, e o botão de marcar chama uma Server Action com atualização otimista e `refresh()`. Os dados dos filmes das listas vêm do TMDB (`obterDetalhes`), como já acontece na página de detalhes.

**Tech Stack:** Next.js 16.4.5 (App Router), React 19.3, TypeScript, Tailwind 4, Vitest + Testing Library, `@supabase/supabase-js`, `@supabase/ssr`.

**Spec:** `docs/superpowers/specs/2026-11-10-listas-quero-ver-ja-vi-design.md`

## Global Constraints

- O arquivo que roda antes das páginas é `proxy.ts`, na raiz, com a função exportada `proxy`. `middleware.ts` foi descontinuado no Next 16.
- Variáveis: `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Não usar `service_role` nem a senha do banco.
- Só `lib/supabase/` importa `@supabase/ssr`. O resto do site usa `lib/marcacoes/` e `obterUsuario()`.
- Valores do banco: `lista` é `'quero_ver'` ou `'ja_vi'`. Valores da URL: `aba` é `quero-ver` ou `ja-vi`.
- Todo texto visível fica em pt-BR, com as frases exatas da spec:
  - "E-mail ou senha incorretos"
  - "Este e-mail já tem conta"
  - "A senha precisa ter pelo menos 6 caracteres"
  - "Não deu para salvar, tente de novo"
  - "Nenhum filme aqui ainda. Marque filmes no catálogo."
  - "Entre para montar suas listas"
  - "Não deu para carregar suas listas agora"
  - "Fora do streaming agora"
- Depois de mudar dados numa Server Action, chamar `refresh()` de `next/cache`, conforme `node_modules/next/dist/docs/01-app/01-getting-started/07-mutating-data.md`.
- Os 71 testes existentes continuam passando (`npm test`). `npm run lint` e `npm run build` ficam sem erros.
- **Pré-condição:** a árvore de trabalho deve estar limpa antes da Task 1. Hoje há um trabalho visual não commitado (`Destaque`, `Logotipo` etc.). A pessoa decide se faz commit dele antes de começar.

## Review Focus

1. **Server Action chamada com dados inválidos** (`filmeId` como `-1`, `1.5` ou texto; `lista` como `"xyz"`): ela é um endpoint público, então deve devolver `"erro"` sem tocar no banco. O teste fica na Task 2.
2. **Cliques rápidos seguidos no botão de marcar:** os botões ficam desabilitados enquanto a gravação está em andamento, para que dois pedidos não cheguem fora de ordem. O teste fica na Task 5.
3. **Sessão expirada no meio do uso:** a pessoa vê o botão como "logado", mas a action devolve `"sem-login"`. Ela deve ir para `/entrar?voltar=...`. O teste fica na Task 5.
4. **Clicar no ícone do cartão:** não pode abrir a página do filme. O botão fica fora do `<a>`. O teste fica na Task 6.
5. **E-mail digitado com espaços** (`" ana@x.com "`) e **pessoa já logada abrindo `/entrar`:** o e-mail é aparado antes de ir ao Supabase, e quem já entrou é redirecionado para `voltar`. O teste fica na Task 4.

---

### Task 1: Base do Supabase (dependências, clientes, proxy e SQL)

**Files:**
- Modify: `package.json` (via `npm install @supabase/supabase-js @supabase/ssr`)
- Modify: `.env.example`
- Create: `lib/supabase/config.ts`, `lib/supabase/config.test.ts`
- Create: `lib/supabase/servidor.ts`
- Create: `proxy.ts`
- Create: `supabase/schema.sql`

**Interfaces:**
- Produces:
  - `lerConfigSupabase(env?: Record<string, string | undefined>): { url: string; chave: string }`, que lança um `Error` listando as variáveis ausentes;
  - `criarClienteServidor(): Promise<SupabaseClient>` (de `lib/supabase/servidor.ts`, com `import "server-only"`);
  - `obterUsuario(): Promise<{ id: string; email: string } | null>` (mesmo arquivo).

- [ ] **Step 1: Instalar as dependências**

Run: `npm install @supabase/supabase-js @supabase/ssr`
Expected: as duas aparecem em `dependencies`.

- [ ] **Step 2: Escrever o teste com falha** em `lib/supabase/config.test.ts`

```ts
it("devolve url e chave quando as duas existem", () => {
  expect(lerConfigSupabase({ NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_1" }))
    .toEqual({ url: "https://x.supabase.co", chave: "sb_publishable_1" });
});
it("sem variáveis lança erro citando as duas e o .env.local", () => {
  expect(() => lerConfigSupabase({})).toThrow(/NEXT_PUBLIC_SUPABASE_URL.*NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.*\.env\.local/);
});
it("valor vazio conta como ausente", () => {
  expect(() => lerConfigSupabase({ NEXT_PUBLIC_SUPABASE_URL: "", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "k" })).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
});
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `npx vitest run lib/supabase/config.test.ts`
Expected: FAIL (módulo não existe).

- [ ] **Step 4: Implementar `lerConfigSupabase`** em `lib/supabase/config.ts`

O padrão de `env` é `{ NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY }`. Os nomes ficam escritos por extenso porque o Next só troca `NEXT_PUBLIC_*` por valores quando o acesso é literal. A mensagem de erro é `Defina <nomes ausentes separados por ", "> em .env.local`.

- [ ] **Step 5: Rodar e ver passar**

Run: `npx vitest run lib/supabase/config.test.ts`
Expected: PASS (3 testes).

- [ ] **Step 6: Criar `lib/supabase/servidor.ts`**

- `criarClienteServidor` usa `createServerClient(url, chave, { cookies: { getAll, setAll } })` com `await cookies()` de `next/headers`. O `setAll` fica dentro de `try/catch` vazio, com um comentário explicando o motivo: em Server Components o Next não deixa gravar cookies, e o `proxy.ts` cuida da renovação.
- `obterUsuario` chama `supabase.auth.getUser()` e devolve `null` em erro ou sem usuário. Caso contrário, devolve `{ id, email: user.email ?? "" }`.

- [ ] **Step 7: Criar `proxy.ts`**

- A função `proxy(request: NextRequest)` cria um `createServerClient` cujos `cookies.getAll` leem de `request.cookies` e cujos `setAll` gravam em `request.cookies` e numa `NextResponse.next({ request })` recriada. Depois chama `await supabase.auth.getUser()` e devolve a resposta.
- O `config.matcher` é `["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"]`.
- Antes de escrever, ler `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`.

- [ ] **Step 8: Criar `supabase/schema.sql`**

- `create table public.marcacoes` com as colunas, tipos, padrões, `check` e chave primária `(usuario_id, filme_id)` exatamente como na seção 1 da spec.
- `alter table public.marcacoes enable row level security;`
- Quatro políticas (`select`, `insert`, `update`, `delete`) `to authenticated` com `using` e/ou `with check (usuario_id = (select auth.uid()))`.
- No topo, comentários curtos em pt-BR explicando o que cada bloco faz.

- [ ] **Step 9: Atualizar `.env.example`**

Acrescentar as linhas `NEXT_PUBLIC_SUPABASE_URL=` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=`.

- [ ] **Step 10: Verificar**

Run: `npm test; npm run lint`
Expected: todos os testes passam e o lint fica sem erros.

- [ ] **Step 11: Commit**

```bash
git add package.json package-lock.json .env.example lib/supabase proxy.ts supabase/schema.sql
git commit -m "feat: base do Supabase (clientes, proxy e schema com RLS)"
```

- [ ] **Step 12 (pessoa, guiada pelo agente; precisa estar pronto antes da Task 8): configurar o painel do Supabase**

1. No projeto criado em São Paulo, abrir **SQL Editor**, colar `supabase/schema.sql` e rodar.
2. Em Authentication → Providers → Email, desligar **Confirm email**.
3. Em Project Settings → API Keys, copiar a URL e a chave publishable para o `.env.local`.

O agente não pede, não lê e não exibe o valor das chaves.

---

### Task 2: Módulo de marcações (leitura e Server Action)

**Files:**
- Create: `lib/marcacoes/tipos.ts`
- Create: `lib/marcacoes/consultas.ts`, `lib/marcacoes/consultas.test.ts`
- Create: `lib/marcacoes/acoes.ts`, `lib/marcacoes/acoes.test.ts`

**Interfaces:**
- Consumes: `criarClienteServidor`, `obterUsuario` (Task 1).
- Produces:
  - `type Lista = "quero_ver" | "ja_vi"`;
  - `const LISTAS: readonly Lista[]`;
  - `type Marcacao = { filmeId: number; lista: Lista; criadoEm: string }`;
  - `type MapaMarcacoes = Record<number, Lista>`;
  - `type ResultadoMarcacao = "ok" | "sem-login" | "erro"`;
  - `listarMarcacoes(): Promise<Marcacao[]>`: ordenadas por `criado_em` desc, `[]` sem usuário, lança erro se o Supabase falhar;
  - `paraMapa(marcacoes: Marcacao[]): MapaMarcacoes`;
  - `listarMarcacoesComSeguranca(): Promise<Marcacao[] | null>`: `null` quando `listarMarcacoes` lança erro;
  - `marcarFilme(filmeId: number, lista: Lista | null): Promise<ResultadoMarcacao>` em `acoes.ts`, com `"use server"`.

Nos testes, `vi.mock("@/lib/supabase/servidor")` devolve um cliente falso com `from().select().order()`, `from().upsert()` e `from().delete().eq().eq()`. Também há `vi.mock("next/cache", () => ({ refresh: vi.fn() }))`.

- [ ] **Step 1: Escrever os testes com falha** em `consultas.test.ts`

```ts
it("converte linhas do banco em Marcacao, na ordem recebida", async () => {
  // banco devolve [{ filme_id: 550, lista: "ja_vi", criado_em: "2026-11-10T10:00:00Z" }]
  expect(await listarMarcacoes()).toEqual([{ filmeId: 550, lista: "ja_vi", criadoEm: "2026-11-10T10:00:00Z" }]);
  // e pediu .order("criado_em", { ascending: false })
});
it("sem usuário devolve [] sem consultar a tabela", async () => { /* obterUsuario → null; from não chamado */ });
it("erro do Supabase: listarMarcacoes lança e a versão com segurança devolve null", async () => { /* { error: {...} } */ });
it("paraMapa indexa por filmeId", () => {
  expect(paraMapa([{ filmeId: 1, lista: "quero_ver", criadoEm: "" }])).toEqual({ 1: "quero_ver" });
});
```

- [ ] **Step 2: Escrever os testes com falha** em `acoes.test.ts`

```ts
it("quero_ver faz upsert com usuario_id, filme_id, lista e criado_em, e chama refresh", async () => {
  expect(await marcarFilme(550, "quero_ver")).toBe("ok");
  // upsert({ usuario_id: "u1", filme_id: 550, lista: "quero_ver", criado_em: expect.any(String) }, { onConflict: "usuario_id,filme_id" })
  // refresh chamado uma vez
});
it("null apaga a linha daquele usuário e filme", async () => { /* delete().eq("usuario_id","u1").eq("filme_id",550) */ });
it("sem usuário devolve 'sem-login' e não toca no banco", async () => {});
it("erro do Supabase devolve 'erro' e não chama refresh", async () => {});
it.each([[-1, "quero_ver"], [1.5, "ja_vi"], ["550", "ja_vi"], [550, "xyz"]])(
  "entrada inválida (%s, %s) devolve 'erro' sem tocar no banco", async (id, lista) => {
    expect(await marcarFilme(id as never, lista as never)).toBe("erro");
  });
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `npx vitest run lib/marcacoes`
Expected: FAIL (módulos não existem).

- [ ] **Step 4: Implementar** `tipos.ts`, `consultas.ts` (com `import "server-only"`) e `acoes.ts`

Em `acoes.ts`, validar a entrada com `Number.isInteger(filmeId) && filmeId > 0` e `lista === null || LISTAS.includes(lista)` **antes** de qualquer chamada. Chamar `refresh()` só quando o resultado é `"ok"`.

- [ ] **Step 5: Rodar e ver passar**

Run: `npx vitest run lib/marcacoes`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/marcacoes
git commit -m "feat: leitura e gravação das marcações no Supabase"
```

---

### Task 3: Funções puras de URL (abas e caminho de volta)

**Files:**
- Create: `lib/abas.ts`, `lib/abas.test.ts`
- Create: `lib/caminhoVolta.ts`, `lib/caminhoVolta.test.ts`

**Interfaces:**
- Consumes: `Lista` (Task 2), `ParametrosUrl` (`lib/filtros.ts`).
- Produces:
  - `type Aba = "streaming" | Lista`;
  - `lerAba(params: ParametrosUrl): Aba`;
  - `hrefAba(aba: Aba): string`, que devolve `"/"`, `"/?aba=quero-ver"` ou `"/?aba=ja-vi"`;
  - `validarVoltar(valor: unknown): string`, que devolve o caminho se for interno ou `"/"`;
  - `hrefEntrar(voltar: string): string`, que devolve `"/entrar?voltar=" + encodeURIComponent(voltar)`.

- [ ] **Step 1: Escrever os testes com falha**

```ts
// abas.test.ts
it.each([[{}, "streaming"], [{ aba: "quero-ver" }, "quero_ver"], [{ aba: "ja-vi" }, "ja_vi"],
         [{ aba: "xyz" }, "streaming"], [{ aba: ["ja-vi", "quero-ver"] }, "ja_vi"]])("lerAba(%o) = %s", (p, a) =>
  expect(lerAba(p)).toBe(a));
it("hrefAba ida e volta", () => { for (const a of ["streaming", "quero_ver", "ja_vi"] as const)
  expect(lerAba(Object.fromEntries(new URLSearchParams(hrefAba(a).split("?")[1] ?? "")))).toBe(a); });

// caminhoVolta.test.ts
it.each(["/", "/filme/550", "/?aba=ja-vi&x=1"])("aceita %s", (c) => expect(validarVoltar(c)).toBe(c));
it.each(["", "//mal.com", "/\\mal.com", "https://mal.com", "filme/1", undefined, 42])("rejeita %s", (c) =>
  expect(validarVoltar(c)).toBe("/"));
it("hrefEntrar codifica o caminho", () =>
  expect(hrefEntrar("/?aba=ja-vi")).toBe("/entrar?voltar=%2F%3Faba%3Dja-vi"));
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run lib/abas.test.ts lib/caminhoVolta.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar**

`validarVoltar` aceita só strings que começam com `/` e cujo segundo caractere não é `/` nem `\`.

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run lib/abas.test.ts lib/caminhoVolta.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/abas.ts lib/abas.test.ts lib/caminhoVolta.ts lib/caminhoVolta.test.ts
git commit -m "feat: leitura da aba e validação do caminho de volta"
```

---

### Task 4: Página `/entrar` e menu da conta

**Files:**
- Create: `app/entrar/acoes.ts`, `app/entrar/acoes.test.ts`
- Create: `app/entrar/FormularioEntrada.tsx`, `app/entrar/FormularioEntrada.test.tsx`
- Create: `app/entrar/page.tsx`
- Create: `components/MenuConta.tsx`, `components/MenuConta.test.tsx`
- Modify: `app/layout.tsx:21-25` (o header ganha `MenuConta` à direita do `Logotipo`)

**Interfaces:**
- Consumes: `criarClienteServidor`, `obterUsuario` (Task 1), `validarVoltar` (Task 3).
- Produces:
  - `type EstadoEntrada = { erro: string | null }`;
  - `traduzirErroAuth(codigo: string | undefined): string`;
  - `lerCredenciais(dados: FormData): { email: string; senha: string; voltar: string }`;
  - Server Actions `entrar(estado: EstadoEntrada, dados: FormData): Promise<EstadoEntrada>`, `criarConta(...)` (mesma assinatura) e `sair(): Promise<void>`;
  - `FormularioEntrada({ voltar, acaoEntrar, acaoCriarConta }: { voltar: string; acaoEntrar: AcaoEntrada; acaoCriarConta: AcaoEntrada })`, em que `AcaoEntrada = (e: EstadoEntrada, d: FormData) => Promise<EstadoEntrada>`;
  - `MenuConta({ usuario, acaoSair }: { usuario: { email: string } | null; acaoSair: () => Promise<void> })`.

- [ ] **Step 1: Escrever os testes com falha** em `acoes.test.ts`

```ts
it.each([["invalid_credentials", "E-mail ou senha incorretos"], ["user_already_exists", "Este e-mail já tem conta"],
         ["email_exists", "Este e-mail já tem conta"], ["weak_password", "A senha precisa ter pelo menos 6 caracteres"],
         [undefined, "Algo deu errado. Tente de novo."]])("traduzirErroAuth(%s)", (c, m) => expect(traduzirErroAuth(c)).toBe(m));
it("lerCredenciais apara o e-mail e valida o voltar", () => {
  const d = new FormData(); d.set("email", "  ana@x.com "); d.set("senha", " 123456 "); d.set("voltar", "//mal.com");
  expect(lerCredenciais(d)).toEqual({ email: "ana@x.com", senha: " 123456 ", voltar: "/" });
});
it("senha com menos de 6 caracteres nem chega ao Supabase", async () => { /* criarConta → { erro: "A senha precisa..." } */ });
it("entrar com sucesso redireciona para voltar", async () => { /* signInWithPassword ok → redirect("/filme/550") */ });
it("entrar com erro devolve a mensagem traduzida", async () => { /* error.code "invalid_credentials" */ });
// app/entrar/page.test.tsx — chamar o componente async diretamente
it("quem já entrou é redirecionado para voltar", async () => {
  // obterUsuario → { id: "u1", email: "a@x.com" }
  await expect(PaginaEntrar({ searchParams: Promise.resolve({ voltar: "/filme/550" }) } as never)).rejects.toThrow("NEXT_REDIRECT");
  // redirect chamado com "/filme/550"
});
```

Mockar `next/navigation` com `redirect: vi.fn(() => { throw new Error("NEXT_REDIRECT") })`.

- [ ] **Step 2: Escrever os testes com falha** em `FormularioEntrada.test.tsx` e `MenuConta.test.tsx`

```ts
it("começa em Entrar e alterna para Criar conta", async () => { /* tabs com role="tab", aria-selected; botão de envio muda de texto */ });
it("envia e-mail, senha e o voltar escondido para a ação da aba ativa", async () => { /* acaoCriarConta recebe FormData com voltar */ });
it("mostra o erro devolvido pela ação", async () => { /* acao resolve { erro: "E-mail ou senha incorretos" } → role="alert" */ });
// MenuConta
it("sem usuário mostra o link Entrar para /entrar", () => {});
it("com usuário mostra o e-mail e o botão Sair", () => {});
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `npx vitest run app/entrar components/MenuConta.test.tsx`
Expected: FAIL.

- [ ] **Step 4: Implementar**

- **`acoes.ts`** (`"use server"`):
  - `entrar` usa `signInWithPassword` e `criarConta` usa `signUp`. As duas validam `senha.length < 6` antes de chamar o Supabase e chamam `redirect(voltar)` em caso de sucesso.
  - `sair` usa `signOut` e depois `redirect("/")`.
  - O mapa de `traduzirErroAuth` tem exatamente os códigos do teste. Qualquer outro código devolve "Algo deu errado. Tente de novo."
- **`FormularioEntrada`** (`"use client"`): usa `useActionState` com a ação da aba ativa, inputs `type="email"` e `type="password"` com `<label>` e `autoComplete` (`current-password` ou `new-password`), e um `<input type="hidden" name="voltar">`.
- **`page.tsx`**:
  - lê `voltar` com `validarVoltar` a partir de `searchParams`;
  - se `obterUsuario()` devolver alguém, chama `redirect(voltar)`;
  - senão, renderiza o título "Sua conta" e `<FormularioEntrada acaoEntrar={entrar} acaoCriarConta={criarConta} />`;
  - exporta `metadata` com o título `Entrar | Catálogo de Streaming`.
- **`MenuConta`**: um `<form action={acaoSair}>` com botão "Sair". No layout, ele é renderizado como `<MenuConta usuario={await obterUsuario()} acaoSair={sair} />`. O `RootLayout` passa a ser `async`, e o header usa `flex items-center justify-between`.

- [ ] **Step 5: Rodar e ver passar**

Run: `npx vitest run app/entrar components/MenuConta.test.tsx; npm test`
Expected: PASS, incluindo os testes antigos.

- [ ] **Step 6: Commit**

```bash
git add app/entrar components/MenuConta.tsx components/MenuConta.test.tsx app/layout.tsx
git commit -m "feat: página de entrada com login, cadastro e saída"
```

---

### Task 5: Componente `BotaoMarcar`

**Files:**
- Create: `components/BotaoMarcar.tsx`, `components/BotaoMarcar.test.tsx`

**Interfaces:**
- Consumes: `Lista`, `ResultadoMarcacao`, `marcarFilme` (Task 2), `hrefEntrar` (Task 3).
- Produces: `BotaoMarcar(props: { filmeId: number; titulo: string; marcacao: Lista | null; logado: boolean; variante: "compacta" | "completa" })`.

Nos testes, `vi.mock("@/lib/marcacoes/acoes")` e `vi.mock("next/navigation")` devolvem `usePathname → "/filme/550"`, `useSearchParams → new URLSearchParams()` e `useRouter → { push }`.

- [ ] **Step 1: Escrever os testes com falha**

```ts
it("mostra os dois botões com aria-pressed e rótulo com o título", () => {
  // marcacao "quero_ver": "Marcar Duna como quero ver" aria-pressed=true; "Marcar Duna como já vi" aria-pressed=false
});
it("clicar no inativo chama marcarFilme(id, lista) e acende na hora", async () => { /* promessa pendente; aria-pressed já true */ });
it("clicar no ativo chama marcarFilme(id, null)", async () => {});
it("enquanto grava, os botões ficam desabilitados", async () => {});
it("se a ação devolver 'erro', volta ao estado anterior e mostra a mensagem", async () => {
  // findByRole("alert") com "Não deu para salvar, tente de novo"; aria-pressed voltou
});
it("sem login, o clique leva a /entrar?voltar=<página atual> sem chamar a ação", async () => {
  // push("/entrar?voltar=%2Ffilme%2F550")
});
it("se a ação devolver 'sem-login' (sessão expirada), também leva a /entrar", async () => {});
it("variante completa mostra os textos 'Quero ver' e 'Já vi'", () => {});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run components/BotaoMarcar.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implementar** (`"use client"`)

- Usar `useOptimistic(marcacao)` dentro de `useTransition`. O valor real continua sendo a prop `marcacao`, que é atualizada pelo `refresh()` da action, então não há `useState` para o valor. Com erro, o valor otimista volta sozinho ao fim da transição.
- Guardar só a flag de erro em `useState`.
- O caminho atual é `pathname + (search ? "?" + search : "")`.
- Ícones em SVG inline: um marcador para "Quero ver" e um "✓" para "Já vi".
  - **Compacta:** ícones de 28px em fundo escuro translúcido. Os ativos ficam com `text-luz`.
  - **Completa:** botões com borda e texto, no estilo do "Carregar mais".
- Todo `<button>` tem `type="button"`.

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run components/BotaoMarcar.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/BotaoMarcar.tsx components/BotaoMarcar.test.tsx
git commit -m "feat: botão de marcar Quero ver / Já vi com atualização otimista"
```

---

### Task 6: Marcações na grade (cartão, grade e "Carregar mais")

**Files:**
- Modify: `components/CardFilme.tsx`, `components/CardFilme.test.tsx`
- Modify: `components/GradeFilmes.tsx`
- Modify: `components/BotaoCarregarMais.tsx`, `components/BotaoCarregarMais.test.tsx`

**Interfaces:**
- Consumes: `BotaoMarcar` (Task 5), `MapaMarcacoes`, `Lista` (Task 2).
- Produces:
  - `CardFilme({ filme, marcacao, logado, foraDoStreaming }: { filme: FilmeResumo; marcacao?: Lista | null; logado?: boolean; foraDoStreaming?: boolean })`;
  - `GradeFilmes({ filmes, marcacoes, logado }: { filmes: FilmeResumo[]; marcacoes?: MapaMarcacoes; logado?: boolean })`;
  - `BotaoCarregarMais` ganha as props opcionais `marcacoes?: MapaMarcacoes` e `logado?: boolean`, repassadas à grade.

Os padrões são `marcacoes = {}`, `logado = false` e `foraDoStreaming = false`, para que os testes e usos antigos continuem valendo.

- [ ] **Step 1: Escrever os testes com falha** (acrescentar a `CardFilme.test.tsx` e `BotaoCarregarMais.test.tsx`, com `vi.mock` de `next/navigation` e `@/lib/marcacoes/acoes`)

```ts
it("o botão de marcar fica fora do link do filme", () => {
  render(<CardFilme filme={filme} marcacao="ja_vi" logado />);
  const botao = screen.getByRole("button", { name: "Marcar Duna como já vi" });
  expect(botao).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByRole("link")).not.toContainElement(botao);
});
it("foraDoStreaming mostra o selo", () => {
  render(<CardFilme filme={filme} foraDoStreaming />);
  expect(screen.getByText("Fora do streaming agora")).toBeInTheDocument();
});
// BotaoCarregarMais
it("filmes carregados depois usam as marcações recebidas", async () => {
  // marcacoes={{ 42: "quero_ver" }} logado → depois de carregar, "Marcar Filme X como quero ver" aria-pressed=true
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run components/CardFilme.test.tsx components/BotaoCarregarMais.test.tsx`
Expected: FAIL nos testes novos.

- [ ] **Step 3: Implementar**

- O `CardFilme` passa a ter um `<div className="relative">` por fora. O `<Link>` continua igual, e `<BotaoMarcar variante="compacta">` fica como irmão do link, em `absolute top-2 right-2 z-10`.
- O selo "Fora do streaming agora" fica no canto inferior esquerdo da imagem, dentro do link.

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test`
Expected: PASS, todos.

- [ ] **Step 5: Commit**

```bash
git add components/CardFilme.tsx components/CardFilme.test.tsx components/GradeFilmes.tsx components/BotaoCarregarMais.tsx components/BotaoCarregarMais.test.tsx
git commit -m "feat: marcações nos cartões da grade"
```

---

### Task 7: Abas e listas na página inicial

**Files:**
- Create: `lib/filmesMarcados.ts`, `lib/filmesMarcados.test.ts`
- Create: `components/AbasCatalogo.tsx`, `components/AbasCatalogo.test.tsx`
- Create: `components/ListaMarcados.tsx`, `components/ListaMarcados.test.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes:
  - `obterDetalhes` (`lib/tmdb/detalhes.ts`);
  - `listarMarcacoesComSeguranca`, `paraMapa`, `Marcacao`, `Lista`, `MapaMarcacoes` (Task 2);
  - `lerAba`, `hrefAba`, `Aba`, `hrefEntrar` (Task 3);
  - `obterUsuario` (Task 1);
  - `CardFilme`, `GradeFilmes`, `BotaoCarregarMais` (Task 6).
- Produces:
  - `type FilmeMarcado = FilmeResumo & { foraDoStreaming: boolean }`;
  - `carregarFilmesMarcados(marcacoes: Marcacao[], lista: Lista): Promise<FilmeMarcado[]>`;
  - `AbasCatalogo({ ativa }: { ativa: Aba })`;
  - `ListaMarcados({ filmes, lista, logado }: { filmes: FilmeMarcado[]; lista: Lista; logado: boolean })`.

- [ ] **Step 1: Escrever os testes com falha**

```ts
// filmesMarcados.test.ts (vi.mock("@/lib/tmdb/detalhes"))
it("filtra pela lista, mantém a ordem recebida e marca foraDoStreaming quando ondeAssistir está vazio", async () => {});
it("filme que o TMDB não acha (ou que falha) fica de fora sem derrubar o resto", async () => {
  // obterDetalhes rejeita com ErroNaoEncontrado para um id → resultado só com os outros
});
it("converte FilmeDetalhe em FilmeResumo: id, titulo, ano, nota, posterUrl, fundoUrl, generoIds []", async () => {});

// AbasCatalogo.test.tsx
it("mostra três links com hrefAba e aria-current='page' na ativa", () => {
  // "Em streaming" → "/", "Quero ver" → "/?aba=quero-ver", "Já vi" → "/?aba=ja-vi"
});

// ListaMarcados.test.tsx
it("lista vazia mostra 'Nenhum filme aqui ainda. Marque filmes no catálogo.'", () => {});
it("cada cartão vem com a marcação da lista e o selo quando fora do streaming", () => {});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run lib/filmesMarcados.test.ts components/AbasCatalogo.test.tsx components/ListaMarcados.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implementar** `filmesMarcados.ts`, `AbasCatalogo` e `ListaMarcados`

- **`carregarFilmesMarcados`** (`import "server-only"`): usa `Promise.allSettled` sobre `obterDetalhes` dos filmes filtrados e descarta os rejeitados.
- **`ListaMarcados`**: renderiza um `<ul>` com o mesmo grid de `GradeFilmes` e `<CardFilme marcacao={lista} foraDoStreaming={f.foraDoStreaming} logado={logado} />`.
- **`AbasCatalogo`**: `<nav aria-label="Listas">` com `<Link>` estilizados como abas.

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run lib/filmesMarcados.test.ts components/AbasCatalogo.test.tsx components/ListaMarcados.test.tsx`
Expected: PASS.

- [ ] **Step 5: Integrar em `app/page.tsx`**

- `aba = lerAba(params)`. Em paralelo, buscar `obterUsuario()` e `listarMarcacoesComSeguranca()`.
- `marcacoes = paraMapa(lista ?? [])` e `logado = usuario !== null`.
- **`aba === "streaming"`:** o fluxo atual não muda. `AbasCatalogo` entra logo abaixo do `Destaque`, acima do `<h1>`. `GradeFilmes` e `BotaoCarregarMais` recebem `marcacoes` e `logado`. Os filtros e o catálogo só são buscados nessa aba.
- **Aba de lista:**
  - sem destaque;
  - `<h1>` com "Quero ver" ou "Já vi";
  - sem login: texto "Entre para montar suas listas" + link "Entrar" para `hrefEntrar(hrefAba(aba))`;
  - marcações `null`: texto "Não deu para carregar suas listas agora";
  - nos outros casos: `<ListaMarcados filmes={await carregarFilmesMarcados(lista, aba)} lista={aba} logado />`.

- [ ] **Step 6: Verificar**

Run: `npm test; npm run lint; npm run build`
Expected: tudo passa e o build termina sem erros.

- [ ] **Step 7: Commit**

```bash
git add lib/filmesMarcados.ts lib/filmesMarcados.test.ts components/AbasCatalogo.tsx components/AbasCatalogo.test.tsx components/ListaMarcados.tsx components/ListaMarcados.test.tsx app/page.tsx
git commit -m "feat: abas Quero ver e Já vi na página inicial"
```

---

### Task 8: Botões na página de detalhes, README e teste manual

**Files:**
- Modify: `app/filme/[id]/page.tsx:52-69`
- Modify: `README.md`

**Interfaces:**
- Consumes: `BotaoMarcar` (Task 5), `listarMarcacoesComSeguranca`, `paraMapa` (Task 2), `obterUsuario` (Task 1).

- [ ] **Step 1: Integrar na página do filme**

- Em `PaginaFilme`, buscar `obterUsuario()` e `listarMarcacoesComSeguranca()` em paralelo com `carregar`.
- Renderizar `<BotaoMarcar variante="completa" filmeId={filme.id} titulo={filme.titulo} marcacao={paraMapa(m ?? [])[filme.id] ?? null} logado={usuario !== null} />` logo abaixo da linha de nota e informações, antes da sinopse.

- [ ] **Step 2: Atualizar o README**

Acrescentar a seção "Contas e listas (Supabase)" com os 4 pré-requisitos da spec e as duas variáveis novas.

- [ ] **Step 3: Verificar**

Run: `npm test; npm run lint; npm run build`
Expected: tudo passa.

- [ ] **Step 4: Commit**

```bash
git add "app/filme/[id]/page.tsx" README.md
git commit -m "feat: marcar filme na página de detalhes e instruções do Supabase"
```

- [ ] **Step 5: Teste manual com o Supabase real** (requer a Task 1, Step 12)

Run: `npm run dev`. Depois, com a pessoa:

1. Abrir `/` sem login e clicar no ícone de um cartão: vai para `/entrar?voltar=%2F`.
2. Criar conta: volta para `/` e o topo mostra o e-mail.
3. Marcar "Quero ver" num cartão e "Já vi" na página de detalhes. Trocar um filme de lista e desmarcar outro.
4. Conferir as abas "Quero ver" e "Já vi", com a ordem do mais recente para o mais antigo.
5. Clicar em "Carregar mais" e conferir que os cartões novos aparecem com as marcações certas.
6. Sair, entrar de novo e conferir que as marcações continuam lá.
7. Criar uma segunda conta e conferir que as listas estão vazias.

Expected: todos os passos se comportam como descrito. Qualquer desvio volta como bug para a task que é dona do código.
