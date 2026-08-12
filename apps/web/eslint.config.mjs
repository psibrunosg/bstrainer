import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

const config = [
  {
    ignores: [
      ".next/**",
      "out/**",
      "node_modules/**",
      ".worktrees/**",
      // Criado/removido pelo turbo durante a propria task de lint; sem isso o
      // walk do eslint corre o risco de ENOENT no meio da varredura.
      ".turbo/**",
      "next-env.d.ts",
    ],
  },
  ...compat.extends("next/core-web-vitals"),
  {
    rules: {
      // Desativada de proposito: este app usa `output: "export"` com
      // `images: { unoptimized: true }` (next.config.ts), servido em GitHub
      // Pages. Nesse cenario `next/image` nao otimiza nada — emite a mesma
      // <img> com overhead de runtime extra. As <img> do projeto ja declaram
      // width/height ou loading="lazy", entao o ganho de LCP da regra nao se
      // aplica aqui.
      "@next/next/no-img-element": "off",
    },
  },
];

export default config;
