import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = process.env.PORT || "3000";
const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");

console.warn("[dev:webpack] Modo legado — prefira npm run dev (Turbopack).\n");

const child = spawn(process.execPath, [nextBin, "dev", "-p", port], {
  cwd: root,
  stdio: "inherit",
  env: process.env
});

child.on("exit", (code) => process.exit(code ?? 0));
