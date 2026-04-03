import { create } from "zustand";
import { supabase } from "../api/supabaseClient";
import { fetchUsage } from "../api/chatApi"; // Import fetchUsage

export const useAuthStore = create((set, get) => ({
  user: null,
  session: null,
  guestUsage: parseInt(localStorage.getItem("guest_usage") || "0"),
  usage: null, // live usage quota
  loading: true,
  showAuthModal: false,

  setShowAuthModal: (val) => set({ showAuthModal: val }),

  fetchLiveUsage: async () => {
    try {
      const data = await fetchUsage();
      set({ usage: data, guestUsage: data.role === "guest" ? data.used : get().guestUsage });
    } catch (e) {
      console.error("Failed to fetch live usage:", e);
    }
  },

  initialize: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    set({ session, user: session?.user, loading: false });

    get().fetchLiveUsage();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user });
      get().fetchLiveUsage();
    });

    return () => subscription.unsubscribe();
  },

  incrementGuestUsage: () => {
    // Kept for immediate optimistic local updates if needed, though backend is source of truth
    const newUsage = get().guestUsage + 1;
    localStorage.setItem("guest_usage", newUsage.toString());
    set({ guestUsage: newUsage });
    // Tell backend to update real usage (in background)
    get().fetchLiveUsage();
    return newUsage;
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null, usage: null });
    get().fetchLiveUsage();
  }
}));
