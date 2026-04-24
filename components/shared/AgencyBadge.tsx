const AGENCY_PALETTE: Record<string, { fg: string; bg: string }> = {
  CMS:   { fg: "#0E1B33", bg: "#E0E7F2" },
  HHS:   { fg: "#0E1B33", bg: "#E0E7F2" },
  DOL:   { fg: "#7C2D12", bg: "#FCEAC4" },
  HUD:   { fg: "#14532D", bg: "#DCFCE7" },
  EPA:   { fg: "#14532D", bg: "#D1FAE5" },
  ED:    { fg: "#5B21B6", bg: "#EDE9FE" },
  VA:    { fg: "#7F1D1D", bg: "#FEE2E2" },
  SBA:   { fg: "#9A3412", bg: "#FFEDD5" },
  USCIS: { fg: "#1E40AF", bg: "#DBEAFE" },
  DHS:   { fg: "#1E40AF", bg: "#DBEAFE" },
  IRS:   { fg: "#0E1B33", bg: "#EFE7D4" },
  TREAS: { fg: "#0E1B33", bg: "#EFE7D4" },
  FCC:   { fg: "#155E75", bg: "#CFFAFE" },
  FTC:   { fg: "#155E75", bg: "#CFFAFE" },
};

export function AgencyBadge({
  agencyId,
  agencyName,
  size = "sm",
}: {
  agencyId: string;
  agencyName?: string;
  size?: "sm" | "md";
}) {
  const palette = AGENCY_PALETTE[agencyId] ?? {
    fg: "#0E1B33",
    bg: "#EFE7D4",
  };
  const sizeClass =
    size === "md"
      ? "px-3 py-1.5 text-xs"
      : "px-2.5 py-1 text-[11px]";
  return (
    <span
      className={`${sizeClass} inline-flex items-center gap-1.5 rounded-full font-mono font-medium uppercase tracking-wider`}
      style={{ background: palette.bg, color: palette.fg }}
      title={agencyName}
    >
      <span
        aria-hidden
        className="h-1 w-1 rounded-full"
        style={{ background: palette.fg, opacity: 0.6 }}
      />
      {agencyId}
    </span>
  );
}
