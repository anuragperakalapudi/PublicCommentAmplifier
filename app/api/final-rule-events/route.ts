import { NextResponse } from "next/server";
import { currentUserId } from "@/lib/auth";
import { isClerkConfigured, isSupabaseConfigured } from "@/lib/config";
import { listFinalRuleEvents } from "@/lib/db/emailLog";

export async function GET() {
  if (!isClerkConfigured || !isSupabaseConfigured) {
    return NextResponse.json({ events: [] });
  }
  const userId = await currentUserId();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const events = await listFinalRuleEvents(userId);
  return NextResponse.json({ events });
}
