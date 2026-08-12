import { configDefaults, defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    alias: { "@": path.resolve(__dirname, "./") },
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    restoreMocks: true,
    exclude: [...configDefaults.exclude, "**/.worktrees/**"],
  },
});
