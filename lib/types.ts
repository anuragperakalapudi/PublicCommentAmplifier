export type Topic =
  | "Healthcare"
  | "Housing"
  | "Labor"
  | "Disability"
  | "Immigration"
  | "Environment"
  | "Education"
  | "Veterans"
  | "Small Business"
  | "Civil Rights"
  | "Tax & Finance"
  | "Public Safety"
  | "Consumer Protection";

export const ALL_TOPICS: Topic[] = [
  "Healthcare",
  "Housing",
  "Labor",
  "Disability",
  "Immigration",
  "Environment",
  "Education",
  "Veterans",
  "Small Business",
  "Civil Rights",
  "Tax & Finance",
  "Public Safety",
  "Consumer Protection",
];

export type AgeRange = "18–24" | "25–34" | "35–44" | "45–54" | "55–64" | "65+";
export const AGE_RANGES: AgeRange[] = [
  "18–24",
  "25–34",
  "35–44",
  "45–54",
  "55–64",
  "65+",
];

export type IncomeBracket =
  | "Under $25k"
  | "$25k–$50k"
  | "$50k–$100k"
  | "$100k–$200k"
  | "$200k+"
  | "Prefer not to say";

export const INCOME_BRACKETS: IncomeBracket[] = [
  "Under $25k",
  "$25k–$50k",
  "$50k–$100k",
  "$100k–$200k",
  "$200k+",
  "Prefer not to say",
];

export type HouseholdStatus =
  | "Single"
  | "Married, no kids"
  | "Married with kids"
  | "Single parent"
  | "Living with family"
  | "Other";

export const HOUSEHOLD_STATUSES: HouseholdStatus[] = [
  "Single",
  "Married, no kids",
  "Married with kids",
  "Single parent",
  "Living with family",
  "Other",
];

export const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY", "DC",
];

export const US_STATE_NAMES: Record<string, string> = {
  AL: "Alabama",
  AK: "Alaska",
  AZ: "Arizona",
  AR: "Arkansas",
  CA: "California",
  CO: "Colorado",
  CT: "Connecticut",
  DE: "Delaware",
  FL: "Florida",
  GA: "Georgia",
  HI: "Hawaii",
  ID: "Idaho",
  IL: "Illinois",
  IN: "Indiana",
  IA: "Iowa",
  KS: "Kansas",
  KY: "Kentucky",
  LA: "Louisiana",
  ME: "Maine",
  MD: "Maryland",
  MA: "Massachusetts",
  MI: "Michigan",
  MN: "Minnesota",
  MS: "Mississippi",
  MO: "Missouri",
  MT: "Montana",
  NE: "Nebraska",
  NV: "Nevada",
  NH: "New Hampshire",
  NJ: "New Jersey",
  NM: "New Mexico",
  NY: "New York",
  NC: "North Carolina",
  ND: "North Dakota",
  OH: "Ohio",
  OK: "Oklahoma",
  OR: "Oregon",
  PA: "Pennsylvania",
  RI: "Rhode Island",
  SC: "South Carolina",
  SD: "South Dakota",
  TN: "Tennessee",
  TX: "Texas",
  UT: "Utah",
  VT: "Vermont",
  VA: "Virginia",
  WA: "Washington",
  WV: "West Virginia",
  WI: "Wisconsin",
  WY: "Wyoming",
  DC: "the District of Columbia",
};

export interface UserProfile {
  displayName?: string;
  ageRange: AgeRange;
  occupation: string;
  state: string;
  income: IncomeBracket;
  household: HouseholdStatus;
  topics: Topic[];
  freeTextContext?: string;
  additionalStates?: string[];
  createdAt: string;
}

export const FREE_TEXT_CONTEXT_LIMIT = 500;

export const MAX_STORIES = 5;

export interface Story {
  id: string;
  userId: string;
  title: string;
  body: string;
  tags: Topic[];
  createdAt: string;
  updatedAt: string;
}

export type RankingSignal = "more_like" | "less_like";

export interface Regulation {
  id: string;
  docketId?: string;
  agencyId: string;
  agencyName: string;
  title: string;
  summary: string;
  documentType: string;
  postedDate: string;
  commentEndDate: string;
  topics: Topic[];
  excerpt?: string;
  provisions?: string[];
  semanticScore?: number;
  regulationsGovUrl: string;
  source: "api" | "mock";
}

export interface ScoredRegulation extends Regulation {
  baseScore: number;
  score: number;
  matchedTopics: Topic[];
}
