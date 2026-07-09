import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest, requireAdmin } from "@/lib/auth";

export function requireAdminRequest(req: NextRequest): string | NextResponse {
  return requireAdmin(req);
}

export function getSessionUser(req: NextRequest): string | null {
  return getSessionFromRequest(req);
}
