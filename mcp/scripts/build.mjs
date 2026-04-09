import * as esbuild from "esbuild";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));
const mcpRoot = dirname(root);

const banner =
  "#!/usr/bin/env node\n" +
  "import { createRequire } from 'module';\n" +
  "const require = createRequire(import.meta.url);\n";

await esbuild.build({
  entryPoints: [join(mcpRoot, "src/index.ts")],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "esm",
  outfile: join(mcpRoot, "dist/index.mjs"),
  banner: { js: banner }
});
