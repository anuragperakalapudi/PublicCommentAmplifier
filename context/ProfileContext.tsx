"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { UserProfile } from "@/lib/types";
import { loadProfile, saveProfile, clearProfile } from "@/lib/profile";

interface ProfileContextValue {
  profile: UserProfile | null;
  hydrated: boolean;
  setProfile: (p: UserProfile) => Promise<void> | void;
  reset: () => Promise<void> | void;
}

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

const isClerkConfigured =
  !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<UserProfile | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const hydrate = async () => {
      // When configured, prefer the server profile (Supabase via /api/profile).
      // Fall back to localStorage on any non-2xx (501 not configured, 401
      // unauthenticated, network error) so the app still works locally.
      if (isClerkConfigured) {
        try {
          const r = await fetch("/api/profile");
          if (r.ok) {
            const json = (await r.json()) as { profile: UserProfile | null };
            if (!cancelled) {
              if (json.profile) {
                setProfileState(json.profile);
                // Mirror to localStorage so the rest of the app can read
                // synchronously without flicker.
                saveProfile(json.profile);
              } else {
                // 200 + null means we're authed (else we'd have 401) but
                // have no DB row yet, i.e., a brand-new account. Any
                // localStorage profile from prior testing is stale; wipe
                // it so /feed routes the user to /onboarding.
                setProfileState(null);
                clearProfile();
              }
              setHydrated(true);
              return;
            }
          }
        } catch {
          // fall through to localStorage
        }
      }
      if (cancelled) return;
      setProfileState(loadProfile());
      setHydrated(true);
    };
    hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  const setProfile = useCallback(async (p: UserProfile) => {
    saveProfile(p);
    setProfileState(p);
    if (!isClerkConfigured) return;
    try {
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: p }),
      });
    } catch {
      // localStorage already updated; the next load will retry.
    }
  }, []);

  const reset = useCallback(async () => {
    clearProfile();
    setProfileState(null);
    if (!isClerkConfigured) return;
    try {
      await fetch("/api/profile", { method: "DELETE" });
    } catch {
      // ignore
    }
  }, []);

  return (
    <ProfileContext.Provider value={{ profile, hydrated, setProfile, reset }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used within ProfileProvider");
  return ctx;
}
