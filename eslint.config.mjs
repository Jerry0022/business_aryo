import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const config = [
  ...nextVitals,
  ...nextTs,
  {
    // react-three-fiber is imperative by design: materials, uniforms, lights and the camera are
    // mutated inside useFrame/effects instead of re-rendering React every frame.
    files: ["src/features/house/scene/**/*.{ts,tsx}"],
    rules: { "react-hooks/immutability": "off" },
  },
  {
    ignores: [".next/**", "node_modules/**", "drizzle/**", "playwright-report/**", "test-results/**", "next-env.d.ts"],
  },
];

export default config;
