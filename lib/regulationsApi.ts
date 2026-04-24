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

export function buildRegulationsUrl(topics: Topic[]): string {
  const params = new URLSearchParams();
  if (topics.length > 0) {
    params.set("filter[searchTerm]", topics.join(" ").toLowerCase());
  }
  params.set("filter[documentType]", "Proposed Rule");
  params.set("filter[commentEndDate][ge]", new Date().toISOString().slice(0, 10));
  params.set("sort", "-postedDate");
  params.set("page[size]", "20");
  return `https://api.regulations.gov/v4/documents?${params.toString()}`;
}

interface RegulationsApiAttributes {
  agencyId?: string;
  title?: string;
  docAbstract?: string | null;
  documentType?: string;
  postedDate?: string;
  commentEndDate?: string | null;
}

interface RegulationsApiItem {
  id: string;
  attributes?: RegulationsApiAttributes;
}

export function mapApiResponse(
  items: RegulationsApiItem[],
  topics: Topic[],
): Regulation[] {
  const lowerTopics = topics.map((t) => t.toLowerCase());
  return items
    .filter((it) => it && it.id && it.attributes)
    .map((it) => {
      const a = it.attributes!;
      const title = a.title ?? "Untitled regulation";
      const summary =
        (a.docAbstract && a.docAbstract.trim()) ||
        truncate(title, 240);
      const inferredTopics: Topic[] = [];
      const text = `${title} ${a.docAbstract ?? ""}`.toLowerCase();
      const allTopics: Topic[] = [
        "Healthcare", "Housing", "Labor", "Disability", "Immigration",
        "Environment", "Education", "Veterans", "Small Business",
      ];
      for (const t of allTopics) {
        if (text.includes(t.toLowerCase())) inferredTopics.push(t);
      }
      // Always include at least the user-selected topics that hit
      for (const t of topics) {
        if (text.includes(t.toLowerCase()) && !inferredTopics.includes(t)) {
          inferredTopics.push(t);
        }
      }
      return {
        id: it.id,
        agencyId: a.agencyId ?? "—",
        agencyName: agencyDisplayName(a.agencyId ?? "—"),
        title,
        summary,
        documentType: a.documentType ?? "Proposed Rule",
        postedDate: a.postedDate?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
        commentEndDate:
          a.commentEndDate?.slice(0, 10) ??
          new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
        topics: inferredTopics.length > 0 ? inferredTopics : topics.slice(0, 1),
        regulationsGovUrl: `https://www.regulations.gov/document/${it.id}`,
        source: "api" as const,
      };
    });
}

function truncate(s: string, n: number): string {
  if (s.length <= n) return s;
  return s.slice(0, n).replace(/\s+\S*$/, "") + "…";
}
