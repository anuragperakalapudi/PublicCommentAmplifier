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
  setProfile: (p: UserProfile) => void;
  reset: () => void;
}

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<UserProfile | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setProfileState(loadProfile());
    setHydrated(true);
  }, []);

  const setProfile = useCallback((p: UserProfile) => {
    saveProfile(p);
    setProfileState(p);
  }, []);

  const reset = useCallback(() => {
    clearProfile();
    setProfileState(null);
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
