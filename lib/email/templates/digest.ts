import type { ScoredRegulation } from "@/lib/types";
import { formatDeadline, daysUntil } from "@/lib/ranking";
import {
  appLink,
  escapeHtml,
  shellHtml,
  shellText,
  unsubscribeLink,
} from "./shared";

export interface DigestPayload {
  userId: string;
  displayName?: string;
  regulations: ScoredRegulation[];
  topicCount: number;
}

interface BuiltEmail {
  subject: string;
  html: string;
  text: string;
}

export function buildDigestEmail(p: DigestPayload): BuiltEmail {
  const top = p.regulations.slice(0, 5);
  const greeting = p.displayName ? `Hi ${p.displayName},` : "Hi there,";
  const subject = buildSubject(top);
  const unsubscribe = unsubscribeLink(p.userId, "digest");

  const cardsHtml = top
    .map((reg) => {
      const deadline = formatDeadline(reg.commentEndDate);
      const url = appLink(`/regulation/${encodeURIComponent(reg.id)}`);
      return `
        <tr><td style="padding:14px 0;border-top:1px solid #e5ddc9;">
          <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;color:#6b6457;">
            ${escapeHtml(reg.agencyName)} · ${escapeHtml(deadline)}
          </div>
          <div style="font-family:Georgia,serif;font-size:18px;line-height:1.4;color:#0e1b33;margin-top:6px;">
            <a href="${url}" style="color:#0e1b33;text-decoration:none;">${escapeHtml(reg.title)}</a>
          </div>
          <div style="font-size:14px;color:#2a3553;margin-top:6px;line-height:1.5;">
            ${escapeHtml(reg.summary)}
          </div>
          <div style="margin-top:10px;">
            <a href="${url}" style="display:inline-block;background:#0e1b33;color:#f7f2e8;padding:8px 14px;border-radius:9999px;text-decoration:none;font-size:13px;font-weight:500;">
              Read &amp; comment →
            </a>
          </div>
        </td></tr>`;
    })
    .join("");

  const body = `
    <p style="font-size:15px;line-height:1.6;color:#0e1b33;margin:0 0 12px;">${escapeHtml(greeting)}</p>
    <p style="font-size:15px;line-height:1.6;color:#2a3553;margin:0 0 18px;">
      Here are ${top.length} open federal rules from this past week that match your profile.
      Each one is open for public comment right now.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      ${cardsHtml}
    </table>
    <p style="font-size:13px;color:#6b6457;margin:20px 0 0;line-height:1.6;">
      <a href="${appLink("/feed")}" style="color:#b45309;text-decoration:underline;">See all matching rules →</a>
    </p>`;

  const cardsText = top
    .map((reg) => {
      const deadline = formatDeadline(reg.commentEndDate);
      const url = appLink(`/regulation/${encodeURIComponent(reg.id)}`);
      return `${reg.agencyName} · ${deadline}
${reg.title}
${reg.summary}
${url}
`;
    })
    .join("\n");

  const text = `${greeting}

Here are ${top.length} open federal rules that match your profile.

${cardsText}
See all matching rules: ${appLink("/feed")}`;

  return {
    subject,
    html: shellHtml({
      preheader: `${top.length} open rules that match your profile`,
      body,
      unsubscribeUrl: unsubscribe,
    }),
    text: shellText({ body: text, unsubscribeUrl: unsubscribe }),
  };
}

function buildSubject(top: ScoredRegulation[]): string {
  if (top.length === 0) return "No new rules this week";
  const closingThisWeek = top.filter((r) => daysUntil(r.commentEndDate) <= 7).length;
  const lead = top[0];
  if (closingThisWeek > 0) {
    return `${top.length} rules match you, ${closingThisWeek} closing this week`;
  }
  // Truncate the lead title for the subject line
  const leadTitle =
    lead.title.length > 60 ? lead.title.slice(0, 57).trimEnd() + "…" : lead.title;
  return `${top.length} new rules, including "${leadTitle}"`;
}
