import {
  appLink,
  escapeHtml,
  shellHtml,
  shellText,
  unsubscribeLink,
} from "./shared";

export interface FinalRulePayload {
  userId: string;
  displayName?: string;
  docketId: string;
  finalRuleDocumentId: string;
  finalRuleTitle: string;
  agencyName: string;
  // The original document (proposed rule) the user engaged with, if known.
  originalDocumentId?: string;
  originalTitle?: string;
}

interface BuiltEmail {
  subject: string;
  html: string;
  text: string;
}

export function buildFinalRuleEmail(p: FinalRulePayload): BuiltEmail {
  const greeting = p.displayName ? `Hi ${p.displayName},` : "Hi there,";
  const finalUrl = `https://www.regulations.gov/document/${encodeURIComponent(p.finalRuleDocumentId)}`;
  const detailUrl = appLink(
    `/regulation/${encodeURIComponent(p.originalDocumentId ?? p.finalRuleDocumentId)}`,
  );
  const subject = `Final rule posted: ${truncate(p.finalRuleTitle, 60)}`;
  const unsubscribe = unsubscribeLink(p.userId, "final-rule");

  const originalLine = p.originalTitle
    ? `<p style="font-size:14px;color:#2a3553;margin:0 0 14px;line-height:1.5;">
         You commented on the proposed version: <em>${escapeHtml(p.originalTitle)}</em>.
       </p>`
    : "";

  const body = `
    <p style="font-size:15px;line-height:1.6;color:#0e1b33;margin:0 0 12px;">${escapeHtml(greeting)}</p>
    <p style="font-size:15px;line-height:1.6;color:#2a3553;margin:0 0 18px;">
      A docket you engaged with just published its <strong>final rule</strong>.
      Here's the agency's final version, alongside the proposed text you commented on.
    </p>
    <div style="border:1px solid #e5ddc9;border-radius:8px;padding:18px;background:#f7f2e8;">
      <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;color:#6b6457;">
        ${escapeHtml(p.agencyName)} · Final Rule
      </div>
      <div style="font-family:Georgia,serif;font-size:18px;line-height:1.4;color:#0e1b33;margin-top:6px;">
        ${escapeHtml(p.finalRuleTitle)}
      </div>
      ${originalLine}
      <div style="margin-top:14px;">
        <a href="${finalUrl}" style="display:inline-block;background:#0e1b33;color:#f7f2e8;padding:10px 18px;border-radius:9999px;text-decoration:none;font-size:14px;font-weight:500;">
          Read the final rule →
        </a>
        &nbsp;
        <a href="${detailUrl}" style="display:inline-block;color:#b45309;padding:10px 4px;text-decoration:underline;font-size:14px;">
          See your activity
        </a>
      </div>
    </div>
    <p style="font-size:13px;color:#6b6457;margin:18px 0 0;line-height:1.6;">
      We don't classify the change as good or bad for you. We surface it. You decide.
    </p>`;

  const text = `${greeting}

A docket you engaged with just published its final rule.

${p.agencyName} · Final Rule
${p.finalRuleTitle}
${p.originalTitle ? `Your proposed-rule comment was on: ${p.originalTitle}\n` : ""}
Read the final rule: ${finalUrl}
See your activity: ${detailUrl}

We don't classify the change as good or bad for you. We surface it. You decide.`;

  return {
    subject,
    html: shellHtml({
      preheader: "A docket you engaged with just posted its final rule.",
      body,
      unsubscribeUrl: unsubscribe,
    }),
    text: shellText({ body: text, unsubscribeUrl: unsubscribe }),
  };
}

function truncate(s: string, n: number): string {
  return s.length <= n ? s : s.slice(0, n - 1).trimEnd() + "…";
}
