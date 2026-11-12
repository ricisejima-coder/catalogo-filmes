-- Listas "Quero ver" / "Já vi". Cole este arquivo no SQL Editor do Supabase e rode.
-- Pode rodar de novo sem problema: ele não apaga dados.

-- Tabela: uma linha por filme marcado por cada pessoa.
-- A chave primária (usuario_id, filme_id) garante que um filme fique em uma lista só.
create table if not exists public.marcacoes (
  usuario_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  filme_id integer not null,
  lista text not null check (lista in ('quero_ver', 'ja_vi')),
  criado_em timestamptz not null default now(),
  primary key (usuario_id, filme_id)
);

-- Permissão de uso da tabela para quem está logado.
grant select, insert, update, delete on public.marcacoes to authenticated;

-- Segurança por linha: cada pessoa só enxerga e mexe nas próprias marcações.
alter table public.marcacoes enable row level security;

-- Ler as próprias marcações.
drop policy if exists "marcacoes_select" on public.marcacoes;
create policy "marcacoes_select" on public.marcacoes
  for select to authenticated
  using (usuario_id = (select auth.uid()));

-- Criar marcações apenas em nome de si mesma.
drop policy if exists "marcacoes_insert" on public.marcacoes;
create policy "marcacoes_insert" on public.marcacoes
  for insert to authenticated
  with check (usuario_id = (select auth.uid()));

-- Trocar de lista (upsert) apenas nas próprias marcações.
drop policy if exists "marcacoes_update" on public.marcacoes;
create policy "marcacoes_update" on public.marcacoes
  for update to authenticated
  using (usuario_id = (select auth.uid()))
  with check (usuario_id = (select auth.uid()));

-- Desmarcar apenas as próprias marcações.
drop policy if exists "marcacoes_delete" on public.marcacoes;
create policy "marcacoes_delete" on public.marcacoes
  for delete to authenticated
  using (usuario_id = (select auth.uid()));
