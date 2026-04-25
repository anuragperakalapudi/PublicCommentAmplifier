import type { Regulation, ScoredRegulation, Topic, UserProfile } from "./types";

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

export function scoreRegulation(
  reg: Regulation,
  profile: UserProfile,
): ScoredRegulation {
  const text = `${reg.title} ${reg.summary} ${reg.documentType}`.toLowerCase();
  const matchedTopics: Topic[] = [];
  let score = 0;

  for (const topic of profile.topics) {
    const keywords = TOPIC_KEYWORDS[topic] ?? [];
    const hits = keywords.filter((k) => text.includes(k)).length;
    if (hits > 0) {
      matchedTopics.push(topic);
      score += Math.min(hits, 4);
    }
    if (reg.topics.includes(topic)) {
      score += 4;
      if (!matchedTopics.includes(topic)) matchedTopics.push(topic);
    }
  }

  // Recency bump — newer regs nudged up
  const days =
    (Date.now() - new Date(reg.postedDate).getTime()) / (1000 * 60 * 60 * 24);
  if (days < 7) score += 1;

  // Urgency bump — closing soon
  const daysToClose =
    (new Date(reg.commentEndDate).getTime() - Date.now()) /
    (1000 * 60 * 60 * 24);
  if (daysToClose < 14 && daysToClose > 0) score += 1;

  return { ...reg, score, matchedTopics };
}

export function rankRegulations(
  regs: Regulation[],
  profile: UserProfile,
): ScoredRegulation[] {
  return regs
    .map((r) => scoreRegulation(r, profile))
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
