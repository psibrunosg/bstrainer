import { describe, expect, it } from "vitest";
import { resolveTheme } from "./use-theme";

describe("resolveTheme", () => {
  it("usa o valor salvo quando é light", () => {
    expect(resolveTheme("light", true)).toBe("light");
  });

  it("usa o valor salvo quando é dark", () => {
    expect(resolveTheme("dark", false)).toBe("dark");
  });

  it("segue a preferência do sistema quando salvo é system", () => {
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
  });

  it("segue a preferência do sistema quando não há nada salvo", () => {
    expect(resolveTheme(null, true)).toBe("dark");
    expect(resolveTheme(null, false)).toBe("light");
  });

  it("ignora valor salvo inválido e cai pro sistema", () => {
    expect(resolveTheme("neon", true)).toBe("dark");
  });
});
