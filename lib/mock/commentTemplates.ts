import type { Regulation, UserProfile } from "../types";

const STATE_NAMES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi",
  MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire",
  NJ: "New Jersey", NM: "New Mexico", NY: "New York", NC: "North Carolina",
  ND: "North Dakota", OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania",
  RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota", TN: "Tennessee",
  TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia", WA: "Washington",
  WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming", DC: "the District of Columbia",
};

const stateName = (s: string) => STATE_NAMES[s] ?? s;

const occupationLine = (occupation: string, state: string) => {
  const o = occupation.trim();
  if (!o) return `I am writing as a resident of ${stateName(state)}.`;
  const article = /^[aeiou]/i.test(o) ? "an" : "a";
  return `I am writing as ${article} ${o} living in ${stateName(state)}.`;
};

const householdLine = (profile: UserProfile) => {
  switch (profile.household) {
    case "Married with kids":
    case "Single parent":
      return "As a parent, the cost and stability of my household budget shape every decision I make about work, healthcare, and where we can afford to live.";
    case "Married, no kids":
      return "My spouse and I weigh every change to federal policy against a household budget that has very little slack.";
    case "Living with family":
      return "Like millions of multi-generational households, ours absorbs whatever the federal system fails to do — when policy fails, family fills the gap, until it can't.";
    default:
      return "I am one of many Americans for whom federal rules like this one are not abstract — they show up in my paycheck, my health coverage, and my rent.";
  }
};

const ageLine = (profile: UserProfile) => {
  if (profile.ageRange === "65+")
    return "At my age, the stakes of this rule are not theoretical — they determine the quality of the years I have left.";
  if (profile.ageRange === "55–64")
    return "I am close enough to retirement that the long-term effects of this rule will land squarely on me, not on some future generation.";
  if (profile.ageRange === "18–24" || profile.ageRange === "25–34")
    return "I am part of the generation that will live longest under whatever rule the agency finalizes. Please weigh that horizon when you decide.";
  return "I write as someone in the middle of my working life, with both lived experience of the current system and decades ahead under whatever you decide.";
};

const incomeLine = (profile: UserProfile) => {
  if (profile.income === "Under $25k" || profile.income === "$25k–$50k")
    return "On my income, the difference between the proposed rule and the status quo is not a policy preference — it is groceries, prescriptions, or rent.";
  if (profile.income === "$50k–$100k")
    return "I am middle-income, which means I am usually invisible in this kind of process: too well-off to qualify for most assistance, too far from wealthy to absorb federal mistakes without consequence.";
  if (profile.income === "$100k–$200k")
    return "I am fortunate enough to have some financial cushion, but I write because I see how this rule will land on neighbors who do not.";
  return "";
};

export function buildComment(
  reg: Regulation,
  profile: UserProfile,
  variant: "balanced" | "shorter" | "personal" = "balanced",
): string {
  const opener = `Re: ${reg.id} — ${reg.title}`;
  const intro = occupationLine(profile.occupation, profile.state);
  const stake = householdLine(profile);
  const age = ageLine(profile);
  const income = incomeLine(profile);

  const provisionLines = (reg.provisions ?? []).slice(0, 3).map((p, i) => {
    const lead =
      i === 0
        ? "First, I want to speak directly to one provision in this proposal:"
        : i === 1
        ? "Second, I want to address another piece of this rule that affects people like me:"
        : "Finally, I want to flag one more provision that the agency should weigh carefully:";
    return `${lead} "${p}." From where I sit, this would mean a meaningful, concrete change in my day-to-day life — not in the abstract, but in the small calculations I make every week.`;
  });

  const ask =
    variant === "shorter"
      ? `For these reasons, I urge the ${reg.agencyName} to finalize the strongest possible version of this proposal, and to take seriously the lived experience of ordinary Americans, not just the structured input of well-resourced trade associations.`
      : `For these reasons, I respectfully urge the ${reg.agencyName} to (1) finalize the strongest possible version of this proposal, (2) build in the implementation timelines and protections necessary so that real people — not only entities with full-time compliance staff — can benefit, and (3) document, in the final rule's preamble, how comments like this one shaped the outcome.`;

  const close =
    "Thank you for the opportunity to participate in this rulemaking. The notice-and-comment process only works if the people who live under these rules are heard alongside the lobbyists who draft them.";

  const sig = `Respectfully,\nA member of the public — ${stateName(profile.state)}`;

  if (variant === "shorter") {
    return [opener, "", intro, stake, ...provisionLines.slice(0, 1), ask, close, sig].join("\n\n");
  }

  if (variant === "personal") {
    return [
      opener,
      "",
      intro,
      `${stake} ${age}`,
      income,
      "I am not a lobbyist. I do not have a trade association writing this for me. What I have is direct, recent experience with the system this rule touches, and I want to put that on the record.",
      ...provisionLines,
      ask,
      close,
      sig,
    ]
      .filter(Boolean)
      .join("\n\n");
  }

  return [
    opener,
    "",
    intro,
    stake,
    age,
    income,
    ...provisionLines,
    ask,
    close,
    sig,
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function commentWordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}
