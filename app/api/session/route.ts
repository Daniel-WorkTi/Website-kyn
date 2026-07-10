import { NextRequest, NextResponse } from "next/server";
import { getAdminConfig, toAdminProfile } from "@/lib/admin-store";
import { getSessionUser } from "@/lib/admin/auth-request";

export async function GET(req: NextRequest) {
  const user = getSessionUser(req);
  if (!user) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  try {
    const config = await getAdminConfig();
    const profile = toAdminProfile(config);
    return NextResponse.json({
      authenticated: true,
      user: profile.username,
      displayName: profile.displayName,
      email: profile.email
    });
  } catch {
    return NextResponse.json({ authenticated: true, user });
  }
}
