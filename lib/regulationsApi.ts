import type { Regulation, Topic } from "./types";

const AGENCY_NAMES: Record<string, string> = {
  // HHS family
  HHS: "Department of Health and Human Services",
  CMS: "Centers for Medicare & Medicaid Services",
  FDA: "Food and Drug Administration",
  NIH: "National Institutes of Health",
  CDC: "Centers for Disease Control and Prevention",
  IHS: "Indian Health Service",
  ACL: "Administration for Community Living",
  ACF: "Administration for Children and Families",
  AHRQ: "Agency for Healthcare Research and Quality",
  HRSA: "Health Resources and Services Administration",
  SAMHSA: "Substance Abuse and Mental Health Services Administration",
  ASPE: "Office of the Assistant Secretary for Planning and Evaluation",

  // Labor family
  DOL: "Department of Labor",
  OSHA: "Occupational Safety and Health Administration",
  MSHA: "Mine Safety and Health Administration",
  EBSA: "Employee Benefits Security Administration",
  ETA: "Employment and Training Administration",
  OFCCP: "Office of Federal Contract Compliance Programs",
  WHD: "Wage and Hour Division",
  BLS: "Bureau of Labor Statistics",
  NLRB: "National Labor Relations Board",
  EEOC: "Equal Employment Opportunity Commission",

  // Treasury family
  TREAS: "Department of the Treasury",
  IRS: "Internal Revenue Service",
  OCC: "Office of the Comptroller of the Currency",
  FINCEN: "Financial Crimes Enforcement Network",
  TTB: "Alcohol and Tobacco Tax and Trade Bureau",
  CFPB: "Consumer Financial Protection Bureau",
  FDIC: "Federal Deposit Insurance Corporation",
  NCUA: "National Credit Union Administration",
  SEC: "Securities and Exchange Commission",
  CFTC: "Commodity Futures Trading Commission",
  FRS: "Federal Reserve System",

  // Justice family
  DOJ: "Department of Justice",
  ATF: "Bureau of Alcohol, Tobacco, Firearms and Explosives",
  DEA: "Drug Enforcement Administration",
  FBI: "Federal Bureau of Investigation",
  BOP: "Federal Bureau of Prisons",
  USMS: "U.S. Marshals Service",

  // Homeland Security family
  DHS: "Department of Homeland Security",
  USCIS: "U.S. Citizenship and Immigration Services",
  ICE: "U.S. Immigration and Customs Enforcement",
  CBP: "U.S. Customs and Border Protection",
  FEMA: "Federal Emergency Management Agency",
  TSA: "Transportation Security Administration",
  USCG: "U.S. Coast Guard",
  CISA: "Cybersecurity and Infrastructure Security Agency",
  EOIR: "Executive Office for Immigration Review",

  // Transportation family
  DOT: "Department of Transportation",
  FAA: "Federal Aviation Administration",
  FMCSA: "Federal Motor Carrier Safety Administration",
  FRA: "Federal Railroad Administration",
  FTA: "Federal Transit Administration",
  NHTSA: "National Highway Traffic Safety Administration",
  MARAD: "Maritime Administration",
  PHMSA: "Pipeline and Hazardous Materials Safety Administration",
  STB: "Surface Transportation Board",

  // Interior family
  DOI: "Department of the Interior",
  BIA: "Bureau of Indian Affairs",
  BLM: "Bureau of Land Management",
  BOEM: "Bureau of Ocean Energy Management",
  BSEE: "Bureau of Safety and Environmental Enforcement",
  FWS: "U.S. Fish and Wildlife Service",
  NPS: "National Park Service",
  OSMRE: "Office of Surface Mining Reclamation and Enforcement",
  USGS: "U.S. Geological Survey",
  BOR: "Bureau of Reclamation",

  // Commerce family
  DOC: "Department of Commerce",
  NIST: "National Institute of Standards and Technology",
  NOAA: "National Oceanic and Atmospheric Administration",
  NTIA: "National Telecommunications and Information Administration",
  USPTO: "U.S. Patent and Trademark Office",
  BIS: "Bureau of Industry and Security",
  ITA: "International Trade Administration",
  CENSUS: "U.S. Census Bureau",

  // Agriculture family
  USDA: "Department of Agriculture",
  FNS: "Food and Nutrition Service",
  FSIS: "Food Safety and Inspection Service",
  APHIS: "Animal and Plant Health Inspection Service",
  AMS: "Agricultural Marketing Service",
  FAS: "Foreign Agricultural Service",
  NRCS: "Natural Resources Conservation Service",
  ARS: "Agricultural Research Service",
  RUS: "Rural Utilities Service",
  FSA: "Farm Service Agency",

  // Education
  ED: "Department of Education",
  OCR_ED: "Office for Civil Rights (Education)",
  OSERS: "Office of Special Education and Rehabilitative Services",

  // Housing
  HUD: "Department of Housing and Urban Development",
  FHA: "Federal Housing Administration",
  GINNIE: "Government National Mortgage Association",

  // Veterans
  VA: "Department of Veterans Affairs",
  VBA: "Veterans Benefits Administration",
  VHA: "Veterans Health Administration",

  // Defense / State / Energy
  DOD: "Department of Defense",
  DOE: "Department of Energy",
  DOS: "Department of State",
  NRC: "Nuclear Regulatory Commission",
  FERC: "Federal Energy Regulatory Commission",

  // Independent agencies
  EPA: "Environmental Protection Agency",
  SBA: "Small Business Administration",
  SSA: "Social Security Administration",
  USPS: "U.S. Postal Service",
  PRC: "Postal Regulatory Commission",
  FCC: "Federal Communications Commission",
  FTC: "Federal Trade Commission",
  CPSC: "Consumer Product Safety Commission",
  OPM: "Office of Personnel Management",
  GSA: "General Services Administration",
  NSF: "National Science Foundation",
  NASA: "National Aeronautics and Space Administration",
  NARA: "National Archives and Records Administration",
  PBGC: "Pension Benefit Guaranty Corporation",
  EXIM: "Export-Import Bank",
  USAID: "U.S. Agency for International Development",
};

export function agencyDisplayName(agencyId: string): string {
  return AGENCY_NAMES[agencyId] ?? agencyId;
}

export function buildRegulationsUrl(searchTerm?: string): string {
  // Note: filter[searchTerm] does strict whole-word matching on the v4 API
  // (e.g., "healthcare" returns 0 rules even when "health" returns 10).
  // Default behavior (no searchTerm): pull a broad pool of currently-open
  // Proposed Rules and rank client-side. When the caller explicitly passes
  // a searchTerm, forward it; the feed layer falls back to a client-side
  // substring search over the cached 250-doc pool when the API returns 0.
  const params = new URLSearchParams();
  params.set("filter[documentType]", "Proposed Rule");
  params.set("filter[commentEndDate][ge]", new Date().toISOString().slice(0, 10));
  params.set("sort", "-postedDate");
  params.set("page[size]", "250");
  if (searchTerm && searchTerm.trim()) {
    params.set("filter[searchTerm]", searchTerm.trim());
  }
  return `https://api.regulations.gov/v4/documents?${params.toString()}`;
}

const AGENCY_TO_TOPICS: Record<string, Topic[]> = {
  // HHS family, Healthcare-leaning
  HHS: ["Healthcare", "Disability"],
  CMS: ["Healthcare"],
  FDA: ["Healthcare", "Consumer Protection"],
  NIH: ["Healthcare"],
  CDC: ["Healthcare", "Public Safety"],
  IHS: ["Healthcare"],
  ACL: ["Disability", "Healthcare"],
  ACF: ["Healthcare", "Civil Rights"],
  AHRQ: ["Healthcare"],
  HRSA: ["Healthcare"],
  SAMHSA: ["Healthcare", "Public Safety"],
  ASPE: ["Healthcare"],

  // Labor family
  DOL: ["Labor"],
  OSHA: ["Labor", "Healthcare", "Public Safety"],
  MSHA: ["Labor", "Public Safety"],
  EBSA: ["Labor", "Healthcare"],
  ETA: ["Labor", "Education"],
  OFCCP: ["Labor", "Civil Rights"],
  WHD: ["Labor"],
  BLS: ["Labor"],
  NLRB: ["Labor"],
  EEOC: ["Labor", "Civil Rights"],

  // Treasury / Finance family
  TREAS: ["Tax & Finance"],
  IRS: ["Tax & Finance"],
  OCC: ["Tax & Finance"],
  FINCEN: ["Tax & Finance", "Public Safety"],
  TTB: ["Tax & Finance", "Public Safety"],
  CFPB: ["Tax & Finance", "Consumer Protection"],
  FDIC: ["Tax & Finance"],
  NCUA: ["Tax & Finance"],
  SEC: ["Tax & Finance", "Consumer Protection"],
  CFTC: ["Tax & Finance"],
  FRS: ["Tax & Finance"],

  // Justice family
  DOJ: ["Civil Rights", "Public Safety"],
  ATF: ["Public Safety"],
  DEA: ["Public Safety", "Healthcare"],
  FBI: ["Public Safety"],
  BOP: ["Public Safety"],
  USMS: ["Public Safety"],

  // Homeland Security family
  DHS: ["Immigration", "Public Safety"],
  USCIS: ["Immigration"],
  ICE: ["Immigration", "Public Safety"],
  CBP: ["Immigration", "Public Safety"],
  FEMA: ["Public Safety", "Housing"],
  TSA: ["Public Safety"],
  USCG: ["Public Safety", "Environment"],
  CISA: ["Public Safety"],
  EOIR: ["Immigration"],

  // Transportation family
  DOT: ["Public Safety"],
  FAA: ["Public Safety"],
  FMCSA: ["Public Safety", "Labor"],
  FRA: ["Public Safety"],
  FTA: ["Public Safety"],
  NHTSA: ["Public Safety", "Consumer Protection"],
  MARAD: ["Public Safety"],
  PHMSA: ["Environment", "Public Safety"],
  STB: ["Public Safety"],

  // Interior family
  DOI: ["Environment"],
  BIA: ["Civil Rights", "Healthcare"],
  BLM: ["Environment"],
  BOEM: ["Environment"],
  BSEE: ["Environment", "Public Safety"],
  FWS: ["Environment"],
  NPS: ["Environment"],
  OSMRE: ["Environment", "Labor"],
  USGS: ["Environment"],
  BOR: ["Environment"],

  // Commerce family
  DOC: ["Small Business"],
  NIST: ["Consumer Protection"],
  NOAA: ["Environment"],
  NTIA: ["Consumer Protection"],
  USPTO: ["Small Business"],
  BIS: ["Small Business"],
  ITA: ["Small Business"],
  CENSUS: [],

  // Agriculture family
  USDA: ["Environment", "Small Business"],
  FNS: ["Healthcare"],
  FSIS: ["Consumer Protection", "Public Safety"],
  APHIS: ["Environment", "Consumer Protection"],
  AMS: ["Small Business"],
  FAS: ["Small Business"],
  NRCS: ["Environment"],
  ARS: ["Environment"],
  RUS: ["Housing", "Small Business"],
  FSA: ["Small Business"],

  // Education
  ED: ["Education", "Civil Rights"],
  OCR_ED: ["Civil Rights", "Education"],
  OSERS: ["Education", "Disability"],

  // Housing
  HUD: ["Housing", "Civil Rights"],
  FHA: ["Housing", "Tax & Finance"],
  GINNIE: ["Housing", "Tax & Finance"],

  // Veterans
  VA: ["Veterans", "Healthcare"],
  VBA: ["Veterans"],
  VHA: ["Veterans", "Healthcare"],

  // Defense / State / Energy
  DOD: [],
  DOE: ["Environment"],
  DOS: ["Immigration"],
  NRC: ["Environment", "Public Safety"],
  FERC: ["Environment"],

  // Independent agencies
  EPA: ["Environment"],
  SBA: ["Small Business"],
  SSA: ["Disability"],
  USPS: ["Consumer Protection"],
  PRC: ["Consumer Protection"],
  FCC: ["Consumer Protection"],
  FTC: ["Consumer Protection"],
  CPSC: ["Consumer Protection", "Public Safety"],
  OPM: ["Labor"],
  GSA: [],
  NSF: ["Education"],
  NASA: [],
  NARA: [],
  PBGC: ["Labor", "Tax & Finance"],
  EXIM: ["Small Business"],
  USAID: [],
};

interface RegulationsApiAttributes {
  agencyId?: string;
  docketId?: string;
  title?: string;
  docAbstract?: string | null;
  documentType?: string;
  postedDate?: string;
  commentEndDate?: string | null;
  withdrawn?: boolean;
  openForComment?: boolean;
}

interface RegulationsApiRelationships {
  docket?: { data?: { id?: string } | null };
}

interface RegulationsApiItem {
  id: string;
  attributes?: RegulationsApiAttributes;
  relationships?: RegulationsApiRelationships;
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
  cachedShortSummaries?: Map<string, string>,
): Regulation[] {
  return items
    .filter((it) => it && it.id && it.attributes)
    .filter((it) => !it.attributes!.withdrawn)
    .map((it) => {
      const a = it.attributes!;
      const title = a.title ?? "Untitled regulation";
      const cachedSummary = cachedShortSummaries?.get(it.id);
      const summary =
        cachedSummary ||
        (a.docAbstract && a.docAbstract.trim()) ||
        truncate(title, 240);
      const text = `${title} ${a.docAbstract ?? ""}`.toLowerCase();
      const agencyId = a.agencyId ?? "?";

      const inferredTopics = new Set<Topic>(AGENCY_TO_TOPICS[agencyId] ?? []);
      for (const topic of ALL_TOPICS_LIST) {
        const keywords = TOPIC_KEYWORDS[topic];
        if (keywords.some((k) => text.includes(k))) inferredTopics.add(topic);
      }

      const docketId =
        a.docketId ?? it.relationships?.docket?.data?.id ?? undefined;

      return {
        id: it.id,
        docketId,
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
