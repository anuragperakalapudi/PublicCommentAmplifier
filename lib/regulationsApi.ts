import type { Regulation, Topic } from "./types";

const AGENCY_NAMES: Record<string, string> = {
  CMS: "Centers for Medicare & Medicaid Services",
  HHS: "Department of Health and Human Services",
  DOL: "Department of Labor",
  HUD: "Department of Housing and Urban Development",
  EPA: "Environmental Protection Agency",
  ED: "Department of Education",
  VA: "Department of Veterans Affairs",
  SBA: "Small Business Administration",
  USCIS: "U.S. Citizenship and Immigration Services",
  DHS: "Department of Homeland Security",
  DOT: "Department of Transportation",
  USDA: "Department of Agriculture",
  TREAS: "Department of the Treasury",
  IRS: "Internal Revenue Service",
  FCC: "Federal Communications Commission",
  FTC: "Federal Trade Commission",
  SEC: "Securities and Exchange Commission",
  DOJ: "Department of Justice",
  DOI: "Department of the Interior",
  DOC: "Department of Commerce",
  DOD: "Department of Defense",
  DOE: "Department of Energy",
  DOS: "Department of State",
};

export function agencyDisplayName(agencyId: string): string {
  return AGENCY_NAMES[agencyId] ?? agencyId;
}

export function buildRegulationsUrl(): string {
  // Note: we deliberately don't apply filter[searchTerm] — the v4 API does
  // strict whole-word matching on it, which excludes most real documents
  // (e.g., "healthcare" returns 0 rules even when "health" returns 10).
  // Instead we pull a broad pool of currently-open Proposed Rules and rank
  // them client-side via keyword overlap against the user's topics.
  const params = new URLSearchParams();
  params.set("filter[documentType]", "Proposed Rule");
  params.set("filter[commentEndDate][ge]", new Date().toISOString().slice(0, 10));
  params.set("sort", "-postedDate");
  params.set("page[size]", "250");
  return `https://api.regulations.gov/v4/documents?${params.toString()}`;
}

const AGENCY_TO_TOPICS: Record<string, Topic[]> = {
  CMS: ["Healthcare"],
  HHS: ["Healthcare", "Disability"],
  DOL: ["Labor"],
  OSHA: ["Labor", "Healthcare"],
  NLRB: ["Labor"],
  EEOC: ["Labor", "Civil Rights"],
  HUD: ["Housing", "Civil Rights"],
  EPA: ["Environment"],
  PHMSA: ["Environment", "Public Safety"],
  DOE: ["Environment"],
  NRC: ["Environment"],
  USDA: ["Environment", "Small Business"],
  ED: ["Education", "Civil Rights"],
  VA: ["Veterans", "Healthcare"],
  SBA: ["Small Business"],
  USCIS: ["Immigration"],
  ICE: ["Immigration"],
  DHS: ["Immigration", "Public Safety"],
  EOIR: ["Immigration"],
  ACL: ["Disability"],
  SSA: ["Disability"],
  DOJ: ["Civil Rights", "Public Safety"],
  ATF: ["Public Safety"],
  DEA: ["Public Safety"],
  FBI: ["Public Safety"],
  TREAS: ["Tax & Finance"],
  IRS: ["Tax & Finance"],
  CFPB: ["Tax & Finance", "Consumer Protection"],
  OCC: ["Tax & Finance"],
  FDIC: ["Tax & Finance"],
  FTC: ["Consumer Protection"],
  CPSC: ["Consumer Protection", "Public Safety"],
  FCC: ["Consumer Protection"],
  NHTSA: ["Public Safety", "Consumer Protection"],
  FAA: ["Public Safety"],
  FRA: ["Public Safety"],
  FMCSA: ["Public Safety"],
  USCG: ["Public Safety"],
};

interface RegulationsApiAttributes {
  agencyId?: string;
  title?: string;
  docAbstract?: string | null;
  documentType?: string;
  postedDate?: string;
  commentEndDate?: string | null;
  withdrawn?: boolean;
  openForComment?: boolean;
}

interface RegulationsApiItem {
  id: string;
  attributes?: RegulationsApiAttributes;
}

const ALL_TOPICS_LIST: Topic[] = [
  "Healthcare", "Housing", "Labor", "Disability", "Immigration",
  "Environment", "Education", "Veterans", "Small Business",
  "Civil Rights", "Tax & Finance", "Public Safety", "Consumer Protection",
];

const TOPIC_KEYWORDS: Record<Topic, string[]> = {
  Healthcare: ["health", "medicare", "medicaid", "drug", "hospital", "clinic", "patient", "insurance", "telehealth"],
  Housing: ["housing", "voucher", "tenant", "landlord", "rent", "homeless", "mortgage"],
  Labor: ["labor", "worker", "wage", "overtime", "employer", "employee", "workplace", "workforce"],
  Disability: ["disability", "accessib", "caregiver", "long-term care"],
  Immigration: ["immigration", "visa", "asylum", "refugee", "naturalization", "border"],
  Environment: ["environment", "pollution", "emission", "climate", "drinking water", "wildlife", "pipeline", "energy", "wetland"],
  Education: ["education", "student", "school", "college", "university", "borrower", "tuition"],
  Veterans: ["veteran", "service member", "gi bill", "military"],
  "Small Business": ["small business", "microloan", "entrepreneur", "self-employed", "minority business"],
  "Civil Rights": ["civil rights", "discrimination", "voting", "fair housing", "harassment", "equal protection"],
  "Tax & Finance": ["tax", "irs", "treasury", "banking", "credit union", "tax credit", "withholding"],
  "Public Safety": ["police", "firearm", "transportation safety", "emergency", "first responder", "criminal justice"],
  "Consumer Protection": ["consumer", "fraud", "deceptive", "unfair practice", "warranty", "recall", "robocall", "product safety"],
};

export function mapApiResponse(
  items: RegulationsApiItem[],
  _topics: Topic[],
): Regulation[] {
  return items
    .filter((it) => it && it.id && it.attributes)
    .filter((it) => !it.attributes!.withdrawn)
    .map((it) => {
      const a = it.attributes!;
      const title = a.title ?? "Untitled regulation";
      const summary =
        (a.docAbstract && a.docAbstract.trim()) ||
        truncate(title, 240);
      const text = `${title} ${a.docAbstract ?? ""}`.toLowerCase();
      const agencyId = a.agencyId ?? "—";

      const inferredTopics = new Set<Topic>(AGENCY_TO_TOPICS[agencyId] ?? []);
      for (const topic of ALL_TOPICS_LIST) {
        const keywords = TOPIC_KEYWORDS[topic];
        if (keywords.some((k) => text.includes(k))) inferredTopics.add(topic);
      }

      return {
        id: it.id,
        agencyId,
        agencyName: agencyDisplayName(agencyId),
        title,
        summary,
        documentType: a.documentType ?? "Proposed Rule",
        postedDate: a.postedDate?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
        commentEndDate:
          a.commentEndDate?.slice(0, 10) ??
          new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
        topics: Array.from(inferredTopics),
        regulationsGovUrl: `https://www.regulations.gov/document/${it.id}`,
        source: "api" as const,
      };
    });
}

function truncate(s: string, n: number): string {
  if (s.length <= n) return s;
  return s.slice(0, n).replace(/\s+\S*$/, "") + "…";
}
