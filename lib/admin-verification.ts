import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "admin_pwd_change";
const TTL_MS = 15 * 60 * 1000;

type PendingPasswordChange = {
  codeHash: string;
  newPasswordHash: string;
  exp: number;
};

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET em falta");
  return secret;
}

function signPayload(payload: string): string {
  return crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

function encodePending(data: PendingPasswordChange): string {
  const payload = Buffer.from(JSON.stringify(data)).toString("base64url");
  return `${payload}.${signPayload(payload)}`;
}

function decodePending(token: string): PendingPasswordChange | null {
  const dot = token.indexOf(".");
  if (dot === -1) return null;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (signPayload(payload) !== sig) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as PendingPasswordChange;
    if (!data.exp || Date.now() > data.exp) return null;
    return data;
  } catch {
    return null;
  }
}

export function generateVerificationCode(): string {
  return String(crypto.randomInt(100000, 1000000));
}

export function hashVerificationCode(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

export function verifyVerificationCode(code: string, codeHash: string): boolean {
  const input = hashVerificationCode(code.trim());
  const a = Buffer.from(input);
  const b = Buffer.from(codeHash);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function setPasswordChangeCookie(response: NextResponse, newPasswordHash: string, code: string): void {
  const pending: PendingPasswordChange = {
    codeHash: hashVerificationCode(code),
    newPasswordHash,
    exp: Date.now() + TTL_MS
  };
  response.cookies.set(COOKIE_NAME, encodePending(pending), {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: !!process.env.VERCEL,
    maxAge: TTL_MS / 1000
  });
}

export function readPasswordChangeCookie(request: NextRequest): PendingPasswordChange | null {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return decodePending(decodeURIComponent(token));
}

export function clearPasswordChangeCookie(response: NextResponse): void {
  response.cookies.set(COOKIE_NAME, "", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: !!process.env.VERCEL,
    maxAge: 0
  });
}
