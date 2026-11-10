import { criarClienteServidor } from "@/lib/supabase/servidor";
import { redirect } from "next/navigation";
import { criarConta, entrar, sair } from "./acoes";
import { lerCredenciais, traduzirErroAuth } from "./credenciais";

vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));
vi.mock("@/lib/supabase/servidor", () => ({ criarClienteServidor: vi.fn() }));

const auth = {
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
};
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(criarClienteServidor).mockResolvedValue({ auth } as never);
});

function dados(email: string, senha: string, voltar = "/filme/550") {
  const d = new FormData();
  d.set("email", email);
  d.set("senha", senha);
  d.set("voltar", voltar);
  return d;
}

it.each([
  ["invalid_credentials", "E-mail ou senha incorretos"],
  ["user_already_exists", "Este e-mail já tem conta"],
  ["email_exists", "Este e-mail já tem conta"],
  ["weak_password", "A senha precisa ter pelo menos 6 caracteres"],
  [undefined, "Algo deu errado. Tente de novo."],
])("traduzirErroAuth(%s)", (c, m) => expect(traduzirErroAuth(c)).toBe(m));

it("lerCredenciais apara o e-mail e valida o voltar", () => {
  const d = new FormData();
  d.set("email", "  ana@x.com ");
  d.set("senha", " 123456 ");
  d.set("voltar", "//mal.com");
  expect(lerCredenciais(d)).toEqual({ email: "ana@x.com", senha: " 123456 ", voltar: "/" });
});

it("senha com menos de 6 caracteres nem chega ao Supabase", async () => {
  const r = await criarConta({ erro: null }, dados("a@x.com", "123"));
  expect(r).toEqual({ erro: "A senha precisa ter pelo menos 6 caracteres" });
  const r2 = await entrar({ erro: null }, dados("a@x.com", "123"));
  expect(r2).toEqual({ erro: "A senha precisa ter pelo menos 6 caracteres" });
  expect(auth.signUp).not.toHaveBeenCalled();
  expect(auth.signInWithPassword).not.toHaveBeenCalled();
});

it("entrar com sucesso redireciona para voltar", async () => {
  auth.signInWithPassword.mockResolvedValue({ error: null });
  await expect(entrar({ erro: null }, dados("a@x.com", "123456"))).rejects.toThrow("NEXT_REDIRECT");
  expect(auth.signInWithPassword).toHaveBeenCalledWith({ email: "a@x.com", password: "123456" });
  expect(redirect).toHaveBeenCalledWith("/filme/550");
});

it("entrar com erro devolve a mensagem traduzida", async () => {
  auth.signInWithPassword.mockResolvedValue({ error: { code: "invalid_credentials" } });
  expect(await entrar({ erro: null }, dados("a@x.com", "123456"))).toEqual({ erro: "E-mail ou senha incorretos" });
  expect(redirect).not.toHaveBeenCalled();
});

it("criarConta com erro traduz e com sucesso redireciona", async () => {
  auth.signUp.mockResolvedValueOnce({ error: { code: "user_already_exists" } });
  expect(await criarConta({ erro: null }, dados("a@x.com", "123456"))).toEqual({ erro: "Este e-mail já tem conta" });
  auth.signUp.mockResolvedValueOnce({ error: null });
  await expect(criarConta({ erro: null }, dados("a@x.com", "123456"))).rejects.toThrow("NEXT_REDIRECT");
  expect(redirect).toHaveBeenCalledWith("/filme/550");
});

it("sair encerra a sessão e vai para a home", async () => {
  auth.signOut.mockResolvedValue({ error: null });
  await expect(sair()).rejects.toThrow("NEXT_REDIRECT");
  expect(auth.signOut).toHaveBeenCalled();
  expect(redirect).toHaveBeenCalledWith("/");
});
