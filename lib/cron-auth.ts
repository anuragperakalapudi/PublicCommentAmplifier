// Cron-route protection. Vercel sets x-vercel-cron when the platform's
// scheduler invokes the route; for manual triggers (curl during dev or
// from Postman) we accept a Bearer token matching CRON_SECRET.

export function isAuthorizedCron(req: Request): boolean {
  if (req.headers.get("x-vercel-cron")) return true;
  const auth = req.headers.get("authorization");
  const token = process.env.CRON_SECRET;
  return !!token && auth === `Bearer ${token}`;
}

// Returns the current "HH:00" hour in the given IANA timezone. Used by the
// digest cron to fan out to users whose preferred delivery hour matches.
export function currentHourIn(timezone: string, now: Date = new Date()): string {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "2-digit",
    hour12: false,
  });
  return fmt.format(now).padStart(2, "0").slice(0, 2);
}

export function currentDayOfWeekIn(
  timezone: string,
  now: Date = new Date(),
): number {
  // 0 = Sunday, 6 = Saturday
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
  });
  const map: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  };
  return map[fmt.format(now)] ?? 0;
}

export function isWithinQuietHours(
  timezone: string,
  startHHMM: string | null | undefined,
  endHHMM: string | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!startHHMM || !endHHMM) return false;
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(now);
  const hh = parts.find((p) => p.type === "hour")?.value ?? "00";
  const mm = parts.find((p) => p.type === "minute")?.value ?? "00";
  const cur = hh.padStart(2, "0") + mm.padStart(2, "0");
  const s = startHHMM.replace(":", "");
  const e = endHHMM.replace(":", "");
  // Window may wrap midnight (e.g., 22:00 → 07:00).
  return s <= e ? cur >= s && cur < e : cur >= s || cur < e;
}
