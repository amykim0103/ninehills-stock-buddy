import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Role } from "./types";

interface SessionState {
  role: Role | null;
  setRole: (r: Role | null) => void;
  logout: () => void;
}

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      role: null,
      setRole: (r) => set({ role: r }),
      logout: () => set({ role: null }),
    }),
    { name: "ninehill-session" }
  )
);
