import { hrefAba, lerAba } from "./abas";

it.each([
  [{}, "streaming"],
  [{ aba: "quero-ver" }, "quero_ver"],
  [{ aba: "ja-vi" }, "ja_vi"],
  [{ aba: "xyz" }, "streaming"],
  [{ aba: ["ja-vi", "quero-ver"] }, "ja_vi"],
  [{ aba: "constructor" }, "streaming"],
  [{ aba: "toString" }, "streaming"],
])("lerAba(%o) = %s", (params, aba) => {
  expect(lerAba(params)).toBe(aba);
});

it("hrefAba ida e volta", () => {
  for (const aba of ["streaming", "quero_ver", "ja_vi"] as const) {
    const query = hrefAba(aba).split("?")[1] ?? "";
    expect(lerAba(Object.fromEntries(new URLSearchParams(query)))).toBe(aba);
  }
});

it("hrefAba devolve o caminho de cada aba", () => {
  expect(hrefAba("streaming")).toBe("/");
  expect(hrefAba("quero_ver")).toBe("/?aba=quero-ver");
  expect(hrefAba("ja_vi")).toBe("/?aba=ja-vi");
});
