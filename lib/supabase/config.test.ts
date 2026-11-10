import { lerConfigSupabase } from "./config";

it("devolve url e chave quando as duas existem", () => {
  expect(
    lerConfigSupabase({
      NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_1",
    }),
  ).toEqual({ url: "https://x.supabase.co", chave: "sb_publishable_1" });
});

it("sem variáveis lança erro citando as duas e o .env.local", () => {
  expect(() => lerConfigSupabase({})).toThrow(
    /NEXT_PUBLIC_SUPABASE_URL.*NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.*\.env\.local/,
  );
});

it("valor vazio conta como ausente", () => {
  expect(() =>
    lerConfigSupabase({
      NEXT_PUBLIC_SUPABASE_URL: "",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "k",
    }),
  ).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
});
