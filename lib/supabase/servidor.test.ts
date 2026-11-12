import { AuthApiError, AuthRetryableFetchError } from "@supabase/supabase-js";
import { obterUsuario, obterUsuarioComSeguranca } from "./servidor";

const getUser = vi.fn();
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ cookies: vi.fn(async () => ({ getAll: () => [], set: vi.fn() })) }));
vi.mock("./config", () => ({ lerConfigSupabase: () => ({ url: "https://x.supabase.co", chave: "k" }) }));
vi.mock("@supabase/ssr", () => ({ createServerClient: vi.fn(() => ({ auth: { getUser } })) }));
vi.mock("react", async (original) => ({ ...(await original<typeof import("react")>()), cache: <T,>(f: T) => f }));

beforeEach(() => getUser.mockReset());

it("devolve o usuário quando há sessão", async () => {
  getUser.mockResolvedValue({ data: { user: { id: "u1", email: "a@b.c" } }, error: null });
  expect(await obterUsuario()).toEqual({ id: "u1", email: "a@b.c" });
});

it("devolve null sem sessão ou com token inválido", async () => {
  getUser.mockResolvedValue({ data: { user: null }, error: new AuthApiError("jwt", 401, "bad_jwt") });
  expect(await obterUsuario()).toBeNull();
});

it("lança quando o Supabase está fora do ar (erro de rede)", async () => {
  getUser.mockResolvedValue({ data: { user: null }, error: new AuthRetryableFetchError("rede", 0) });
  await expect(obterUsuario()).rejects.toThrow();
});

it("obterUsuarioComSeguranca devolve 'indisponivel' em vez de lançar", async () => {
  getUser.mockResolvedValue({ data: { user: null }, error: new AuthRetryableFetchError("rede", 0) });
  expect(await obterUsuarioComSeguranca()).toBe("indisponivel");
  getUser.mockResolvedValue({ data: { user: null }, error: null });
  expect(await obterUsuarioComSeguranca()).toBeNull();
});
