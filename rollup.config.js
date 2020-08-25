import typescript from "rollup-plugin-typescript2";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import pkg from "./package.json";
import { terser } from "rollup-plugin-terser";
import analyze from "rollup-plugin-analyzer";

export default {
  input: "src/index.ts",
  output: [
    {
      file: pkg.main,
      format: "cjs",
    },
  ],
  external: [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.peerDependencies || {}),
    "events",
  ],
  plugins: [
    nodeResolve(),
    typescript({
      typescript: require("typescript"),
    }),
    terser(),
    analyze(),
  ],
};
