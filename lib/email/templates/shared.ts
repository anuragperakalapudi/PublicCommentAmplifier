import { APP_URL } from "@/lib/config";

// Token-signed unsubscribe link. The token isn't a security boundary (the
// receiving endpoint will validate user consent); it just makes the URL
// tamper-resistant against trivial enumeration.
export function unsubscribeLink(userId: string, kind: string): string {
  return `${APP_URL}/api/email/unsubscribe?user=${encodeURIComponent(userId)}&kind=${encodeURIComponent(kind)}`;
}

export function appLink(path: string): string {
  return `${APP_URL}${path.startsWith("/") ? path : "/" + path}`;
}

// Wraps body HTML in our standard email shell — header + footer with
// privacy / unsubscribe / app link.
export function shellHtml(opts: {
  preheader: string;
  body: string;
  unsubscribeUrl: string;
}): string {
  const escape = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>OpenComment</title>
</head>
<body style="margin:0;padding:0;background:#f7f2e8;color:#0e1b33;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
<span style="display:none!important;visibility:hidden;mso-hide:all;font-size:1px;color:#f7f2e8;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escape(opts.preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f7f2e8;">
  <tr><td align="center" style="padding:32px 16px;">
    <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#ffffff;border:1px solid #e5ddc9;border-radius:12px;">
      <tr><td style="padding:28px 32px 8px;">
        <div style="font-family:Georgia,'Times New Roman',serif;font-size:20px;font-weight:600;color:#0e1b33;letter-spacing:-0.012em;">
          Open<em style="font-style:italic;color:#b45309;">Comment</em>
        </div>
      </td></tr>
      <tr><td style="padding:8px 32px 32px;">
        ${opts.body}
      </td></tr>
      <tr><td style="padding:24px 32px;border-top:1px solid #e5ddc9;font-size:12px;color:#6b6457;line-height:1.6;">
        You're receiving this because you have an OpenComment account.
        <br>
        <a href="${opts.unsubscribeUrl}" style="color:#b45309;text-decoration:underline;">Unsubscribe from this kind of email</a>
        &nbsp;·&nbsp;
        <a href="${appLink("/settings/email")}" style="color:#b45309;text-decoration:underline;">All email preferences</a>
        &nbsp;·&nbsp;
        <a href="${appLink("/privacy")}" style="color:#b45309;text-decoration:underline;">Privacy</a>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

export function shellText(opts: {
  body: string;
  unsubscribeUrl: string;
}): string {
  return `${opts.body}

---
You're receiving this because you have an OpenComment account.
Unsubscribe: ${opts.unsubscribeUrl}
All email preferences: ${appLink("/settings/email")}
Privacy: ${appLink("/privacy")}
`;
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
