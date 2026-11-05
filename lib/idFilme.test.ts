import { lerIdFilme } from "./idFilme";

it("lerIdFilme aceita só números positivos", () => {
  expect(lerIdFilme("550")).toBe(550);
  expect(lerIdFilme("abc")).toBeNull();
  expect(lerIdFilme("0")).toBeNull();
  expect(lerIdFilme("12abc")).toBeNull();
  expect(lerIdFilme("-5")).toBeNull();
  expect(lerIdFilme("")).toBeNull();
});
