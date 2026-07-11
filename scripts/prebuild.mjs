import { execSync } from "node:child_process";

const port = process.env.PORT || "3000";

function isPortInUse() {
  if (process.platform !== "win32") {
    try {
      execSync(`lsof -i :${port}`, { stdio: "ignore" });
      return true;
    } catch {
      return false;
    }
  }

  try {
    const out = execSync(`netstat -ano | findstr :${port}`, { encoding: "utf8" });
    return out.split("\n").some((line) => line.includes("LISTENING"));
  } catch {
    return false;
  }
}

if (isPortInUse()) {
  console.error(
    `\n[build] A porta ${port} esta em uso (npm run dev activo).\n` +
      "Pare o servidor de desenvolvimento antes de correr npm run build,\n" +
      "senao a cache .next pode corromper-se.\n"
  );
  process.exit(1);
}
