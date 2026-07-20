"use client";

import React, { useRef, useState, useEffect } from "react";
import styled from "styled-components";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Bell, LogOut, ChevronDown, User, Mail, Shield, ChevronsUpDown, ArrowLeftRight, Menu } from "lucide-react";
import { useAuthStore } from "@/stores/AuthStore";
import { useMemberStore } from "@/stores/MemberStore";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { logout, memberGetProfile, partnerGetProfile, memberListPartners, getMe } from "@/imports/core/api";
import { toast } from "react-toastify";

// ─── Styled Components ───────────────────────────────────────────────────────

const Bar = styled.header`
  height: 64px;
  background: #fff;
  border-bottom: 1px solid var(--ec-border-subtle, #e8eaf0);
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 0 28px;
  position: sticky;
  top: 0;
  z-index: 10;

  @media (max-width: 720px) {
    gap: 10px;
    padding: 0 14px;
  }
`;

const MenuBtn = styled.button`
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--ec-text-body, #374151);
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  flex-shrink: 0;

  &:hover {
    background: #f4f6fb;
  }

  @media (max-width: 880px) {
    display: flex;
  }
`;

const TitleArea = styled.div`
  flex: 1;
  min-width: 0;
`;

const Title = styled.h1`
  font-size: 19px;
  font-weight: 800;
  margin: 0;
  letter-spacing: -0.02em;
  color: var(--ec-text-strong, #0f172a);
`;

const Subtitle = styled.div`
  font-size: 12.5px;
  color: var(--ec-text-muted, #64748b);
  margin-top: 1px;
`;

const SearchBar = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 280px;
  height: 40px;
  padding: 0 14px;
  background: var(--ec-bg, #f4f6fb);
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  color: var(--ec-text-muted, #64748b);
  flex-shrink: 0;

  span {
    font-size: 13.5px;
    color: var(--ec-text-muted, #64748b);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  @media (max-width: 640px) {
    display: none;
  }
`;

const Right = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const IconBtn = styled.button`
  background: #fff;
  border: 1px solid var(--ec-border-subtle, #e8eaf0);
  cursor: pointer;
  color: var(--ec-text-body, #374151);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  transition: all 0.15s;
  position: relative;

  &:hover {
    background: #f5f3ff;
    border-color: #ede9fe;
    color: #7c3aed;
  }
`;

const Badge = styled.span`
  position: absolute;
  top: 5px;
  right: 5px;
  background: #ef4444;
  color: #fff;
  font-size: 0.6rem;
  font-weight: 700;
  border-radius: 999px;
  min-width: 14px;
  height: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 3px;
  border: 2px solid #fff;
`;

const UserPill = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 10px 5px 7px;
  border-radius: 9px;
  border: 1px solid #f0eff6;
  background: none;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    background: #f5f3ff;
    border-color: #ede9fe;
  }
`;

const Avatar = styled.div`
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: linear-gradient(135deg, #7c3aed, #6d28d9);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 0.8rem;
  font-weight: 700;
  flex-shrink: 0;
`;

const UserName = styled.span`
  font-size: 0.8rem;
  font-weight: 600;
  color: #374151;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  @media (max-width: 480px) {
    display: none;
  }
`;

// ─── Profile Dropdown ────────────────────────────────────────────────────────

const DropWrap = styled.div`
  position: relative;
`;

const DropMenu = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 240px;
  max-width: calc(100vw - 24px);
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.1);
  z-index: 100;
  overflow: hidden;
`;

const DropHeader = styled.div`
  padding: 14px 16px 12px;
  border-bottom: 1px solid #f3f4f6;
`;

const DropName = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const DropEmail = styled.div`
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 2px;
  display: flex;
  align-items: center;
  gap: 5px;
`;

const RoleBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #7c3aed;
  background: #f5f3ff;
  border: 1px solid #ede9fe;
  border-radius: 6px;
  padding: 2px 7px;
  margin-top: 6px;
`;

const DropItem = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.8125rem;
  color: #374151;
  text-align: left;
  transition: background 0.1s;

  &:hover {
    background: #f9fafb;
  }

  &.danger {
    color: #dc2626;
    &:hover { background: #fef2f2; }
  }
`;

// ─── Partner Switcher ────────────────────────────────────────────────────────

const PartnerSwitcher = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border-radius: 9px;
  border: 1px solid #e5e7eb;
  background: #fafafa;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 500;
  color: #374151;
  transition: all 0.15s;
  max-width: 180px;

  &:hover {
    background: #f5f3ff;
    border-color: #ede9fe;
    color: #7c3aed;
  }

  @media (max-width: 560px) {
    max-width: 110px;
  }
`;

const PartnerLabel = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
`;

const SwitcherMenu = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 200px;
  max-width: calc(100vw - 24px);
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.1);
  z-index: 100;
  overflow: hidden;
`;

const SwitcherItem = styled.button<{ $active?: boolean }>`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1px;
  padding: 10px 14px;
  background: ${({ $active }) => ($active ? "#f5f3ff" : "none")};
  border: none;
  border-bottom: 1px solid #f3f4f6;
  cursor: pointer;
  text-align: left;
  transition: background 0.1s;

  &:last-child { border-bottom: none; }

  &:hover {
    background: #f5f3ff;
  }
`;

const SwitcherItemName = styled.span`
  font-size: 0.8125rem;
  font-weight: 600;
  color: #111827;
`;

const SwitcherItemSub = styled.span`
  font-size: 0.7rem;
  color: #9ca3af;
`;

// ─── Constants ───────────────────────────────────────────────────────────────

const PORTAL_LABELS: Record<string, string> = {
  SUPERADMIN: "Admin",
  PARTNER: "Partner",
  MEMBER: "Member",
};

// ─── Props ───────────────────────────────────────────────────────────────────

interface HeaderProps {
  title: string;
  subtitle?: string;
  unreadCount?: number;
  onBellClick?: () => void;
  onMenuClick?: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function Header({ title, subtitle, unreadCount = 0, onBellClick, onMenuClick }: HeaderProps) {
  const { clearAuth, accessToken, userType } = useAuthStore();
  const { activePartnerId, activePartnerName, partners, setActivePartner, setPartners } = useMemberStore();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [profileOpen, setProfileOpen] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const switcherRef = useRef<HTMLDivElement>(null);

  const isMember = userType === "MEMBER";
  const isPartner = userType === "PARTNER";
  const isAdminPortal = userType === "SUPERADMIN" || userType === "ADMIN";
  const label = userType ? PORTAL_LABELS[userType] || userType : "—";

  // Fetch profile (member or partner)
  const { data: memberProfileData } = useQuery({
    queryKey: ["header", "member-profile"],
    queryFn: memberGetProfile,
    enabled: isMember,
    staleTime: 5 * 60 * 1000,
  });

  const { data: partnerProfileData } = useQuery({
    queryKey: ["header", "partner-profile"],
    queryFn: partnerGetProfile,
    enabled: isPartner,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch member's enrolled partners
  const { data: partnersData } = useQuery({
    queryKey: ["header", "member-partners"],
    queryFn: memberListPartners,
    enabled: isMember,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch admin/superadmin's own profile — email + assigned roles
  const { data: meData } = useQuery({
    queryKey: ["header", "me"],
    queryFn: getMe,
    enabled: isAdminPortal,
    staleTime: 60 * 1000,
  });

  // Sync partners into store and pick default
  useEffect(() => {
    if (!partnersData) return;
    const list: any[] = (partnersData as any)?.data ?? [];
    setPartners(list);
    if (list.length > 0 && !activePartnerId) {
      setActivePartner(list[0].partner_id, list[0].partner_name);
    }
  }, [partnersData]);

  // Resolve display name + email
  const memberProfile: any = (memberProfileData as any)?.data;
  const partnerProfile: any = (partnerProfileData as any)?.data;
  const meProfile: any = (meData as any)?.data;

  let displayName = label;
  let displayEmail = "";
  let adminRoles: string[] = [];
  let isSuperadminUser = false;

  if (isMember && memberProfile) {
    displayName = memberProfile.name || memberProfile.email || label;
    displayEmail = memberProfile.email || "";
  } else if (isPartner && partnerProfile) {
    displayName = partnerProfile.name || partnerProfile.user?.name || label;
    displayEmail = partnerProfile.email || partnerProfile.user?.email || "";
  } else if (isAdminPortal && meProfile) {
    displayName = meProfile.name || meProfile.email || label;
    displayEmail = meProfile.email || "";
    adminRoles = meProfile.roles ?? [];
    isSuperadminUser = !!meProfile.is_superadmin;
  }

  const initial = displayName.charAt(0).toUpperCase();

  // Close dropdowns on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (switcherRef.current && !switcherRef.current.contains(e.target as Node)) {
        setSwitcherOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    setProfileOpen(false);
    try { if (accessToken) await logout(accessToken); } catch {}
    clearAuth();
    // Wipe every cached query (roles, permissions, lists, etc.) — otherwise the next
    // person to log in on this browser/tab can be served the previous user's stale data.
    queryClient.clear();
    toast.info("Signed out");
    router.push("/login");
  };

  const [pendingSwitch, setPendingSwitch] = useState<{ id: string; name: string | null } | null>(null);

  const handleSwitchPartner = (partnerId: string, partnerName: string | null) => {
    setSwitcherOpen(false);
    if (partnerId === activePartnerId) return;
    setPendingSwitch({ id: partnerId, name: partnerName });
  };

  const confirmSwitchPartner = () => {
    if (!pendingSwitch) return;
    setActivePartner(pendingSwitch.id, pendingSwitch.name);
    setPendingSwitch(null);
    // Reload the current page so all queries refetch with the new X-Partner-Id
    window.location.reload();
  };

  const currentPartnerName = activePartnerName || (partners[0]?.partner_name) || "My Partner";
  const multiplePartners = partners.length > 1;

  return (
    <Bar>
      <MenuBtn onClick={onMenuClick} aria-label="Open menu" title="Menu">
        <Menu size={20} />
      </MenuBtn>

      <TitleArea>
        <Title>{title}</Title>
        {subtitle && <Subtitle>{subtitle}</Subtitle>}
      </TitleArea>

      <SearchBar>
        <i className="pi pi-search" style={{ fontSize: "0.875rem", color: "var(--ec-text-muted, #64748b)" }} />
        <span>Search members, policies…</span>
      </SearchBar>

      <Right>
        {/* Partner switcher — only for members with multiple partners */}
        {isMember && multiplePartners && (
          <DropWrap ref={switcherRef}>
            <PartnerSwitcher onClick={() => setSwitcherOpen((o) => !o)}>
              <ChevronsUpDown size={14} />
              <PartnerLabel>{currentPartnerName}</PartnerLabel>
              <ChevronDown size={13} />
            </PartnerSwitcher>

            {switcherOpen && (
              <SwitcherMenu>
                {partners.map((p: any) => (
                  <SwitcherItem
                    key={p.partner_id}
                    $active={p.partner_id === activePartnerId}
                    onClick={() => handleSwitchPartner(p.partner_id, p.partner_name)}
                  >
                    <SwitcherItemName>{p.partner_name || p.partner_id}</SwitcherItemName>
                    <SwitcherItemSub>
                      {p.enrollment_status} · {p.plan?.name || "No plan"}
                    </SwitcherItemSub>
                  </SwitcherItem>
                ))}
              </SwitcherMenu>
            )}
          </DropWrap>
        )}

        {/* Bell icon */}
        {onBellClick !== undefined && (
          <IconBtn onClick={onBellClick} title="Notifications">
            <Bell size={17} />
            {unreadCount > 0 && (
              <Badge>{unreadCount > 99 ? "99+" : unreadCount}</Badge>
            )}
          </IconBtn>
        )}

        {/* Profile pill + dropdown */}
        <DropWrap ref={profileRef}>
          <UserPill onClick={() => setProfileOpen((o) => !o)}>
            <Avatar>{initial}</Avatar>
            <UserName>{displayName}</UserName>
            <ChevronDown size={13} color="#9ca3af" />
          </UserPill>

          {profileOpen && (
            <DropMenu>
              <DropHeader>
                <DropName>
                  <User size={13} />
                  {displayName}
                </DropName>
                {displayEmail && (
                  <DropEmail>
                    <Mail size={11} />
                    {displayEmail}
                  </DropEmail>
                )}
                {isAdminPortal ? (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 4 }}>
                    {isSuperadminUser ? (
                      <RoleBadge>
                        <Shield size={10} />
                        Super Admin — full access
                      </RoleBadge>
                    ) : adminRoles.length > 0 ? (
                      adminRoles.map((r) => (
                        <RoleBadge key={r}>
                          <Shield size={10} />
                          {r}
                        </RoleBadge>
                      ))
                    ) : (
                      <RoleBadge>
                        <Shield size={10} />
                        No role assigned
                      </RoleBadge>
                    )}
                  </div>
                ) : (
                  <RoleBadge>
                    <Shield size={10} />
                    {label}
                  </RoleBadge>
                )}
              </DropHeader>

              <DropItem className="danger" onClick={handleLogout}>
                <LogOut size={14} />
                Sign Out
              </DropItem>
            </DropMenu>
          )}
        </DropWrap>
      </Right>

      <Dialog
        visible={!!pendingSwitch}
        onHide={() => setPendingSwitch(null)}
        header="Switch Partner"
        style={{ width: "min(420px, 92vw)" }}
        modal
        draggable={false}
        footer={
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
            <Button label="Cancel" severity="secondary" outlined onClick={() => setPendingSwitch(null)} />
            <Button label="Switch" icon="pi pi-arrow-right-arrow-left" onClick={confirmSwitchPartner} />
          </div>
        }
      >
        {pendingSwitch && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: "0.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <ArrowLeftRight size={18} color="#0050b0" />
              <span style={{ fontSize: 14 }}>
                Switch to <strong>{pendingSwitch.name || "this partner"}</strong>?
              </span>
            </div>
            <div style={{ fontSize: 12.5, color: "#6b7280" }}>
              The page will reload and any unsaved changes here will be lost.
            </div>
          </div>
        )}
      </Dialog>
    </Bar>
  );
}
