import { spawn } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = process.env.PORT || "3000";

function killPort() {
  if (process.platform !== "win32") return false;

  const pids = new Set();
  try {
    const out = execSync(`netstat -ano | findstr :${port}`, { encoding: "utf8" });
    for (const line of out.split("\n")) {
      if (!line.includes("LISTENING")) continue;
      const parts = line.trim().split(/\s+/);
      const pid = parts.at(-1);
      if (pid && /^\d+$/.test(pid) && pid !== "0") pids.add(pid);
    }
  } catch {
    return false;
  }

  for (const pid of pids) {
    try {
      execSync(`taskkill /F /PID ${pid}`, { stdio: "ignore" });
      console.log(`[dev] Processo antigo encerrado (PID ${pid}).`);
    } catch {
      // ignore
    }
  }

  return pids.size > 0;
}

function cleanNextCache() {
  const nextDir = path.join(root, ".next");
  if (!existsSync(nextDir)) return;

  try {
    rmSync(nextDir, { recursive: true, force: true });
    console.log("[dev] Cache .next removida.");
  } catch {
    console.warn("[dev] Nao foi possivel apagar .next — feche outros terminais com npm run dev.");
  }
}

const stopped = killPort();
if (stopped) await sleep(1000);

cleanNextCache();

console.log(`[dev] A iniciar Next.js (Turbopack) em http://localhost:${port}\n`);

const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");
const child = spawn(process.execPath, [nextBin, "dev", "-p", port, "--turbo"], {
  cwd: root,
  stdio: "inherit",
  env: process.env
});

child.on("exit", (code) => process.exit(code ?? 0));
