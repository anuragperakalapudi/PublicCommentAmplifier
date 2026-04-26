import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/config";
import {
  getEmailPreferences,
  upsertEmailPreferences,
} from "@/lib/db/emailPreferences";

const VALID_KINDS = ["digest", "closing-soon", "final-rule"] as const;
type Kind = (typeof VALID_KINDS)[number];

function isValidKind(k: string): k is Kind {
  return (VALID_KINDS as readonly string[]).includes(k);
}

async function applyUnsubscribe(userId: string, kind: Kind): Promise<void> {
  const prefs = await getEmailPreferences(userId);
  const next = { ...prefs };
  if (kind === "digest") next.digestFrequency = "off";
  if (kind === "closing-soon") next.closingSoonAlerts = false;
  if (kind === "final-rule") next.finalRuleAlerts = false;
  await upsertEmailPreferences(userId, next);
}

function htmlPage(opts: { ok: boolean; kind?: string; message: string }): Response {
  const body = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>OpenComment · Unsubscribed</title>
<style>
  body{margin:0;padding:0;background:#f7f2e8;color:#0e1b33;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;}
  .wrap{max-width:480px;margin:80px auto;padding:36px;background:#ffffff;border:1px solid #e5ddc9;border-radius:12px;}
  h1{font-family:Georgia,serif;font-size:28px;margin:0 0 12px;letter-spacing:-0.012em;}
  p{font-size:15px;line-height:1.6;color:#2a3553;margin:0 0 14px;}
  a.btn{display:inline-block;background:#0e1b33;color:#f7f2e8;padding:10px 18px;border-radius:9999px;text-decoration:none;font-size:14px;font-weight:500;margin-top:8px;}
  .muted{font-size:12px;color:#6b6457;}
</style>
</head>
<body>
<div class="wrap">
  <h1>${opts.ok ? "You're unsubscribed." : "Couldn't unsubscribe"}</h1>
  <p>${opts.message}</p>
  ${opts.ok ? `<p class="muted">You can re-enable any time from your <a href="/settings/email" style="color:#b45309;">email preferences</a>.</p>` : ""}
  <a class="btn" href="/">Back to OpenComment</a>
</div>
</body>
</html>`;
  return new Response(body, {
    status: opts.ok ? 200 : 400,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

async function handle(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const userId = url.searchParams.get("user");
  const kind = url.searchParams.get("kind");

  if (!userId || !kind) {
    return htmlPage({
      ok: false,
      message:
        "Missing required parameters. The unsubscribe link may be malformed.",
    });
  }
  if (!isValidKind(kind)) {
    return htmlPage({
      ok: false,
      message: `Unknown email kind: "${kind}".`,
    });
  }
  if (!isSupabaseConfigured) {
    return htmlPage({
      ok: false,
      message:
        "Email preferences aren't currently configured on this server.",
    });
  }

  try {
    await applyUnsubscribe(userId, kind);
  } catch (err) {
    return htmlPage({
      ok: false,
      message: `Something went wrong: ${err instanceof Error ? err.message : "unknown error"}.`,
    });
  }

  const friendly =
    kind === "digest"
      ? "We've turned off your weekly digest."
      : kind === "closing-soon"
        ? "We've turned off closing-soon alerts."
        : "We've turned off final-rule notifications.";
  return htmlPage({ ok: true, kind, message: friendly });
}

// GET — handles human-clicked unsubscribe links (browser navigation).
export async function GET(req: Request) {
  const accept = req.headers.get("accept") ?? "";
  // If the client wants JSON (an email-validator bot, say), respond JSON.
  if (accept.includes("application/json")) {
    const url = new URL(req.url);
    const userId = url.searchParams.get("user");
    const kind = url.searchParams.get("kind");
    if (!userId || !kind || !isValidKind(kind) || !isSupabaseConfigured) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    try {
      await applyUnsubscribe(userId, kind);
      return NextResponse.json({ ok: true, kind });
    } catch (err) {
      return NextResponse.json(
        { ok: false, error: err instanceof Error ? err.message : "unknown" },
        { status: 500 },
      );
    }
  }
  return handle(req);
}

// POST — RFC 8058 one-click unsubscribe (List-Unsubscribe-Post header
// causes mail clients to POST to this URL).
export async function POST(req: Request) {
  return handle(req);
}
