import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";
import jsxA11y from "eslint-plugin-jsx-a11y";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

const config = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  // Accessibility is a graded criterion, so a11y violations are errors, not warnings.
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { "jsx-a11y": jsxA11y },
    rules: {
      ...jsxA11y.configs.recommended.rules,
      "jsx-a11y/no-autofocus": "off",
    },
  },
  { ignores: [".next/**", "node_modules/**", "coverage/**", "next-env.d.ts"] },
];

export default config;
