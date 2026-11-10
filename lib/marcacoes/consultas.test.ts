import { criarClienteServidor, obterUsuario } from "@/lib/supabase/servidor";
import {
  listarMarcacoes,
  listarMarcacoesComSeguranca,
  paraMapa,
} from "./consultas";

vi.mock("@/lib/supabase/servidor");

function simularBanco(resposta: { data?: unknown; error?: unknown }) {
  const order = vi.fn(async () => resposta);
  const eq = vi.fn(() => ({ order }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));
  vi.mocked(criarClienteServidor).mockResolvedValue({ from } as never);
  return { from, select, eq, order };
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(obterUsuario).mockResolvedValue({ id: "u1", email: "a@b.c" });
});

it("converte linhas do banco em Marcacao, na ordem recebida", async () => {
  const { order, eq } = simularBanco({
    data: [{ filme_id: 550, lista: "ja_vi", criado_em: "2026-11-10T10:00:00Z" }],
    error: null,
  });
  expect(await listarMarcacoes()).toEqual([
    { filmeId: 550, lista: "ja_vi", criadoEm: "2026-11-10T10:00:00Z" },
  ]);
  expect(eq).toHaveBeenCalledWith("usuario_id", "u1");
  expect(order).toHaveBeenCalledWith("criado_em", { ascending: false });
});

it("se obterUsuario lançar (Supabase fora do ar), a versão com segurança devolve null", async () => {
  vi.mocked(obterUsuario).mockRejectedValue(new Error("rede"));
  expect(await listarMarcacoesComSeguranca()).toBeNull();
});

it("sem usuário devolve [] sem consultar a tabela", async () => {
  const { from } = simularBanco({ data: [], error: null });
  vi.mocked(obterUsuario).mockResolvedValue(null);
  expect(await listarMarcacoes()).toEqual([]);
  expect(from).not.toHaveBeenCalled();
});

it("erro do Supabase: listarMarcacoes lança e a versão com segurança devolve null", async () => {
  simularBanco({ data: null, error: { message: "falhou" } });
  await expect(listarMarcacoes()).rejects.toThrow();
  expect(await listarMarcacoesComSeguranca()).toBeNull();
});

it("paraMapa indexa por filmeId", () => {
  expect(paraMapa([{ filmeId: 1, lista: "quero_ver", criadoEm: "" }])).toEqual({
    1: "quero_ver",
  });
});
