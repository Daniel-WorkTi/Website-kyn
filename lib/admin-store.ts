import fs from "fs/promises";
import path from "path";
import { getGithubToken } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";

const REPO = "Daniel-WorkTi/Website-kyn";
const BRANCH = "main";
const CONFIG_PATH = "private/admin.json";
const LOCAL_CONFIG_PATH = path.join(process.cwd(), "private", "admin.json");

export type AdminConfig = {
  username: string;
  displayName: string;
  email: string;
  passwordHash: string;
  updatedAt: string;
};

export type AdminProfile = Pick<AdminConfig, "username" | "displayName" | "email">;

function githubHeaders(token: string) {
  return { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" };
}

function configFromEnv(): AdminConfig | null {
  const username = process.env.ADMIN_USERNAME?.trim();
  const password = process.env.ADMIN_PASSWORD;
  if (!username || !password) return null;

  return {
    username,
    displayName: process.env.ADMIN_DISPLAY_NAME?.trim() || username,
    email: process.env.ADMIN_EMAIL?.trim() || process.env.EMAIL_FROM?.match(/<([^>]+)>/)?.[1] || "",
    passwordHash: hashPassword(password),
    updatedAt: new Date().toISOString()
  };
}

async function readLocalConfig(): Promise<{ config: AdminConfig; sha: string | null } | null> {
  try {
    const raw = await fs.readFile(LOCAL_CONFIG_PATH, "utf8");
    return { config: JSON.parse(raw) as AdminConfig, sha: null };
  } catch {
    return null;
  }
}

async function writeLocalConfig(config: AdminConfig): Promise<void> {
  await fs.mkdir(path.dirname(LOCAL_CONFIG_PATH), { recursive: true });
  await fs.writeFile(LOCAL_CONFIG_PATH, `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

async function readGithubConfig(
  token: string
): Promise<{ config: AdminConfig; sha: string } | null> {
  const gh = await fetch(
    `https://api.github.com/repos/${REPO}/contents/${CONFIG_PATH}?ref=${BRANCH}`,
    { headers: githubHeaders(token) }
  );
  if (!gh.ok) return null;
  const data = (await gh.json()) as { content?: string; sha?: string };
  if (!data.content || !data.sha) return null;
  const text = Buffer.from(data.content, "base64").toString("utf8");
  return { config: JSON.parse(text) as AdminConfig, sha: data.sha };
}

async function writeGithubConfig(
  token: string,
  config: AdminConfig,
  sha: string | null,
  message: string
): Promise<void> {
  const body: Record<string, string> = {
    message,
    content: Buffer.from(`${JSON.stringify(config, null, 2)}\n`, "utf8").toString("base64"),
    branch: BRANCH
  };
  if (sha) body.sha = sha;

  const gh = await fetch(`https://api.github.com/repos/${REPO}/contents/${CONFIG_PATH}`, {
    method: "PUT",
    headers: { ...githubHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!gh.ok) {
    const result = (await gh.json().catch(() => ({}))) as { message?: string };
    throw new Error(result.message || "Erro ao guardar definições.");
  }
}

let cachedConfig: AdminConfig | null = null;
let cachedSha: string | null = null;

export async function getAdminConfig(force = false): Promise<AdminConfig> {
  if (cachedConfig && !force) return cachedConfig;

  const local = await readLocalConfig();
  if (local) {
    cachedConfig = local.config;
    cachedSha = local.sha;
    return local.config;
  }

  const token = getGithubToken();
  if (token) {
    const remote = await readGithubConfig(token);
    if (remote) {
      cachedConfig = remote.config;
      cachedSha = remote.sha;
      return remote.config;
    }
  }

  const fromEnv = configFromEnv();
  if (!fromEnv) {
    throw new Error("Conta de administrador não configurada.");
  }

  cachedConfig = fromEnv;
  cachedSha = null;
  return fromEnv;
}

export async function saveAdminConfig(
  config: AdminConfig,
  message = "Atualizar conta de administrador"
): Promise<AdminConfig> {
  const next: AdminConfig = { ...config, updatedAt: new Date().toISOString() };

  const token = getGithubToken();
  if (token) {
    if (!cachedSha) {
      const remote = await readGithubConfig(token);
      cachedSha = remote?.sha ?? null;
    }
    await writeGithubConfig(token, next, cachedSha, message);
    cachedConfig = next;
    return next;
  }

  await writeLocalConfig(next);
  cachedConfig = next;
  cachedSha = null;
  return next;
}

export async function verifyAdminPassword(password: string): Promise<boolean> {
  const config = await getAdminConfig();
  return verifyPassword(password, config.passwordHash);
}

export function invalidateAdminConfigCache(): void {
  cachedConfig = null;
  cachedSha = null;
}

export function toAdminProfile(config: AdminConfig): AdminProfile {
  return {
    username: config.username,
    displayName: config.displayName,
    email: config.email
  };
}
