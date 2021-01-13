import typescript from "rollup-plugin-typescript2";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import pkg from "./package.json";
// import { terser } from "rollup-plugin-terser";
import analyze from "rollup-plugin-analyzer";
import json from "@rollup/plugin-json";
import commonjs from "@rollup/plugin-commonjs";
import globals from "rollup-plugin-node-globals";
import builtins from "rollup-plugin-node-builtins";

export default {
  input: "src/index.ts",
  output: [
    {
      file: pkg.main,
      format: "cjs"
    },
    {
      file: pkg.module,
      format: "esm"
    },
    {
      file: pkg.browser,
      name: "jsonTemplateEngine",
      format: "umd",
      globals: {}
    }
  ],
  plugins: [
    json(),
    typescript(),
    nodeResolve({ preferBuiltins: true }),
    commonjs(),
    globals(),
    builtins(),
    // terser(),
    analyze()
  ],
  external: [...Object.keys(pkg.dependencies || {}), ...Object.keys(pkg.peerDependencies || {})],

  onwarn: (msg, warn) => {
    if (!/Circular/.test(msg)) {
      warn(msg);
    }
  }
};
// export default {
//   input: "src/index.ts",
//   output: [
//     {
//       file: pkg.main,
//       format: "cjs",
//     },
//   ],
//   external: [
//     ...Object.keys(pkg.dependencies || {}),
//     ...Object.keys(pkg.peerDependencies || {}),
//     "events",
//   ],
//   plugins: [
//     nodeResolve(),
//     typescript({
//       typescript: require("typescript"),
//     }),
//     terser(),
//     analyze(),
//   ],
// };
