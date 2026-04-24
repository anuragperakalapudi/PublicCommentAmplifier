import type { Regulation } from "../types";

const today = new Date();
const daysFromNow = (n: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};
const daysAgo = (n: number) => daysFromNow(-n);

export const MOCK_REGULATIONS: Regulation[] = [
  {
    id: "CMS-2026-0148-0001",
    agencyId: "CMS",
    agencyName: "Centers for Medicare & Medicaid Services",
    title:
      "Medicare Program; Permanent Coverage of Audio-Only Telehealth for Rural and Homebound Beneficiaries",
    summary:
      "Would make permanent the pandemic-era expansion of audio-only telehealth visits for Medicare beneficiaries in rural areas or with mobility limitations, including new reimbursement parity for licensed home health aides who facilitate visits.",
    documentType: "Proposed Rule",
    postedDate: daysAgo(4),
    commentEndDate: daysFromNow(18),
    topics: ["Healthcare", "Disability"],
    excerpt:
      "CMS proposes to amend 42 CFR §410.78 to permanently classify audio-only synchronous communication as a covered telehealth modality when initiated from the beneficiary's home, provided that the originating practitioner has had a qualifying in-person encounter with the beneficiary within the preceding twenty-four (24) months…",
    provisions: [
      "Permanent reimbursement for audio-only Medicare telehealth visits",
      "New billing code for home health aides facilitating remote visits",
      "Removes geographic 'originating site' restriction for behavioral health",
      "24-month in-person visit requirement before audio-only is reimbursable",
    ],
    regulationsGovUrl:
      "https://www.regulations.gov/document/CMS-2026-0148-0001",
    source: "mock",
  },
  {
    id: "DOL-2026-0079-0001",
    agencyId: "DOL",
    agencyName: "Department of Labor",
    title:
      "Independent Contractor Status Under the Fair Labor Standards Act; Reclassification Test for App-Based Workers",
    summary:
      "Reframes the six-factor 'economic reality' test that determines whether app-based and gig workers are employees or independent contractors under federal wage-and-hour law.",
    documentType: "Proposed Rule",
    postedDate: daysAgo(7),
    commentEndDate: daysFromNow(11),
    topics: ["Labor", "Small Business"],
    excerpt:
      "The Department proposes to revise 29 CFR Part 795 to clarify that algorithmic supervision, dynamic pricing controlled by the platform, and exclusivity penalties shall be weighed as evidence of an employment relationship, regardless of contractual labels…",
    provisions: [
      "Algorithmic price-setting counts as 'control' under the FLSA test",
      "Exclusivity penalties reframed as evidence of employment",
      "Carve-out preserved for genuinely entrepreneurial workers",
      "Effective 90 days after publication of the final rule",
    ],
    regulationsGovUrl:
      "https://www.regulations.gov/document/DOL-2026-0079-0001",
    source: "mock",
  },
  {
    id: "HUD-2026-0044-0001",
    agencyId: "HUD",
    agencyName: "Department of Housing and Urban Development",
    title:
      "Streamlining the Housing Choice Voucher Program; Source-of-Income Protections and Inspection Reform",
    summary:
      "Would prohibit landlords participating in HUD programs from refusing tenants based on Section 8 voucher status, and replace annual unit inspections with a biennial risk-based model.",
    documentType: "Proposed Rule",
    postedDate: daysAgo(2),
    commentEndDate: daysFromNow(27),
    topics: ["Housing"],
    excerpt:
      "HUD proposes to amend 24 CFR §982.452 to require participating Public Housing Authorities to enforce source-of-income nondiscrimination as a condition of program participation, and to adopt a risk-tiered inspection schedule for units with no prior failed inspections…",
    provisions: [
      "Source-of-income discrimination becomes federally enforceable in HUD programs",
      "Biennial inspection cycle for units passing two consecutive inspections",
      "$250 small-landlord stipend for first-time voucher participation",
      "Tenant right to a 30-day cure period before voucher termination",
    ],
    regulationsGovUrl:
      "https://www.regulations.gov/document/HUD-2026-0044-0001",
    source: "mock",
  },
  {
    id: "EPA-HQ-OW-2026-0211-0001",
    agencyId: "EPA",
    agencyName: "Environmental Protection Agency",
    title:
      "National Primary Drinking Water Regulations: PFAS Maximum Contaminant Levels for Small Public Water Systems",
    summary:
      "Sets enforceable maximum contaminant levels (MCLs) for six PFAS compounds in drinking water and creates a five-year compliance window for systems serving fewer than 10,000 people.",
    documentType: "Proposed Rule",
    postedDate: daysAgo(11),
    commentEndDate: daysFromNow(6),
    topics: ["Environment", "Healthcare"],
    excerpt:
      "EPA proposes MCLs of 4.0 ng/L for PFOA and PFOS individually, and a hazard index of 1.0 for the mixture of PFHxS, PFNA, PFBS, and HFPO-DA. Public water systems serving 3,300–10,000 persons would have until 2031 to achieve compliance…",
    provisions: [
      "4.0 ng/L MCL for PFOA and PFOS individually",
      "Hazard-index approach for four-PFAS mixture",
      "Extended compliance window for small/rural water systems",
      "Mandatory annual public reporting of detections above 2.0 ng/L",
    ],
    regulationsGovUrl:
      "https://www.regulations.gov/document/EPA-HQ-OW-2026-0211-0001",
    source: "mock",
  },
  {
    id: "ED-2026-OPE-0033-0001",
    agencyId: "ED",
    agencyName: "Department of Education",
    title:
      "Income-Driven Repayment for Federal Direct Loans; Recalculation of Discretionary Income and Forgiveness Cliff",
    summary:
      "Adjusts the formula for monthly student loan payments under the SAVE plan and shortens the time to forgiveness for original principal balances under $12,000.",
    documentType: "Proposed Rule",
    postedDate: daysAgo(5),
    commentEndDate: daysFromNow(22),
    topics: ["Education"],
    excerpt:
      "The Secretary proposes to amend 34 CFR §685.209 to set the discretionary income threshold at 250% of the federal poverty guideline (up from 225%) and to provide forgiveness after ten (10) years for borrowers whose original principal was less than $12,000…",
    provisions: [
      "Discretionary income threshold raised to 250% of poverty line",
      "Forgiveness in 10 years for original balances under $12,000",
      "Spousal-income exclusion for separately filing borrowers",
      "Auto-recertification via IRS data sharing",
    ],
    regulationsGovUrl:
      "https://www.regulations.gov/document/ED-2026-OPE-0033-0001",
    source: "mock",
  },
  {
    id: "VA-2026-VBA-0017-0001",
    agencyId: "VA",
    agencyName: "Department of Veterans Affairs",
    title:
      "Expansion of the Program of Comprehensive Assistance for Family Caregivers (PCAFC) Eligibility",
    summary:
      "Extends VA caregiver stipends to family members supporting veterans with service-connected mental health conditions, regardless of era of service.",
    documentType: "Proposed Rule",
    postedDate: daysAgo(9),
    commentEndDate: daysFromNow(13),
    topics: ["Veterans", "Healthcare", "Disability"],
    excerpt:
      "VA proposes to amend 38 CFR §71.20 to remove the 'serious injury' threshold for veterans with a service-connected mental health condition rated at 50% or higher, and to recognize chosen-family caregivers in addition to legal next of kin…",
    provisions: [
      "Removes era-of-service restriction on caregiver stipends",
      "50%-rated mental health conditions now qualify",
      "Recognizes chosen-family caregivers, not only legal next of kin",
      "Tiered stipend based on hours of weekly care provided",
    ],
    regulationsGovUrl:
      "https://www.regulations.gov/document/VA-2026-VBA-0017-0001",
    source: "mock",
  },
  {
    id: "SBA-2026-0008-0001",
    agencyId: "SBA",
    agencyName: "Small Business Administration",
    title:
      "Microloan Program Reform; Interest Rate Caps and Lender Reporting on Demographic Disparities",
    summary:
      "Caps interest rates on SBA-backed microloans at prime + 4%, and requires intermediary lenders to publish anonymized loan-approval rates by applicant demographics.",
    documentType: "Proposed Rule",
    postedDate: daysAgo(14),
    commentEndDate: daysFromNow(33),
    topics: ["Small Business"],
    excerpt:
      "SBA proposes to amend 13 CFR Part 120, Subpart G, to limit the interest rate intermediary lenders may charge to a maximum of the Wall Street Journal Prime Rate plus four percentage points, and to require quarterly demographic disparity reports…",
    provisions: [
      "Microloan interest cap at prime + 4%",
      "Quarterly public demographic disparity reports for intermediary lenders",
      "Streamlined application for loans under $25,000",
      "Technical assistance funding tied to underserved-area performance",
    ],
    regulationsGovUrl:
      "https://www.regulations.gov/document/SBA-2026-0008-0001",
    source: "mock",
  },
  {
    id: "USCIS-2026-0021-0001",
    agencyId: "USCIS",
    agencyName: "U.S. Citizenship and Immigration Services",
    title:
      "Modernizing the H-1B Specialty Occupation Visa; Wage-Tier Selection and Job-Mobility Protections",
    summary:
      "Replaces the H-1B random lottery with a wage-tier-weighted selection process and provides 60-day grace periods for visa holders changing employers.",
    documentType: "Proposed Rule",
    postedDate: daysAgo(6),
    commentEndDate: daysFromNow(15),
    topics: ["Immigration", "Labor"],
    excerpt:
      "USCIS proposes to amend 8 CFR §214.2(h) to allocate H-1B cap-subject petitions in descending order of offered wage, beginning with Wage Level IV. Beneficiaries terminated through no fault of their own would receive an automatic 60-day employment authorization grace period…",
    provisions: [
      "Wage-tier-weighted selection replaces random lottery",
      "60-day grace period for terminated H-1B holders",
      "Streamlined I-140 portability for long-pending green card applicants",
      "Mandatory employer attestation for outsourcing arrangements",
    ],
    regulationsGovUrl:
      "https://www.regulations.gov/document/USCIS-2026-0021-0001",
    source: "mock",
  },
  {
    id: "HHS-2026-ACL-0009-0001",
    agencyId: "HHS",
    agencyName: "Department of Health and Human Services",
    title:
      "Home and Community-Based Services Settings Rule; Direct Care Workforce Standards",
    summary:
      "Establishes a federal floor for home and community-based services (HCBS) wages and creates a federal training credential portable across states.",
    documentType: "Proposed Rule",
    postedDate: daysAgo(3),
    commentEndDate: daysFromNow(20),
    topics: ["Disability", "Healthcare", "Labor"],
    excerpt:
      "HHS proposes to amend 42 CFR §441.301 to require that no less than 80% of Medicaid HCBS payments be allocated to direct care worker compensation, and to recognize a portable Direct Support Professional credential issued by accredited training entities…",
    provisions: [
      "80% Medicaid HCBS pass-through to direct care worker pay",
      "Federal portable Direct Support Professional credential",
      "Right of HCBS recipients to choose their own caregiver",
      "Annual public state-level wage transparency report",
    ],
    regulationsGovUrl:
      "https://www.regulations.gov/document/HHS-2026-ACL-0009-0001",
    source: "mock",
  },
  {
    id: "CMS-2026-0231-0001",
    agencyId: "CMS",
    agencyName: "Centers for Medicare & Medicaid Services",
    title:
      "Mental Health Parity and Addiction Equity Act; Strengthened Enforcement and Network Adequacy Standards",
    summary:
      "Tightens parity rules so that insurers must demonstrate equivalent in-network access for mental health and substance use care compared to physical health.",
    documentType: "Proposed Rule",
    postedDate: daysAgo(8),
    commentEndDate: daysFromNow(9),
    topics: ["Healthcare"],
    excerpt:
      "CMS proposes to amend 45 CFR §146.136 to require quantitative network-adequacy reporting comparing mental health and substance use disorder providers to medical/surgical providers, with corrective action plans triggered by a 20% disparity…",
    provisions: [
      "Quantitative network adequacy disparity standard (≤20%)",
      "Insurer-funded reimbursement-rate study every two years",
      "Public dashboard of parity compliance by plan",
      "Right to out-of-network coverage at in-network rates if access fails",
    ],
    regulationsGovUrl:
      "https://www.regulations.gov/document/CMS-2026-0231-0001",
    source: "mock",
  },
];
