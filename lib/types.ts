export type Topic =
  | "Healthcare"
  | "Housing"
  | "Labor"
  | "Disability"
  | "Immigration"
  | "Environment"
  | "Education"
  | "Veterans"
  | "Small Business";

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

export interface UserProfile {
  ageRange: AgeRange;
  occupation: string;
  state: string;
  income: IncomeBracket;
  household: HouseholdStatus;
  topics: Topic[];
  createdAt: string;
}

export interface Regulation {
  id: string;
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
  regulationsGovUrl: string;
  source: "api" | "mock";
}

export interface ScoredRegulation extends Regulation {
  score: number;
  matchedTopics: Topic[];
}
