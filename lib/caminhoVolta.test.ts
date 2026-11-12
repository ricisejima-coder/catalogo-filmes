import { hrefEntrar, validarVoltar } from "./caminhoVolta";

it.each(["/", "/filme/550", "/?aba=ja-vi&x=1"])("aceita %s", (caminho) => {
  expect(validarVoltar(caminho)).toBe(caminho);
});

it.each([
  "",
  "//mal.com",
  "/\\mal.com",
  "https://mal.com",
  "filme/1",
  "/\t/mal.com",
  "/\n/mal.com",
  "/\t\\mal.com",
  "\t//mal.com",
  undefined,
  42,
])(
  "rejeita %s",
  (caminho) => {
    expect(validarVoltar(caminho)).toBe("/");
  },
);

it("hrefEntrar codifica o caminho", () => {
  expect(hrefEntrar("/?aba=ja-vi")).toBe("/entrar?voltar=%2F%3Faba%3Dja-vi");
});
