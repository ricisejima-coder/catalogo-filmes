import { redirect } from "next/navigation";
import { obterUsuarioComSeguranca } from "@/lib/supabase/servidor";
import PaginaEntrar, { metadata } from "./page";

vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));
vi.mock("@/lib/supabase/servidor", () => ({ obterUsuarioComSeguranca: vi.fn(), criarClienteServidor: vi.fn() }));
vi.mock("./acoes", () => ({ entrar: vi.fn(), criarConta: vi.fn() }));

beforeEach(() => vi.clearAllMocks());

it("quem já entrou é redirecionado para voltar", async () => {
  vi.mocked(obterUsuarioComSeguranca).mockResolvedValue({ id: "u1", email: "a@x.com" });
  await expect(PaginaEntrar({ searchParams: Promise.resolve({ voltar: "/filme/550" }) } as never)).rejects.toThrow(
    "NEXT_REDIRECT",
  );
  expect(redirect).toHaveBeenCalledWith("/filme/550");
});

it("com o Supabase fora do ar mostra o formulário", async () => {
  vi.mocked(obterUsuarioComSeguranca).mockResolvedValue("indisponivel");
  expect(await PaginaEntrar({ searchParams: Promise.resolve({}) } as never)).toBeTruthy();
  expect(redirect).not.toHaveBeenCalled();
});

it("quem não entrou vê o formulário", async () => {
  vi.mocked(obterUsuarioComSeguranca).mockResolvedValue(null);
  const el = await PaginaEntrar({ searchParams: Promise.resolve({}) } as never);
  expect(el).toBeTruthy();
  expect(redirect).not.toHaveBeenCalled();
  expect(metadata.title).toBe("Entrar | Catálogo de Streaming");
});
