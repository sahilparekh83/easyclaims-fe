import { create } from "zustand";
import Cookies from "js-cookie";

interface PartnerOption {
  partner_id: string;
  partner_name: string | null;
  enrollment_status: string;
  plan?: { name: string } | null;
}

interface MemberState {
  activePartnerId: string | null;
  activePartnerName: string | null;
  partners: PartnerOption[];
  setActivePartner: (partnerId: string, partnerName: string | null) => void;
  setPartners: (partners: PartnerOption[]) => void;
  clear: () => void;
}

export const useMemberStore = create<MemberState>((set) => ({
  activePartnerId: Cookies.get("ec_active_partner") || null,
  activePartnerName: Cookies.get("ec_active_partner_name") || null,
  partners: [],

  setActivePartner: (partnerId, partnerName) => {
    Cookies.set("ec_active_partner", partnerId, { expires: 1, sameSite: "strict" });
    Cookies.set("ec_active_partner_name", partnerName || "", { expires: 1, sameSite: "strict" });
    set({ activePartnerId: partnerId, activePartnerName: partnerName });
  },

  setPartners: (partners) => set({ partners }),

  clear: () => {
    Cookies.remove("ec_active_partner");
    Cookies.remove("ec_active_partner_name");
    set({ activePartnerId: null, activePartnerName: null, partners: [] });
  },
}));
