import type { Regulation } from "@/lib/types";
import { formatDeadline } from "@/lib/ranking";
import {
  appLink,
  escapeHtml,
  shellHtml,
  shellText,
  unsubscribeLink,
} from "./shared";

export interface ClosingSoonPayload {
  userId: string;
  displayName?: string;
  regulation: Regulation;
  daysRemaining: 7 | 3 | 1;
}

interface BuiltEmail {
  subject: string;
  html: string;
  text: string;
}

export function buildClosingSoonEmail(p: ClosingSoonPayload): BuiltEmail {
  const greeting = p.displayName ? `Hi ${p.displayName},` : "Hi there,";
  const url = appLink(`/regulation/${encodeURIComponent(p.regulation.id)}`);
  const deadline = formatDeadline(p.regulation.commentEndDate);
  const dayPhrase =
    p.daysRemaining === 1
      ? "closes tomorrow"
      : `closes in ${p.daysRemaining} days`;

  const subject = `${dayPhrase}: ${truncate(p.regulation.title, 60)}`;
  const unsubscribe = unsubscribeLink(p.userId, "closing-soon");

  const body = `
    <p style="font-size:15px;line-height:1.6;color:#0e1b33;margin:0 0 12px;">${escapeHtml(greeting)}</p>
    <p style="font-size:15px;line-height:1.6;color:#2a3553;margin:0 0 18px;">
      A rule you saved <strong style="color:#b45309;">${escapeHtml(dayPhrase)}</strong>.
      If you've been planning to comment, this is the moment.
    </p>
    <div style="border:1px solid #e5ddc9;border-radius:8px;padding:18px;background:#f7f2e8;">
      <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;color:#6b6457;">
        ${escapeHtml(p.regulation.agencyName)} · ${escapeHtml(deadline)}
      </div>
      <div style="font-family:Georgia,serif;font-size:18px;line-height:1.4;color:#0e1b33;margin-top:6px;">
        ${escapeHtml(p.regulation.title)}
      </div>
      <div style="font-size:14px;color:#2a3553;margin-top:8px;line-height:1.5;">
        ${escapeHtml(p.regulation.summary)}
      </div>
      <div style="margin-top:14px;">
        <a href="${url}" style="display:inline-block;background:#b45309;color:#f7f2e8;padding:10px 18px;border-radius:9999px;text-decoration:none;font-size:14px;font-weight:500;">
          Open and draft →
        </a>
      </div>
    </div>`;

  const text = `${greeting}

A rule you saved ${dayPhrase}.

${p.regulation.agencyName} · ${deadline}
${p.regulation.title}
${p.regulation.summary}

Open and draft: ${url}`;

  return {
    subject,
    html: shellHtml({
      preheader: `${dayPhrase}. Open OpenComment to draft your comment.`,
      body,
      unsubscribeUrl: unsubscribe,
    }),
    text: shellText({ body: text, unsubscribeUrl: unsubscribe }),
  };
}

function truncate(s: string, n: number): string {
  return s.length <= n ? s : s.slice(0, n - 1).trimEnd() + "…";
}
