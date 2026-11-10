import { refresh } from "next/cache";
import { criarClienteServidor, obterUsuario } from "@/lib/supabase/servidor";
import { marcarFilme } from "./acoes";

vi.mock("@/lib/supabase/servidor");
vi.mock("next/cache", () => ({ refresh: vi.fn() }));

function simularBanco(erro: unknown = null) {
  const upsert = vi.fn(async () => ({ error: erro }));
  const eq2 = vi.fn(async () => ({ error: erro }));
  const eq1 = vi.fn(() => ({ eq: eq2 }));
  const del = vi.fn(() => ({ eq: eq1 }));
  const from = vi.fn(() => ({ upsert, delete: del }));
  vi.mocked(criarClienteServidor).mockResolvedValue({ from } as never);
  return { from, upsert, del, eq1, eq2 };
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(obterUsuario).mockResolvedValue({ id: "u1", email: "a@b.c" });
});

it("quero_ver faz upsert com usuario_id, filme_id, lista e criado_em, e chama refresh", async () => {
  const { upsert, from } = simularBanco();
  expect(await marcarFilme(550, "quero_ver")).toBe("ok");
  expect(from).toHaveBeenCalledWith("marcacoes");
  expect(upsert).toHaveBeenCalledWith(
    { usuario_id: "u1", filme_id: 550, lista: "quero_ver", criado_em: expect.any(String) },
    { onConflict: "usuario_id,filme_id" },
  );
  expect(refresh).toHaveBeenCalledTimes(1);
});

it("null apaga a linha daquele usuário e filme", async () => {
  const { eq1, eq2, upsert } = simularBanco();
  expect(await marcarFilme(550, null)).toBe("ok");
  expect(eq1).toHaveBeenCalledWith("usuario_id", "u1");
  expect(eq2).toHaveBeenCalledWith("filme_id", 550);
  expect(upsert).not.toHaveBeenCalled();
  expect(refresh).toHaveBeenCalledTimes(1);
});

it("sem usuário devolve 'sem-login' e não toca no banco", async () => {
  const { from } = simularBanco();
  vi.mocked(obterUsuario).mockResolvedValue(null);
  expect(await marcarFilme(550, "ja_vi")).toBe("sem-login");
  expect(from).not.toHaveBeenCalled();
  expect(refresh).not.toHaveBeenCalled();
});

it("erro do Supabase devolve 'erro' e não chama refresh", async () => {
  simularBanco({ message: "falhou" });
  expect(await marcarFilme(550, "ja_vi")).toBe("erro");
  expect(await marcarFilme(550, null)).toBe("erro");
  expect(refresh).not.toHaveBeenCalled();
});

it.each([
  [-1, "quero_ver"],
  [1.5, "ja_vi"],
  ["550", "ja_vi"],
  [550, "xyz"],
])("entrada inválida (%s, %s) devolve 'erro' sem tocar no banco", async (id, lista) => {
  const { from } = simularBanco();
  expect(await marcarFilme(id as never, lista as never)).toBe("erro");
  expect(obterUsuario).not.toHaveBeenCalled();
  expect(from).not.toHaveBeenCalled();
});
