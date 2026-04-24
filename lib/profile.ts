import type { UserProfile } from "./types";

const KEY = "pca:profile:v1";

export function loadProfile(): UserProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

export function saveProfile(profile: UserProfile): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(profile));
}

export function clearProfile(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}

export function cn(...parts: Array<string | undefined | false | null>): string {
  return parts.filter(Boolean).join(" ");
}
