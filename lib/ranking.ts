import {
  US_STATE_NAMES,
  type RankingSignal,
  type Regulation,
  type ScoredRegulation,
  type Topic,
  type UserProfile,
} from "./types";

const TOPIC_KEYWORDS: Record<Topic, string[]> = {
  Healthcare: [
    "health", "medicare", "medicaid", "telehealth", "drug", "prescription",
    "hospital", "clinic", "patient", "insurance", "parity", "mental health",
  ],
  Housing: [
    "housing", "voucher", "tenant", "landlord", "rent", "homeless", "section 8",
    "hud", "fair housing", "evict", "mortgage",
  ],
  Labor: [
    "labor", "worker", "wage", "overtime", "employer", "employee", "contractor",
    "gig", "union", "osha", "workforce", "workplace",
  ],
  Disability: [
    "disability", "ada", "accessib", "caregiver", "home health", "long-term care",
    "wheelchair", "ssi", "ssdi", "service animal",
  ],
  Immigration: [
    "immigration", "visa", "h-1b", "h1b", "asylum", "refugee", "uscis",
    "green card", "naturalization", "border",
  ],
  Environment: [
    "environment", "epa", "air quality", "water", "pfas", "pollution",
    "emission", "climate", "drinking water", "wildlife", "wetland",
  ],
  Education: [
    "education", "student", "loan", "school", "college", "university",
    "title i", "title ix", "fafsa", "borrower", "tuition",
  ],
  Veterans: [
    "veteran", "va", "service member", "gi bill", "military", "tricare",
    "post-9/11", "vbA", "vha",
  ],
  "Small Business": [
    "small business", "sba", "microloan", "entrepreneur", "self-employed",
    "lender", "minority business", "8(a)",
  ],
  "Civil Rights": [
    "civil rights", "discrimination", "voting", "fair housing", "title vi",
    "title vii", "ada", "equal protection", "harassment", "hate crime",
  ],
  "Tax & Finance": [
    "tax", "irs", "treasury", "banking", "credit union", "consumer credit",
    "interest rate", "tax credit", "deduction", "withholding", "1099",
  ],
  "Public Safety": [
    "police", "firearm", "atf", "transportation safety", "emergency",
    "fire safety", "first responder", "9-1-1", "criminal justice", "prison",
  ],
  "Consumer Protection": [
    "consumer", "ftc", "fraud", "deceptive", "unfair practice", "warranty",
    "recall", "data privacy", "robocall", "scam", "product safety",
  ],
};

export interface FeedbackWeights {
  agency: Map<string, number>;
  topic: Map<Topic, number>;
}

function capped(n: number): number {
  return Math.max(-5, Math.min(5, n));
}

export function deriveWeights(
  feedback: Array<{ documentId: string; signal: RankingSignal }>,
  rulesById: Map<string, Regulation>,
): FeedbackWeights {
  const agency = new Map<string, number>();
  const topic = new Map<Topic, number>();

  for (const item of feedback) {
    const reg = rulesById.get(item.documentId);
    if (!reg) continue;
    const delta = item.signal === "more_like" ? 1 : -1;
    agency.set(reg.agencyId, capped((agency.get(reg.agencyId) ?? 0) + delta));
    for (const t of reg.topics) {
      topic.set(t, capped((topic.get(t) ?? 0) + delta));
    }
  }

  return { agency, topic };
}

function textMentionsState(text: string, stateCode: string): boolean {
  if (!stateCode) return false;
  const name = US_STATE_NAMES[stateCode];
  const lower = text.toLowerCase();
  const hasFullName = !!name && lower.includes(name.toLowerCase());
  const hasCode = new RegExp(`\\b${stateCode}\\b`).test(text);
  return hasFullName || hasCode;
}

function additionalStateBoost(reg: Regulation, profile: UserProfile): number {
  const states = (profile.additionalStates ?? []).filter(
    (s) => s && s !== profile.state,
  );
  if (states.length === 0) return 0;
  const text = `${reg.title} ${reg.summary}`;
  return states.some((s) => textMentionsState(text, s)) ? 1 : 0;
}

function feedbackScore(reg: Regulation, weights?: FeedbackWeights): number {
  if (!weights) return 0;
  const agencyWeight = weights.agency.get(reg.agencyId) ?? 0;
  const topicWeight = reg.topics.reduce(
    (sum, t) => sum + (weights.topic.get(t) ?? 0),
    0,
  );
  return agencyWeight + topicWeight;
}

function semanticPoints(cosine: number | undefined): number {
  if (cosine === undefined || !Number.isFinite(cosine)) return 0;
  return Math.max(0, Math.min(6, ((cosine - 0.72) / 0.18) * 6));
}

export function scoreRegulation(
  reg: Regulation,
  profile: UserProfile,
  weights?: FeedbackWeights,
): ScoredRegulation {
  const text = `${reg.title} ${reg.summary} ${reg.documentType}`.toLowerCase();
  const matchedTopics: Topic[] = [];
  let baseScore = 0;

  for (const topic of profile.topics) {
    const keywords = TOPIC_KEYWORDS[topic] ?? [];
    const hits = keywords.filter((k) => text.includes(k)).length;
    if (hits > 0) {
      matchedTopics.push(topic);
      baseScore += Math.min(hits, 4);
    }
    if (reg.topics.includes(topic)) {
      baseScore += 4;
      if (!matchedTopics.includes(topic)) matchedTopics.push(topic);
    }
  }

  // Recency bump: newer regs nudged up
  const days =
    (Date.now() - new Date(reg.postedDate).getTime()) / (1000 * 60 * 60 * 24);
  if (days < 7) baseScore += 1;

  // Urgency bump: closing soon
  const daysToClose =
    (new Date(reg.commentEndDate).getTime() - Date.now()) /
    (1000 * 60 * 60 * 24);
  if (daysToClose < 14 && daysToClose > 0) baseScore += 1;

  baseScore += additionalStateBoost(reg, profile);
  baseScore += semanticPoints(reg.semanticScore);
  const score = baseScore + feedbackScore(reg, weights);

  return { ...reg, baseScore, score, matchedTopics };
}

export function rankRegulations(
  regs: Regulation[],
  profile: UserProfile,
  weights?: FeedbackWeights,
): ScoredRegulation[] {
  return regs
    .map((r) => scoreRegulation(r, profile, weights))
    .sort((a, b) => b.score - a.score);
}

export function matchPercent(score: number, profileTopicCount: number): number {
  // Cap topic-driven max at ~5 per topic (4 from list-match + buffer)
  const maxScore = Math.max(profileTopicCount * 5, 5) + 2;
  const pct = Math.min(99, Math.round((score / maxScore) * 100));
  return Math.max(40, pct);
}

export function daysUntil(dateStr: string): number {
  const ms = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export function formatDeadline(dateStr: string): string {
  const days = daysUntil(dateStr);
  if (days === 0) return "Closes today";
  if (days === 1) return "Closes tomorrow";
  if (days <= 30) return `Closes in ${days} days`;
  const d = new Date(dateStr);
  return `Closes ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}
