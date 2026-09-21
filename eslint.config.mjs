import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([
  ...nextVitals,
  // Preserve the existing effect-based loader architecture during the security upgrade.
  // These newly introduced compiler/performance diagnostics remain visible as advice.
  // React Compiler is not enabled; hooks correctness and all other checks remain enforced.
  { rules: { "react-hooks/set-state-in-effect": "warn", "react-hooks/immutability": "warn" } },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);
