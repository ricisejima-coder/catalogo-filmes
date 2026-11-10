import { redirect } from "next/navigation";
import { obterUsuario } from "@/lib/supabase/servidor";
import PaginaEntrar, { metadata } from "./page";

vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));
vi.mock("@/lib/supabase/servidor", () => ({ obterUsuario: vi.fn(), criarClienteServidor: vi.fn() }));
vi.mock("./acoes", () => ({ entrar: vi.fn(), criarConta: vi.fn() }));

beforeEach(() => vi.clearAllMocks());

it("quem já entrou é redirecionado para voltar", async () => {
  vi.mocked(obterUsuario).mockResolvedValue({ id: "u1", email: "a@x.com" });
  await expect(PaginaEntrar({ searchParams: Promise.resolve({ voltar: "/filme/550" }) } as never)).rejects.toThrow(
    "NEXT_REDIRECT",
  );
  expect(redirect).toHaveBeenCalledWith("/filme/550");
});

it("quem não entrou vê o formulário", async () => {
  vi.mocked(obterUsuario).mockResolvedValue(null);
  const el = await PaginaEntrar({ searchParams: Promise.resolve({}) } as never);
  expect(el).toBeTruthy();
  expect(redirect).not.toHaveBeenCalled();
  expect(metadata.title).toBe("Entrar | Catálogo de Streaming");
});
